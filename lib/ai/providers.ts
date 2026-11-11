'use client';
import { db, kvGet, kvSet, type AdapterType, type Profile, type Provider, type Task } from './db';
import { revealSecret } from './crypto';

export type Msg = { role: 'system' | 'user' | 'assistant'; content: string };
export type StreamResult = { text: string; inTokens?: number; outTokens?: number; ms: number };

export const PRESETS: { id: string; name: string; adapter: AdapterType; baseUrl: string; models: string[]; note?: string }[] = [
  { id: 'openrouter', name: 'OpenRouter', adapter: 'openai', baseUrl: 'https://openrouter.ai/api/v1', models: ['google/gemini-2.5-flash', 'anthropic/claude-sonnet-4', 'openai/gpt-4.1-mini'], note: 'One key, hundreds of models. Allows browser calls.' },
  { id: 'openai', name: 'OpenAI', adapter: 'openai', baseUrl: 'https://api.openai.com/v1', models: ['gpt-4.1-mini', 'gpt-4.1'] },
  { id: 'gemini', name: 'Google Gemini', adapter: 'gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta', models: ['gemini-2.5-flash', 'gemini-2.5-pro'], note: 'Native API. Allows browser calls.' },
  { id: 'anthropic', name: 'Anthropic', adapter: 'anthropic', baseUrl: 'https://api.anthropic.com/v1', models: ['claude-sonnet-4-20250514'], note: 'Sends the direct-browser-access header.' },
  { id: 'xai', name: 'xAI Grok', adapter: 'openai', baseUrl: 'https://api.x.ai/v1', models: ['grok-3-mini'], note: 'May block browser calls (CORS). Test first.' },
  { id: 'groq', name: 'Groq', adapter: 'openai', baseUrl: 'https://api.groq.com/openai/v1', models: ['llama-3.3-70b-versatile'] },
  { id: 'deepseek', name: 'DeepSeek', adapter: 'openai', baseUrl: 'https://api.deepseek.com/v1', models: ['deepseek-chat'] },
  { id: 'ollama', name: 'Ollama (this computer)', adapter: 'openai', baseUrl: 'http://localhost:11434/v1', models: ['llama3.1'], note: 'Start Ollama with OLLAMA_ORIGINS=* so the browser may call it.' },
  { id: 'custom', name: 'Custom (OpenAI-compatible)', adapter: 'openai', baseUrl: 'https://', models: [] },
];

export const PARAM_FIELDS: { key: string; label: string; hint: string }[] = [
  { key: 'temperature', label: 'Temperature', hint: '0 to 2' },
  { key: 'top_p', label: 'Top p', hint: '0 to 1' },
  { key: 'max_tokens', label: 'Max tokens', hint: 'e.g. 4096' },
  { key: 'top_k', label: 'Top k', hint: 'Gemini, Anthropic' },
  { key: 'frequency_penalty', label: 'Frequency penalty', hint: 'OpenAI-style' },
  { key: 'presence_penalty', label: 'Presence penalty', hint: 'OpenAI-style' },
  { key: 'seed', label: 'Seed', hint: 'optional' },
];

export class ProviderError extends Error {
  hint?: string;
  status?: number;
  constructor(msg: string, hint?: string, status?: number) { super(msg); this.hint = hint; this.status = status; }
}

export function parseJsonField(s: string, what: string): Record<string, unknown> {
  if (!s || !s.trim()) return {};
  let v: unknown;
  try { v = JSON.parse(s); } catch (e) { throw new ProviderError(`${what} is not valid JSON: ${(e as Error).message}`); }
  if (!v || typeof v !== 'object' || Array.isArray(v)) throw new ProviderError(`${what} must be a JSON object, like {"key": "value"}.`);
  return v as Record<string, unknown>;
}

/** Deep merge; a null value deletes the key (so Extra params can remove a default like stream_options). */
export function merge(a: Record<string, unknown>, b: Record<string, unknown>) {
  const out: Record<string, unknown> = { ...a };
  for (const [k, v] of Object.entries(b)) {
    if (v === null) delete out[k];
    else if (v && typeof v === 'object' && !Array.isArray(v) && out[k] && typeof out[k] === 'object' && !Array.isArray(out[k])) out[k] = merge(out[k] as Record<string, unknown>, v as Record<string, unknown>);
    else out[k] = v;
  }
  return out;
}

const num = (v: unknown) => (v === '' || v === undefined || v === null ? undefined : typeof v === 'number' ? v : isNaN(Number(v)) ? v : Number(v));
function cleanParams(p: Record<string, unknown>) {
  const o: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(p)) { const n = num(v); if (n !== undefined) o[k] = n; }
  return o;
}

/** Reads an SSE response body and yields each event's data payload. */
export async function* sse(body: ReadableStream<Uint8Array>, signal?: AbortSignal) {
  const reader = body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  try {
    while (true) {
      if (signal?.aborted) throw new DOMException('Stopped', 'AbortError');
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let idx: number;
      while ((idx = buf.search(/\r?\n\r?\n/)) >= 0) {
        const raw = buf.slice(0, idx);
        buf = buf.slice(idx + (buf[idx] === '\r' ? 4 : 2));
        const data = raw.split(/\r?\n/).filter((l) => l.startsWith('data:')).map((l) => l.slice(5).replace(/^ /, '')).join('\n');
        if (data) yield data;
      }
    }
    const tail = buf.split(/\r?\n/).filter((l) => l.startsWith('data:')).map((l) => l.slice(5).trim()).join('\n');
    if (tail) yield tail;
  } finally {
    reader.releaseLock();
  }
}

function corsHint(p: Provider) {
  return p.baseUrl.includes('localhost')
    ? 'The browser could not reach this address. Check the server is running and allows cross-origin requests (for Ollama: OLLAMA_ORIGINS=*).'
    : `The browser blocked the request or could not connect. ${p.name} may not allow direct calls from a web page (CORS). OpenRouter, OpenAI, Gemini and Anthropic do; for others, use OpenRouter or a proxy base URL.`;
}

async function doFetch(p: Provider, url: string, init: RequestInit) {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    throw new ProviderError(`Network error: ${(e as Error).message}`, corsHint(p));
  }
  if (!res.ok) {
    let body = '';
    try { body = await res.text(); } catch { /* ignore */ }
    let msg = body;
    try { const j = JSON.parse(body); msg = j.error?.message || j.error || j.message || body; } catch { /* not json */ }
    const hint = res.status === 401 || res.status === 403 ? 'The key was rejected. Check it is correct and has access to this model.' : res.status === 404 ? 'Check the base URL and the model name.' : res.status === 429 ? 'Rate limited or out of credit. Wait a moment or check your balance.' : undefined;
    throw new ProviderError(`HTTP ${res.status}: ${String(msg).slice(0, 300)}`, hint, res.status);
  }
  return res;
}

function headersFor(p: Provider, key: string): Record<string, string> {
  const extra = parseJsonField(p.extraHeaders, 'Extra headers') as Record<string, string>;
  const h: Record<string, string> = { 'content-type': 'application/json' };
  if (p.adapter === 'openai') {
    if (key) h.authorization = `Bearer ${key}`;
    if (p.baseUrl.includes('openrouter.ai')) { h['HTTP-Referer'] = typeof location !== 'undefined' ? location.origin : 'https://localhost'; h['X-Title'] = 'Beyond Memorising'; }
  } else if (p.adapter === 'gemini') {
    h['x-goog-api-key'] = key;
  } else {
    h['x-api-key'] = key;
    h['anthropic-version'] = '2023-06-01';
    h['anthropic-dangerous-direct-browser-access'] = 'true';
  }
  return { ...h, ...extra };
}

const trimSlash = (u: string) => u.replace(/\/+$/, '');

export type CallOpts = { params?: Record<string, unknown>; extraParams?: string; signal?: AbortSignal; onDelta?: (chunk: string, full: string) => void };

/** Streams one chat completion. Returns the full text and token counts when the provider reports them. */
export async function streamChat(p: Provider, model: string, messages: Msg[], o: CallOpts = {}): Promise<StreamResult> {
  const t0 = performance.now();
  const key = await revealSecret(p.apiKey);
  const params = cleanParams({ ...p.params, ...(o.params ?? {}) });
  const extra = merge(parseJsonField(p.extraParams, 'Extra params'), parseJsonField(o.extraParams ?? '', 'Extra params (task)'));
  const headers = headersFor(p, key);
  let full = '';
  let inTokens: number | undefined, outTokens: number | undefined;
  const push = (t: string) => { if (!t) return; full += t; o.onDelta?.(t, full); };
  const base = trimSlash(p.baseUrl);

  if (p.adapter === 'openai') {
    const body = merge({ model, messages, stream: true, stream_options: { include_usage: true }, ...params }, extra);
    const res = await doFetch(p, `${base}/chat/completions`, { method: 'POST', headers, body: JSON.stringify(body), signal: o.signal });
    for await (const d of sse(res.body!, o.signal)) {
      if (d === '[DONE]') break;
      let j: any; // eslint-disable-line @typescript-eslint/no-explicit-any
      try { j = JSON.parse(d); } catch { continue; }
      if (j.error) throw new ProviderError(`Provider error: ${j.error.message ?? JSON.stringify(j.error)}`);
      push(j.choices?.[0]?.delta?.content ?? '');
      if (j.usage) { inTokens = j.usage.prompt_tokens; outTokens = j.usage.completion_tokens; }
    }
  } else if (p.adapter === 'gemini') {
    const sys = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n');
    const gc: Record<string, unknown> = {};
    if (params.temperature !== undefined) gc.temperature = params.temperature;
    if (params.top_p !== undefined) gc.topP = params.top_p;
    if (params.top_k !== undefined) gc.topK = params.top_k;
    if (params.max_tokens !== undefined) gc.maxOutputTokens = params.max_tokens;
    if (params.seed !== undefined) gc.seed = params.seed;
    if (params.presence_penalty !== undefined) gc.presencePenalty = params.presence_penalty;
    if (params.frequency_penalty !== undefined) gc.frequencyPenalty = params.frequency_penalty;
    const body = merge({
      contents: messages.filter((m) => m.role !== 'system').map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
      ...(sys ? { systemInstruction: { parts: [{ text: sys }] } } : {}),
      generationConfig: gc,
    }, extra);
    const res = await doFetch(p, `${base}/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`, { method: 'POST', headers, body: JSON.stringify(body), signal: o.signal });
    for await (const d of sse(res.body!, o.signal)) {
      let j: any; // eslint-disable-line @typescript-eslint/no-explicit-any
      try { j = JSON.parse(d); } catch { continue; }
      if (j.error) throw new ProviderError(`Provider error: ${j.error.message}`);
      const parts = j.candidates?.[0]?.content?.parts ?? [];
      for (const pt of parts) if (!pt.thought) push(pt.text ?? '');
      if (j.usageMetadata) { inTokens = j.usageMetadata.promptTokenCount; outTokens = j.usageMetadata.candidatesTokenCount; }
      const fr = j.candidates?.[0]?.finishReason;
      if (fr && fr !== 'STOP' && fr !== 'MAX_TOKENS' && !full) throw new ProviderError(`Gemini stopped: ${fr}`, 'The reply was blocked. Try a different model or relax safetySettings in Extra params.');
    }
  } else {
    const sys = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n');
    const { max_tokens, temperature, top_p, top_k } = params as Record<string, number>;
    const body = merge({
      model, stream: true, max_tokens: max_tokens ?? 4096,
      ...(sys ? { system: sys } : {}),
      ...(temperature !== undefined ? { temperature } : {}), ...(top_p !== undefined ? { top_p } : {}), ...(top_k !== undefined ? { top_k } : {}),
      messages: messages.filter((m) => m.role !== 'system').map((m) => ({ role: m.role, content: m.content })),
    }, extra);
    const res = await doFetch(p, `${base}/messages`, { method: 'POST', headers, body: JSON.stringify(body), signal: o.signal });
    for await (const d of sse(res.body!, o.signal)) {
      let j: any; // eslint-disable-line @typescript-eslint/no-explicit-any
      try { j = JSON.parse(d); } catch { continue; }
      if (j.type === 'error') throw new ProviderError(`Provider error: ${j.error?.message}`);
      if (j.type === 'content_block_delta' && j.delta?.type === 'text_delta') push(j.delta.text);
      if (j.type === 'message_start') inTokens = j.message?.usage?.input_tokens;
      if (j.type === 'message_delta') outTokens = j.usage?.output_tokens;
    }
  }
  return { text: full, inTokens, outTokens, ms: Math.round(performance.now() - t0) };
}

/** Fetch the provider's model list where the API supports it. */
export async function listModels(p: Provider): Promise<string[]> {
  const key = await revealSecret(p.apiKey);
  const headers = headersFor(p, key);
  delete headers['content-type'];
  const base = trimSlash(p.baseUrl);
  if (p.adapter === 'gemini') {
    const res = await doFetch(p, `${base}/models?pageSize=200`, { headers });
    const j = await res.json();
    return (j.models ?? []).filter((m: { supportedGenerationMethods?: string[] }) => !m.supportedGenerationMethods || m.supportedGenerationMethods.includes('generateContent')).map((m: { name: string }) => m.name.replace(/^models\//, ''));
  }
  const res = await doFetch(p, `${base}/models`, { headers });
  const j = await res.json();
  return (j.data ?? j.models ?? []).map((m: { id?: string; name?: string }) => m.id ?? m.name).filter(Boolean).sort();
}

/** Resolve a task profile to a provider + model. Falls back to the first provider. */
/** Make one provider the one every job uses: sets the default and clears per-job provider overrides. */
export async function setProviderForAll(id: string) {
  const d = db();
  await kvSet('defaultProvider', id);
  const profs = await d.profiles.toArray();
  for (const p of profs) await d.profiles.put({ ...p, providerId: '', model: '' });
}

export async function resolveTask(task: Task) {
  const d = db();
  const prof = await d.profiles.get(task);
  let prov = prof?.providerId ? await d.providers.get(prof.providerId) : undefined;
  if (!prov) { const defId = await kvGet<string>('defaultProvider', ''); if (defId) prov = await d.providers.get(defId); }
  if (!prov) prov = (await d.providers.orderBy('name').toArray()).sort((a, b) => a.createdAt - b.createdAt)[0];
  if (!prov) throw new ProviderError('No AI provider yet.', 'Open Settings and add a provider with its API key.');
  const model = (prof?.providerId === prov.id && prof?.model) || prov.defaultModel || prov.models[0];
  if (!model) throw new ProviderError(`${prov.name} has no model selected.`, 'Open Settings, pick the provider and add a model.');
  return { prov, model, prof: prof as Profile | undefined };
}

/** Run a task: resolves its profile, streams, logs usage and the raw generation. */
export async function runTask(task: Task, messages: Msg[], o: CallOpts & { lessonId?: string; step?: string; promptVersion?: string } = {}) {
  const { prov, model, prof } = await resolveTask(task);
  const params = { ...(prof?.params ?? {}), ...(o.params ?? {}) };
  const d = db();
  try {
    const r = await streamChat(prov, model, messages, { ...o, params, extraParams: prof?.extraParams });
    await d.usage.add({ at: Date.now(), task, provider: prov.name, model, inTokens: r.inTokens, outTokens: r.outTokens, ms: r.ms, ok: true });
    await d.generations.add({ at: Date.now(), task, lessonId: o.lessonId, step: o.step, promptVersion: o.promptVersion ?? '', provider: prov.name, model, params: JSON.stringify(params), output: r.text, ok: true });
    return { ...r, model, provider: prov.name };
  } catch (e) {
    if ((e as Error).name !== 'AbortError') await d.usage.add({ at: Date.now(), task, provider: prov.name, model, ms: 0, ok: false });
    throw e;
  }
}

export function errorText(e: unknown) {
  if ((e as Error)?.name === 'AbortError') return { msg: 'Stopped.', hint: undefined };
  const m = (e as Error)?.message ?? String(e);
  if (/\b402\b|more credits|can only afford/i.test(m)) {
    const can = m.match(/afford (\d+)/i)?.[1];
    return { msg: 'Out of credit on this key.', hint: `The provider says the key's spending limit is nearly used${can ? ` (room for about ${can} tokens)` : ''}. Raise the key's limit or add credit on the provider's site, lower Max tokens in Settings, pick a cheaper model than auto, or switch to another provider. Details: ${m}` };
  }
  if (e instanceof ProviderError) return { msg: e.message, hint: e.hint };
  return { msg: (e as Error)?.message ?? String(e), hint: undefined };
}
