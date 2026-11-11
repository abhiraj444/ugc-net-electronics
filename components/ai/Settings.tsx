'use client';
import { useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { importLessonJson } from '@/lib/ai/migrate';
import { FIGURE_MODES, setFigureMode, useFigureMode } from '@/lib/ai/figureMode';
import { db, exportAll, importAll, kvGet, kvSet, TASK_LABEL, TASKS, uid, type Profile, type Provider, type Task } from '@/lib/ai/db';
import { PARAM_FIELDS, PRESETS, errorText, listModels, parseJsonField, streamChat } from '@/lib/ai/providers';
import { disableEncryption, enableEncryption, lock, revealSecret, sealSecret } from '@/lib/ai/crypto';
import { DEFAULT_PROMPTS, getPrompts, setPrompt, getLearner, type Learner } from '@/lib/ai/prompts';
import { getGitHub, setGitHub, testGitHub, GH_DEFAULT } from '@/lib/ai/github';
import { ErrorNote, Field, SecretInput, SectionHead, UnlockBar, download, pickJsonFile, useLock } from './ui';

export default function Settings() {
  const [editing, setEditing] = useState<string | null>(null);
  useEffect(() => {
    const q = new URLSearchParams(location.search);
    const e = q.get('edit'), n = q.get('new');
    if (e) setEditing(e);
    else if (n) newProvider(n).then(setEditing);
  }, []);
  if (editing) return <ProviderEditor id={editing} onDone={() => { setEditing(null); history.replaceState(null, '', '/settings/'); }} />;
  return (
    <div className="space-y-14">
      <UnlockBar />
      <Providers onEdit={setEditing} />
      <Profiles />
      <LearnerPrefs />
      <Security />
      <GitHubSection />
      <Backup />
      <UsageLog />
      <Advanced />
    </div>
  );
}

async function newProvider(presetId: string) {
  const pr = PRESETS.find((p) => p.id === presetId) ?? PRESETS[PRESETS.length - 1];
  const p: Provider = {
    id: uid('p-'), name: pr.name, preset: pr.id, adapter: pr.adapter, baseUrl: pr.baseUrl, apiKey: '', models: [...pr.models], defaultModel: pr.models[0] ?? '',
    params: { temperature: 0.6, max_tokens: 4096 }, extraParams: '', extraHeaders: '', createdAt: Date.now(),
  };
  await db().providers.put(p);
  return p.id;
}

/* ---------------- Providers ---------------- */

function Providers({ onEdit }: { onEdit: (id: string) => void }) {
  const provs = useLiveQuery(() => db().providers.orderBy('name').toArray(), []);
  const [preset, setPreset] = useState('openrouter');
  return (
    <section aria-label="Providers">
      <SectionHead n={1} title="AI providers">Bring your own key. Calls go straight from this browser to the provider; keys stay on this device.</SectionHead>
      <ul className="mt-5 space-y-3">
        {provs?.length === 0 && <li className="rounded-2xl border border-dashed border-line px-4 py-5 text-[15px] text-muted">No providers yet. Add one below. OpenRouter or Gemini is the easiest start.</li>}
        {provs?.map((p) => (
          <li key={p.id}>
            <button onClick={() => onEdit(p.id)} className="card flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:border-[var(--line-strong)]">
              <span className="min-w-0 flex-1">
                <span className="block font-semibold leading-snug">{p.name}</span>
                <span className="mt-0.5 block truncate font-mono text-[12px] text-muted">{p.adapter} · {p.defaultModel || 'no model'} · {p.apiKey ? 'key saved' : 'no key'}</span>
              </span>
              <span className="text-[14px] font-medium text-[var(--accent-deep)]">Edit</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap items-end gap-2">
        <div className="min-w-[200px] flex-1">
          <Field label="Add a provider">{(id) => (
            <select id={id} className="field" value={preset} onChange={(e) => setPreset(e.target.value)}>
              {PRESETS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}</Field>
        </div>
        <button className="btn btn-primary" onClick={async () => onEdit(await newProvider(preset))}>Add</button>
      </div>
      {PRESETS.find((p) => p.id === preset)?.note && <p className="mt-2 text-[13.5px] text-muted">{PRESETS.find((p) => p.id === preset)!.note}</p>}
    </section>
  );
}

function jsonErr(s: string, what: string) {
  try { parseJsonField(s, what); return ''; } catch (e) { return (e as Error).message; }
}

function ProviderEditor({ id, onDone }: { id: string; onDone: () => void }) {
  const [p, setP] = useState<Provider | null>(null);
  const [key, setKey] = useState('');
  const [keyErr, setKeyErr] = useState('');
  const [newModel, setNewModel] = useState('');
  const [fetched, setFetched] = useState<string[] | null>(null);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string; hint?: string } | null>(null);
  const [testOut, setTestOut] = useState('');
  const abort = useRef<AbortController | null>(null);
  const lockState = useLock();

  useEffect(() => {
    db().providers.get(id).then(async (v) => {
      if (!v) return onDone();
      setP(v);
      try { setKey(await revealSecret(v.apiKey)); } catch (e) { setKeyErr((e as Error).message); }
    });
  }, [id, lockState?.unlocked]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!p) return <p className="text-muted">Loading…</p>;
  const set = (patch: Partial<Provider>) => setP({ ...p, ...patch });
  const xpErr = jsonErr(p.extraParams, 'Extra params');
  const xhErr = jsonErr(p.extraHeaders, 'Extra headers');

  const save = async (quiet = false) => {
    if (xpErr || xhErr) { setMsg({ ok: false, text: xpErr || xhErr }); return null; }
    try {
      const next = { ...p, apiKey: await sealSecret(key.trim()) };
      await db().providers.put(next);
      setP(next);
      if (!quiet) setMsg({ ok: true, text: 'Saved.' });
      return next;
    } catch (e) { setMsg({ ok: false, text: (e as Error).message }); return null; }
  };

  const test = async () => {
    const saved = await save(true);
    if (!saved) return;
    setBusy('test'); setMsg(null); setTestOut('');
    abort.current = new AbortController();
    try {
      const r = await streamChat(saved, saved.defaultModel, [{ role: 'user', content: 'Reply with one short sentence confirming the connection works.' }], { params: { max_tokens: 60 }, signal: abort.current.signal, onDelta: (_, full) => setTestOut(full) });
      setMsg({ ok: true, text: `Connected in ${(r.ms / 1000).toFixed(1)} s${r.outTokens ? ` · ${r.inTokens ?? '?'} in / ${r.outTokens} out tokens` : ''}.` });
    } catch (e) { const t = errorText(e); setMsg({ ok: false, text: t.msg, hint: t.hint }); }
    setBusy('');
  };

  const fetchModels = async () => {
    const saved = await save(true);
    if (!saved) return;
    setBusy('models'); setMsg(null);
    try { const ms = await listModels(saved); setFetched(ms); setMsg({ ok: true, text: `${ms.length} models found. Pick from the list or type a name.` }); }
    catch (e) { const t = errorText(e); setMsg({ ok: false, text: t.msg, hint: t.hint }); }
    setBusy('');
  };

  const addModel = (m: string) => {
    const v = m.trim();
    if (!v || p.models.includes(v)) return;
    set({ models: [...p.models, v], defaultModel: p.defaultModel || v });
    setNewModel('');
  };

  return (
    <div className="space-y-6">
      <button className="inline-flex min-h-[44px] items-center gap-1.5 text-[14px] text-muted hover:text-ink" onClick={async () => { await save(true); onDone(); }}>← All settings</button>
      <div>
        <div className="eyebrow">Provider · {p.adapter === 'openai' ? 'OpenAI-compatible' : p.adapter === 'gemini' ? 'Gemini native' : 'Anthropic Messages'}</div>
        <h2 className="mt-2 text-[26px] font-semibold leading-tight tracking-tight">{p.name || 'Untitled provider'}</h2>
      </div>
      <UnlockBar />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name">{(i) => <input id={i} className="field" value={p.name} onChange={(e) => set({ name: e.target.value })} />}</Field>
        <Field label="Adapter">{(i) => (
          <select id={i} className="field" value={p.adapter} onChange={(e) => set({ adapter: e.target.value as Provider['adapter'] })}>
            <option value="openai">OpenAI-compatible</option><option value="gemini">Gemini (native)</option><option value="anthropic">Anthropic (Messages)</option>
          </select>
        )}</Field>
      </div>
      <Field label="Base URL" hint={p.adapter === 'gemini' ? 'Calls {base}/models/{model}:streamGenerateContent?alt=sse' : p.adapter === 'anthropic' ? 'Calls {base}/messages' : 'Calls {base}/chat/completions'}>{(i) => (
        <input id={i} className="field font-mono !text-[15px]" inputMode="url" spellCheck={false} value={p.baseUrl} onChange={(e) => set({ baseUrl: e.target.value })} />
      )}</Field>
      <Field label="API key" hint={keyErr || 'Stored on this device only. Turn on the passphrase lock below to encrypt it.'}>{(i) => <SecretInput id={i} value={key} onChange={setKey} placeholder={keyErr ? 'Locked' : 'Paste your key'} />}</Field>

      <div>
        <div className="flabel">Models</div>
        <ul className="flex flex-wrap gap-2">
          {p.models.map((m) => (
            <li key={m} className={`chip !h-auto min-h-[36px] max-w-full !pr-1 ${m === p.defaultModel ? 'chip-accent' : ''}`}>
              <button className="min-w-0 truncate py-1 text-left font-mono text-[12.5px]" onClick={() => set({ defaultModel: m })} aria-pressed={m === p.defaultModel} title="Make default">{m}</button>
              <button className="grid h-8 w-8 shrink-0 place-items-center rounded-full hover:bg-[var(--accent-tint)]" aria-label={`Remove ${m}`} onClick={() => set({ models: p.models.filter((x) => x !== m), defaultModel: p.defaultModel === m ? p.models.find((x) => x !== m) ?? '' : p.defaultModel })}>×</button>
            </li>
          ))}
          {p.models.length === 0 && <li className="text-[14px] text-muted">No models yet.</li>}
        </ul>
        <p className="mt-2 text-[13px] text-muted">Tap a model to make it the default. Default: <span className="font-mono">{p.defaultModel || 'none'}</span></p>
        <div className="mt-3 flex gap-2">
          <input className="field min-w-0 flex-1 font-mono !text-[15px]" list={`models-${p.id}`} placeholder="Type or pick a model name" value={newModel} onChange={(e) => setNewModel(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addModel(newModel); }} aria-label="Model name to add" />
          <datalist id={`models-${p.id}`}>{fetched?.map((m) => <option key={m} value={m} />)}</datalist>
          <button className="btn btn-sm !min-h-[44px]" onClick={() => addModel(newModel)}>Add</button>
        </div>
        <button className="btn btn-sm mt-2" onClick={fetchModels} disabled={!!busy}>{busy === 'models' ? 'Fetching…' : 'Fetch models from provider'}</button>
      </div>

      <div>
        <div className="flabel">Default parameters <span className="text-[12.5px]">(leave blank to use the provider default)</span></div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {PARAM_FIELDS.map((f) => (
            <Field key={f.key} label={f.label}>{(i) => (
              <input id={i} className="field tnum" inputMode="decimal" placeholder={f.hint} value={p.params[f.key] ?? ''} onChange={(e) => { const params = { ...p.params }; if (e.target.value === '') delete params[f.key]; else params[f.key] = e.target.value; set({ params }); }} />
            )}</Field>
          ))}
        </div>
      </div>
      <Field label="Extra params (JSON merged into the request body; null removes a key)" hint={xpErr ? <span className="text-[var(--bad)]">{xpErr}</span> : p.adapter === 'gemini' ? 'e.g. {"generationConfig":{"thinkingConfig":{"thinkingBudget":0}}}' : p.adapter === 'openai' ? 'e.g. {"reasoning_effort":"low"} or {"stream_options":null}' : 'e.g. {"thinking":{"type":"enabled","budget_tokens":2000}}'}>{(i) => (
        <textarea id={i} className={`field ${xpErr ? 'field-err' : ''}`} spellCheck={false} value={p.extraParams} onChange={(e) => set({ extraParams: e.target.value })} placeholder="{}" />
      )}</Field>
      <Field label="Extra headers (JSON)" hint={xhErr ? <span className="text-[var(--bad)]">{xhErr}</span> : undefined}>{(i) => (
        <textarea id={i} className={`field !min-h-[64px] ${xhErr ? 'field-err' : ''}`} spellCheck={false} value={p.extraHeaders} onChange={(e) => set({ extraHeaders: e.target.value })} placeholder="{}" />
      )}</Field>

      {msg && (msg.ok ? <div className="note-good" role="status">{msg.text}</div> : <ErrorNote msg={msg.text} hint={msg.hint} />)}
      {(testOut || busy === 'test') && <div className="rounded-xl border border-line bg-card px-4 py-3"><div className="eyebrow mb-1">Reply</div><p className={busy === 'test' ? 'typing !text-[16px]' : 'font-read text-[16px]'}>{testOut}</p></div>}

      <div className="sticky bottom-[calc(58px+var(--safe-b))] z-10 -mx-4 flex flex-wrap gap-2 border-t border-line bg-[var(--ground)] px-4 py-3 md:bottom-0">
        <button className="btn btn-primary flex-1 sm:flex-none" onClick={() => save()}>Save</button>
        {busy === 'test' ? <button className="btn flex-1 sm:flex-none" onClick={() => abort.current?.abort()}>Stop</button> : <button className="btn flex-1 sm:flex-none" onClick={test} disabled={!!busy}>Test connection</button>}
        <button className="btn sm:ml-auto" onClick={async () => { if (confirm(`Delete ${p.name}?`)) { await db().providers.delete(p.id); onDone(); } }}>Delete</button>
      </div>
    </div>
  );
}

/* ---------------- Task profiles ---------------- */

function Profiles() {
  const provs = useLiveQuery(() => db().providers.toArray(), []);
  const profs = useLiveQuery(() => db().profiles.toArray(), []);
  if (!provs || !profs) return null;
  const save = (t: Task, patch: Partial<Profile>) => {
    const cur = profs.find((x) => x.task === t) ?? { task: t, providerId: '', model: '', params: {}, extraParams: '' };
    return db().profiles.put({ ...cur, ...patch });
  };
  return (
    <section aria-label="Task profiles">
      <SectionHead n={2} title="Which model does what">Each job can use a different provider, model and settings. For example, a cheap fast model for doubts and a strong one for lessons. Blank means the provider you added first, with its default model.</SectionHead>
      <div className="mt-5 space-y-3">
        {TASKS.map((t) => {
          const pf = profs.find((x) => x.task === t);
          const prov = provs.find((x) => x.id === pf?.providerId);
          const xpErr = jsonErr(pf?.extraParams ?? '', 'Extra params');
          return (
            <details key={t} className="describe group rounded-2xl border border-line bg-card">
              <summary className="flex min-h-[56px] items-center gap-3 px-4 py-2">
                <span className="chev inline-block text-muted transition-transform" aria-hidden>›</span>
                <span className="min-w-0 flex-1"><span className="block font-medium">{TASK_LABEL[t]}</span><span className="block truncate font-mono text-[12px] text-muted">{prov ? `${prov.name} · ${pf?.model || prov.defaultModel}` : 'default provider'}</span></span>
              </summary>
              <div className="grid gap-3 border-t border-line px-4 py-4 sm:grid-cols-2">
                <Field label="Provider">{(i) => (
                  <select id={i} className="field" value={pf?.providerId ?? ''} onChange={(e) => save(t, { providerId: e.target.value, model: '' })}>
                    <option value="">Default (the provider you added first)</option>
                    {provs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                )}</Field>
                <Field label="Model">{(i) => (
                  <select id={i} className="field" value={pf?.model ?? ''} onChange={(e) => save(t, { model: e.target.value })} disabled={!prov}>
                    <option value="">{prov ? `Provider default (${prov.defaultModel})` : 'Pick a provider first'}</option>
                    {prov?.models.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                )}</Field>
                <Field label="Temperature override">{(i) => <input id={i} className="field" inputMode="decimal" placeholder="provider default" value={pf?.params.temperature ?? ''} onChange={(e) => { const params = { ...(pf?.params ?? {}) }; if (e.target.value === '') delete params.temperature; else params.temperature = e.target.value; save(t, { params }); }} />}</Field>
                <Field label="Max tokens override">{(i) => <input id={i} className="field" inputMode="numeric" placeholder="provider default" value={pf?.params.max_tokens ?? ''} onChange={(e) => { const params = { ...(pf?.params ?? {}) }; if (e.target.value === '') delete params.max_tokens; else params.max_tokens = e.target.value; save(t, { params }); }} />}</Field>
                <div className="sm:col-span-2">
                  <Field label="Extra params for this job (JSON)" hint={xpErr ? <span className="text-[var(--bad)]">{xpErr}</span> : undefined}>{(i) => <textarea id={i} className={`field !min-h-[64px] ${xpErr ? 'field-err' : ''}`} spellCheck={false} placeholder="{}" defaultValue={pf?.extraParams ?? ''} onBlur={(e) => save(t, { extraParams: e.target.value })} />}</Field>
                </div>
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}

/* ---------------- Learner ---------------- */

function LearnerPrefs() {
  const [l, setL] = useState<Learner | null>(null);
  useEffect(() => { getLearner().then(setL); }, []);
  if (!l) return null;
  const set = (patch: Partial<Learner>) => { const n = { ...l, ...patch }; setL(n); kvSet('learner', n); };
  return (
    <section aria-label="Learner">
      <SectionHead n={3} title="How lessons are written for you">Sent with every generation.</SectionHead>
      <div className="mt-5 space-y-4">
        <div><div className="flabel">Level</div><div className="flex flex-wrap gap-2">{(['beginner', 'intermediate', 'exam-ready'] as const).map((v) => <button key={v} className="btn btn-sm" aria-pressed={l.level === v} onClick={() => set({ level: v })}>{v[0].toUpperCase() + v.slice(1)}</button>)}</div></div>
        <div><div className="flabel">Language</div><div className="flex flex-wrap gap-2">{(['English', 'Hinglish'] as const).map((v) => <button key={v} className="btn btn-sm" aria-pressed={l.language === v} onClick={() => set({ language: v })}>{v}</button>)}</div></div>
        <FigurePrefs />
      </div>
    </section>
  );
}

function FigurePrefs() {
  const mode = useFigureMode();
  return (
    <div aria-label="Figures and diagrams">
      <div className="flabel">Figures &amp; diagrams</div>
      <div className="flex flex-wrap gap-2">{FIGURE_MODES.map((m) => <button key={m.id} className="btn btn-sm" aria-pressed={mode === m.id} onClick={() => setFigureMode(m.id)}>{m.label}</button>)}</div>
      <p className="mt-2 text-[13.5px] text-muted">{FIGURE_MODES.find((m) => m.id === mode)?.note} Applies to reading and to new generations.</p>
    </div>
  );
}

/* ---------------- Security ---------------- */

function Security() {
  const st = useLock();
  const [a, setA] = useState(''); const [b, setB] = useState('');
  const [msg, setMsg] = useState('');
  if (!st) return null;
  return (
    <section aria-label="Passphrase lock">
      <SectionHead n={4} title="Passphrase lock">Optional. Encrypts your API keys and GitHub token with AES-GCM using a key made from your passphrase. You type it once per visit. If you forget it, you re-enter your keys.</SectionHead>
      <div className="mt-5">
        {!st.encrypted ? (
          <form className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end" onSubmit={async (e) => { e.preventDefault(); if (a.length < 6) return setMsg('Use at least 6 characters.'); if (a !== b) return setMsg('The two passphrases differ.'); await enableEncryption(a); setA(''); setB(''); setMsg('Keys are now encrypted.'); }}>
            <Field label="Passphrase">{(i) => <input id={i} className="field" type="password" autoComplete="new-password" value={a} onChange={(e) => setA(e.target.value)} />}</Field>
            <Field label="Again">{(i) => <input id={i} className="field" type="password" autoComplete="new-password" value={b} onChange={(e) => setB(e.target.value)} />}</Field>
            <button className="btn btn-primary">Encrypt keys</button>
          </form>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip chip-accent">Encrypted · {st.unlocked ? 'unlocked for this visit' : 'locked'}</span>
            {st.unlocked && <button className="btn btn-sm" onClick={lock}>Lock now</button>}
            {st.unlocked && <button className="btn btn-sm" onClick={async () => { await disableEncryption(); setMsg('Encryption turned off.'); }}>Turn off</button>}
          </div>
        )}
        {msg && <p className="mt-2 text-[14px] text-muted" role="status">{msg}</p>}
      </div>
    </section>
  );
}

/* ---------------- GitHub ---------------- */

function GitHubSection() {
  const [c, setC] = useState(GH_DEFAULT);
  const [token, setToken] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const st = useLock();
  useEffect(() => { getGitHub().then(async (g) => { setC(g); if (g.token) { try { setToken(await revealSecret(g.token)); } catch { /* locked */ } } }); }, [st?.unlocked]);
  const save = async () => { try { await setGitHub({ ...c, token: await sealSecret(token.trim()) }); return true; } catch (e) { setMsg({ ok: false, text: (e as Error).message }); return false; } };
  return (
    <section aria-label="Publish to course">
      <SectionHead n={5} title="Publish to course (GitHub)">A reviewed AI lesson can be committed to the course repo as <span className="font-mono text-[13px]">content/published/&lt;id&gt;.json</span>. After the next deploy it is a normal page for everyone. Use a fine-grained token with Contents: Read and write on this repo only.</SectionHead>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Field label="Owner">{(i) => <input id={i} className="field" value={c.owner} onChange={(e) => setC({ ...c, owner: e.target.value })} />}</Field>
        <Field label="Repository">{(i) => <input id={i} className="field" value={c.repo} onChange={(e) => setC({ ...c, repo: e.target.value })} />}</Field>
        <Field label="Branch">{(i) => <input id={i} className="field" value={c.branch} onChange={(e) => setC({ ...c, branch: e.target.value })} />}</Field>
        <div className="sm:col-span-3"><Field label="Token">{(i) => <SecretInput id={i} value={token} onChange={setToken} placeholder="github_pat_…" />}</Field></div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button className="btn btn-primary" onClick={async () => { if (await save()) setMsg({ ok: true, text: 'Saved.' }); }}>Save</button>
        <button className="btn" onClick={async () => { if (!(await save())) return; try { setMsg({ ok: true, text: await testGitHub() }); } catch (e) { setMsg({ ok: false, text: (e as Error).message }); } }}>Test</button>
      </div>
      {msg && <div className={`mt-3 ${msg.ok ? 'note-good' : 'note-bad'}`} role="status">{msg.text}</div>}
    </section>
  );
}

/* ---------------- Backup ---------------- */

function Backup() {
  const [imported, setImported] = useState('');
  const [withKeys, setWithKeys] = useState(false);
  const [msg, setMsg] = useState('');
  const exportSettings = async () => {
    const d = db();
    const providers = (await d.providers.toArray()).map((p) => (withKeys ? p : { ...p, apiKey: '' }));
    download(`bm-settings-${new Date().toISOString().slice(0, 10)}.json`, {
      app: 'beyond-memorising-settings', version: 1, providers, profiles: await d.profiles.toArray(),
      prompts: await kvGet('prompts', {}), learner: await kvGet('learner', null), crypto: withKeys ? await kvGet('crypto', null) : null,
    });
  };
  const importSettings = async () => {
    try {
      const j = await pickJsonFile();
      if (j.app !== 'beyond-memorising-settings') throw new Error('This is not a settings file. For a full backup use "Import everything".');
      const d = db();
      const provs = (j.providers as Provider[]) ?? [];
      const existing = await d.providers.toArray();
      for (const p of provs) { const old = existing.find((e) => e.id === p.id); await d.providers.put(!p.apiKey && old ? { ...p, apiKey: old.apiKey } : p); }
      await d.profiles.bulkPut((j.profiles as Profile[]) ?? []);
      if (j.prompts) await kvSet('prompts', j.prompts);
      if (j.learner) await kvSet('learner', j.learner);
      if (j.crypto) await kvSet('crypto', j.crypto);
      setMsg(`Imported ${provs.length} providers.`);
    } catch (e) { setMsg((e as Error).message); }
  };
  return (
    <section aria-label="Backup">
      <SectionHead n={6} title="Backup">Settings only, or everything: providers, AI lessons, topics, practice sets, prompts and the usage log.</SectionHead>
      <div className="mt-5 space-y-3">
        <label className="flex min-h-[44px] items-center gap-3 text-[15px]"><input type="checkbox" className="h-5 w-5 accent-[var(--accent-deep)]" checked={withKeys} onChange={(e) => setWithKeys(e.target.checked)} /> Include API keys in the settings file</label>
        <div className="flex flex-wrap gap-2">
          <button className="btn" onClick={exportSettings}>Export settings</button>
          <button className="btn" onClick={importSettings}>Import settings</button>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn" onClick={async () => download(`bm-backup-${new Date().toISOString().slice(0, 10)}.json`, await exportAll())}>Export everything</button>
          <button className="btn" onClick={async () => { try { await importAll(await pickJsonFile()); setMsg('Backup restored.'); } catch (e) { setMsg((e as Error).message); } }}>Import everything</button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="btn" onClick={async () => { try { const r = await importLessonJson(await pickJsonFile()); setMsg(`Imported lesson ${r.id}. ${r.summary}`); setImported(r.id); } catch (e) { setMsg((e as Error).message); } }}>Import lesson JSON</button>
          {imported && <a className="text-[14px] underline underline-offset-4" href={`/study/?id=${imported}`}>Open it</a>}
        </div>
        {msg && <p className="text-[14px] text-muted" role="status">{msg}</p>}
      </div>
    </section>
  );
}

/* ---------------- Usage ---------------- */

function UsageLog() {
  const rows = useLiveQuery(() => db().usage.orderBy('at').reverse().limit(40).toArray(), []);
  if (!rows) return null;
  const tin = rows.reduce((s, r) => s + (r.inTokens ?? 0), 0), tout = rows.reduce((s, r) => s + (r.outTokens ?? 0), 0);
  return (
    <section aria-label="Usage log">
      <SectionHead n={7} title="Usage log">The last 40 calls. Tokens appear when the provider reports them.</SectionHead>
      {rows.length === 0 ? <p className="mt-4 text-[15px] text-muted">Nothing yet.</p> : (
        <>
          <p className="mt-4 font-mono text-[13px] text-muted">{rows.length} calls · {tin.toLocaleString()} in · {tout.toLocaleString()} out tokens</p>
          <div className="mt-3 overflow-x-auto rounded-xl border border-line bg-card">
            <table className="w-full min-w-[520px] text-left text-[13px] tnum">
              <thead className="text-muted"><tr className="border-b border-line">{['When', 'Job', 'Model', 'In', 'Out', 'Time', ''].map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-line last:border-0">
                    <td className="whitespace-nowrap px-3 py-2">{new Date(r.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="px-3 py-2">{TASK_LABEL[r.task as Task] ?? r.task}</td>
                    <td className="max-w-[180px] truncate px-3 py-2 font-mono">{r.model}</td>
                    <td className="px-3 py-2">{r.inTokens ?? '–'}</td><td className="px-3 py-2">{r.outTokens ?? '–'}</td>
                    <td className="px-3 py-2">{r.ms ? `${(r.ms / 1000).toFixed(1)} s` : '–'}</td>
                    <td className="px-3 py-2">{r.ok ? '' : <span className="text-[var(--bad)]">failed</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="btn btn-sm mt-3" onClick={() => db().usage.clear()}>Clear log</button>
        </>
      )}
    </section>
  );
}

/* ---------------- Advanced: prompt templates ---------------- */

function Advanced() {
  const [ps, setPs] = useState<Record<string, string> | null>(null);
  const [saved, setSaved] = useState('');
  useEffect(() => { getPrompts().then(setPs); }, []);
  if (!ps) return null;
  return (
    <section aria-label="Advanced">
      <SectionHead n={8} title="Advanced: prompt templates">The exact instructions sent to the model. Words in double braces are filled in by the app. Reset to default is always there.</SectionHead>
      <div className="mt-5 space-y-3">
        {Object.entries(DEFAULT_PROMPTS).map(([k, d]) => {
          const changed = ps[k] !== d.text;
          return (
            <details key={k} className="describe group rounded-2xl border border-line bg-card">
              <summary className="flex min-h-[52px] items-center gap-3 px-4 py-2">
                <span className="chev inline-block text-muted transition-transform" aria-hidden>›</span>
                <span className="min-w-0 flex-1 font-medium">{d.label}</span>
                {changed && <span className="chip chip-accent !h-6 text-[11px]">edited</span>}
              </summary>
              <div className="border-t border-line px-4 py-4">
                <textarea className="field !min-h-[240px] !text-[13px]" spellCheck={false} value={ps[k]} onChange={(e) => setPs({ ...ps, [k]: e.target.value })} aria-label={d.label} />
                <div className="mt-2 flex flex-wrap gap-2">
                  <button className="btn btn-sm" onClick={async () => { await setPrompt(k, ps[k] === d.text ? null : ps[k]); setSaved(k); }}>Save</button>
                  <button className="btn btn-sm" disabled={!changed} onClick={async () => { await setPrompt(k, null); setPs({ ...ps, [k]: d.text }); setSaved(k); }}>Reset to default</button>
                  {saved === k && <span className="self-center text-[13px] text-muted" role="status">Saved</span>}
                </div>
              </div>
            </details>
          );
        })}
      </div>
    </section>
  );
}
