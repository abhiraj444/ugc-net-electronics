'use client';
import type { ZodType } from 'zod';
import { katexError, mathIn } from '@/components/ai/Markdown';
import { zodMessage } from './schema';

/** Splits a growing text stream into complete lines; the unfinished tail is `partial`. */
export class LineSplitter {
  private buf = '';
  push(chunk: string): string[] {
    this.buf += chunk;
    const parts = this.buf.split('\n');
    this.buf = parts.pop() ?? '';
    return parts.map((l) => l.trim()).filter(isContent);
  }
  get partial() { return this.buf; }
  flush(): string[] { const l = this.buf.trim(); this.buf = ''; return isContent(l) ? [l] : []; }
}

function isContent(l: string) {
  if (!l) return false;
  if (/^```/.test(l)) return false; // code fences some models add anyway
  if (l === '[' || l === ']' || l === ',') return false;
  return true;
}

/** Strips trailing commas and wrapping that models sometimes add around a JSON line. */
export function cleanLine(l: string) {
  let s = l.trim();
  if (s.endsWith(',')) s = s.slice(0, -1);
  if (s.startsWith('- {')) s = s.slice(2);
  const a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a > 0 && b > a && !s.startsWith('{')) s = s.slice(a, b + 1);
  return s;
}

const TEX_KEYS = new Set(['tex', 'formula', 's']);
const SKIP_KEYS = new Set(['plot', 'params', 'numeric', 'inputs', 'type', 'figure', 'code', '_id', '_step', '_ai', '_flags']);

/** Test-render every maths string in a block with KaTeX. Returns the first error, or null. */
export function mathProblem(v: unknown, key = ''): string | null {
  if (typeof v === 'string') {
    if (TEX_KEYS.has(key)) { const e = katexError(v, key !== 's'); return e ? `${key} "${v.slice(0, 60)}": ${e}` : null; }
    for (const m of mathIn(v)) { const e = katexError(m.src, m.display); if (e) return `maths "${m.src.slice(0, 60)}": ${e}`; }
    return null;
  }
  if (Array.isArray(v)) { for (const x of v) { const e = mathProblem(x, key); if (e) return e; } return null; }
  if (v && typeof v === 'object') {
    for (const [k, x] of Object.entries(v)) { if (SKIP_KEYS.has(k)) continue; const e = mathProblem(x, k); if (e) return e; }
  }
  return null;
}

export type Checked<T> = { ok: true; value: T } | { ok: false; error: string };

/** JSON.parse + zod + KaTeX test-render. */
export function checkLine<T>(line: string, schema: ZodType<T>): Checked<T> {
  let j: unknown;
  try { j = JSON.parse(cleanLine(line)); } catch (e) { return { ok: false, error: `Invalid JSON: ${(e as Error).message}` }; }
  const r = schema.safeParse(j);
  if (!r.success) return { ok: false, error: `Schema: ${zodMessage(r.error)}` };
  const m = mathProblem(r.data);
  if (m) return { ok: false, error: `KaTeX: ${m}` };
  return { ok: true, value: r.data };
}

/** Best-effort readable text from a half-written JSON line, for the live typing preview. */
export function previewOf(partial: string) {
  const s = partial.trim();
  if (!s) return '';
  const m = s.match(/"(?:text|title|question|stem|teaser|dek)"\s*:\s*"((?:[^"\\]|\\.)*)$/) ?? s.match(/"(?:text|title|question|stem|teaser|dek)"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (m) return m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  return s.length > 160 ? '…' + s.slice(-160) : s;
}
