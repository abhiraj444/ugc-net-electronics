/**
 * Markdown lesson format: an incremental streaming parser that turns model Markdown into the same block
 * objects the JSON-lines format produces (see schema.ts), plus a serializer for the reverse direction.
 * Pure: no DOM, no React, only the `yaml` package, so scripts/test-lessonMd.mjs can run it under node.
 *
 *   ## Title                         -> section
 *   prose (blank line ends it)       -> paragraph (lists, **bold**, $..$, $$..$$ kept as Markdown)
 *   :::hook / :::sidenote / :::tryThis / :::describe / :::remember / :::doneWhen / :::upNext ... :::
 *   :::example Title ... :::         -> example
 *   :::guess  question / --- / reveal :::
 *   ```equation | quiz | net | figure | plot  (YAML body)
 *   ```mermaid [title]               -> diagram
 * Unit boundaries are recognised only at top level, never inside an open fence or container.
 */
import { parse as yamlParse, stringify as yamlStringify } from 'yaml';

export type MdKind = 'section' | 'paragraph' | 'container' | 'fence';
export type MdUnit = { kind: MdKind; text: string };

const FENCE = /^(\s*)(`{3,}|~{3,})\s*([\w-]*)\s*(.*)$/;
const CONTAINER_OPEN = /^:::\s*([A-Za-z][\w-]*)\s*(.*)$/;
const CONTAINER_CLOSE = /^:::\s*$/;
const countDisplay = (s: string) => (s.match(/\$\$/g) ?? []).length;

/** Splits a growing Markdown stream into finished top-level units. The unfinished tail is `partial`. */
export class MdBlockStream {
  private buf = ''; // unfinished line
  private cur: string[] = []; // lines of the open unit
  private kind: MdKind | null = null;
  private fence = ''; // closing marker of an open top-level fence
  private innerFence = ''; // a fence open inside a container
  private started = false;
  private wrapped = false; // whole answer wrapped in ```markdown ... ```

  push(chunk: string): MdUnit[] {
    this.buf += chunk.replace(/\r/g, '');
    const parts = this.buf.split('\n');
    this.buf = parts.pop() ?? '';
    const out: MdUnit[] = [];
    for (const l of parts) this.line(l, out);
    return out;
  }

  flush(): MdUnit[] {
    const out: MdUnit[] = [];
    if (this.buf) { this.line(this.buf, out); this.buf = ''; }
    this.end(out);
    return out;
  }

  /** The open unit plus the unfinished line: what the live preview shows. */
  get partial() { return [...this.cur, this.buf].join('\n').replace(/^\n+/, ''); }
  get openKind() { return this.kind; }

  private end(out: MdUnit[]) {
    if (this.kind) {
      const text = this.cur.join('\n').trim();
      if (text) out.push({ kind: this.kind, text: this.kind === 'fence' && this.fence ? text + '\n' + this.fence.trim() + '\n' + UNCLOSED : text });
    }
    this.cur = []; this.kind = null; this.fence = ''; this.innerFence = '';
  }

  private line(l: string, out: MdUnit[]) {
    const t = l.trim();
    if (!this.started) {
      if (!t) return;
      this.started = true;
      if (/^(`{3,}|~{3,})\s*(markdown|md)?\s*$/i.test(t)) { this.wrapped = true; return; }
    }
    if (this.kind === 'fence') {
      this.cur.push(l);
      if (t.startsWith(this.fence.trim()[0]) && t.replace(/[`~]/g, '') === '' && t.length >= this.fence.trim().length) { this.fence = ''; this.end(out); }
      return;
    }
    if (this.kind === 'container') {
      this.cur.push(l);
      const f = FENCE.exec(l);
      if (this.innerFence) { if (f && !f[3] && t.length >= this.innerFence.length) this.innerFence = ''; return; }
      if (f) { this.innerFence = f[2]; return; }
      if (CONTAINER_CLOSE.test(t)) this.end(out);
      return;
    }
    // top level (or inside a paragraph)
    const inMath = this.kind === 'paragraph' && countDisplay(this.cur.join('\n')) % 2 === 1;
    if (inMath) { this.cur.push(l); return; }
    if (!t) { this.end(out); return; }
    const f = FENCE.exec(l);
    if (f) {
      this.end(out);
      if (this.wrapped && !f[3] && !f[4]) return; // closing of the ```markdown wrapper
      this.kind = 'fence'; this.fence = f[2]; this.cur = [l];
      return;
    }
    if (CONTAINER_OPEN.test(t)) { this.end(out); this.kind = 'container'; this.cur = [t]; return; }
    if (CONTAINER_CLOSE.test(t)) { this.end(out); return; } // stray closer
    if (/^##\s+\S/.test(t) && !/^###/.test(t)) { this.end(out); out.push({ kind: 'section', text: t }); return; }
    if (/^#\s+\S/.test(t)) { this.end(out); return; } // lesson title: not a block
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(t)) { this.end(out); return; } // horizontal rule
    if (this.kind !== 'paragraph') { this.end(out); this.kind = 'paragraph'; }
    this.cur.push(/^###+\s+/.test(t) ? `**${t.replace(/^#+\s+/, '')}**` : l);
  }
}

const UNCLOSED = '<!-- unclosed -->';

/* ---------------- unit -> block ---------------- */

export type Converted = { ok: true; block: Record<string, unknown> } | { ok: false; error: string };

const CONTAINERS: Record<string, string> = {
  hook: 'hook', example: 'example', sidenote: 'sideNote', note: 'sideNote', guess: 'yourGuess', yourguess: 'yourGuess',
  trythis: 'tryThis', describe: 'describe', remember: 'remember', donewhen: 'doneWhen', upnext: 'upNext',
};

/** YAML double-quoted strings treat \f, \t, \n, \b, \r as escapes, which eats LaTeX (\frac, \theta, \nu...). Double the backslash first. */
export function protectTexInYaml(src: string) {
  return src.replace(/"((?:[^"\\\n]|\\.)*)"/g, (_, body: string) => '"' + body.replace(/\\(.)/g, (m, c: string) => (c === '\\' || c === '"' ? m : '\\\\' + c)) + '"');
}

function yamlOf(body: string): unknown {
  return yamlParse(protectTexInYaml(body), { strict: false, uniqueKeys: false });
}

const LETTER = (v: unknown) => (typeof v === 'string' && /^[A-Da-d]$/.test(v.trim()) ? v.trim().toUpperCase().charCodeAt(0) - 65 : v);
const str = (v: unknown) => (typeof v === 'number' ? String(v) : v);
function mcq(q: unknown) {
  if (!q || typeof q !== 'object') return q;
  const o = { ...(q as Record<string, unknown>) };
  o.answer = LETTER(o.answer);
  if (typeof o.answer === 'string' && /^\d$/.test(o.answer)) o.answer = Number(o.answer);
  if (Array.isArray(o.options)) o.options = o.options.map(str);
  if (Array.isArray(o.why)) o.why = o.why.map(str);
  if (o.numeric && typeof o.numeric === 'object') {
    const n = o.numeric as Record<string, unknown>;
    if (typeof n.answer === 'string' && !isNaN(Number(n.answer))) n.answer = Number(n.answer);
  }
  return o;
}

export function mdUnitToBlock(u: MdUnit): Converted {
  try {
    if (u.kind === 'section') return { ok: true, block: { type: 'section', title: u.text.replace(/^##\s+/, '').replace(/^\*\*(.*)\*\*$/, '$1').trim() } };
    if (u.kind === 'paragraph') return { ok: true, block: { type: 'paragraph', text: u.text.trim() } };
    const lines = u.text.split('\n');
    if (u.kind === 'container') {
      const m = CONTAINER_OPEN.exec(lines[0].trim());
      if (!m) return { ok: false, error: 'Container has no name' };
      const name = m[1].toLowerCase();
      const type = CONTAINERS[name];
      if (!type) return { ok: false, error: `Unknown container ":::${m[1]}"` };
      const closed = CONTAINER_CLOSE.test((lines[lines.length - 1] ?? '').trim()) && lines.length > 1;
      if (!closed) return { ok: false, error: `":::${m[1]}" was never closed with ":::"` };
      const body = lines.slice(1, -1).join('\n').trim();
      if (type === 'yourGuess') {
        const k = lines.slice(1, -1).findIndex((x) => /^-{3,}\s*$/.test(x.trim()));
        if (k < 0) return { ok: false, error: '":::guess" needs a "---" line between the question and the reveal' };
        const inner = lines.slice(1, -1);
        const question = inner.slice(0, k).join('\n').trim(), answer = inner.slice(k + 1).join('\n').trim();
        if (!question || !answer) return { ok: false, error: '":::guess" needs both a question and a reveal' };
        return { ok: true, block: { type, question, answer } };
      }
      if (!body) return { ok: false, error: `":::${m[1]}" is empty` };
      if (type === 'example') {
        let title = m[2].trim().replace(/^["']|["']$/g, '');
        let text = body;
        const b = /^\*\*(.+?)\*\*\.?\s*\n/.exec(body);
        if (!title && b) { title = b[1]; text = body.slice(b[0].length).trim(); }
        return { ok: true, block: { type, title: title || 'Example', text } };
      }
      if (type === 'upNext') return { ok: true, block: { type, teaser: body } };
      return { ok: true, block: { type, text: body } };
    }
    // fence
    const f = FENCE.exec(lines[0]);
    if (!f) return { ok: false, error: 'Bad fence' };
    const lang = f[3].toLowerCase();
    const info = f[4].trim();
    const unclosed = lines[lines.length - 1] === UNCLOSED;
    const bodyLines = lines.slice(1, unclosed ? -2 : -1);
    if (unclosed) return { ok: false, error: `The \`\`\`${lang} block was never closed` };
    const body = bodyLines.join('\n');
    if (lang === 'mermaid') {
      if (!body.trim()) return { ok: false, error: 'Empty mermaid block' };
      const block: Record<string, unknown> = { type: 'diagram', code: body.replace(/\s+$/, '') };
      if (info) block.title = info.replace(/^["']|["']$/g, '');
      return { ok: true, block };
    }
    if (!['equation', 'quiz', 'net', 'figure', 'plot'].includes(lang)) return { ok: false, error: `Unknown fence "${lang || '(none)'}"` };
    let y: unknown;
    try { y = yamlOf(body); } catch (e) { return { ok: false, error: `YAML in \`\`\`${lang}: ${(e as Error).message.split('\n')[0]}` }; }
    if (y === null || typeof y !== 'object') return { ok: false, error: `\`\`\`${lang} body is not a YAML mapping/list` };
    const o = y as Record<string, unknown>;
    if (lang === 'equation') return { ok: true, block: { type: 'equationCard', ...o, tex: str(o.tex), typical: str(o.typical) } };
    if (lang === 'quiz') {
      const qs = Array.isArray(y) ? y : o.questions;
      return { ok: true, block: { type: 'quiz', questions: Array.isArray(qs) ? qs.map(mcq) : qs } };
    }
    if (lang === 'net') {
      return { ok: true, block: { type: 'netCorner', ...o, questions: Array.isArray(o.questions) ? o.questions.map(mcq) : o.questions, traps: Array.isArray(o.traps) ? o.traps.map(str) : o.traps, formulaLabel: o.formulaLabel ?? o.formula_label } };
    }
    if (lang === 'figure') {
      const { id, figure, ...rest } = o;
      return { ok: true, block: { type: 'figure', figure: figure ?? id, ...rest } };
    }
    // plot
    const { title, label, ...plot } = o;
    const block: Record<string, unknown> = { type: 'figure', figure: 'plot', plot };
    if (title) block.title = title;
    if (label) block.label = label;
    return { ok: true, block };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/** Parse a whole Markdown answer at once (used for repair replies and tests). */
export function parseMd(text: string) {
  const s = new MdBlockStream();
  return [...s.push(text), ...s.flush()];
}

/* ---------------- block -> Markdown (golden example, "lesson so far") ---------------- */

const yaml = (o: unknown) => yamlStringify(o, { lineWidth: 0, defaultStringType: 'PLAIN', defaultKeyType: 'PLAIN' }).trimEnd();
const fence = (lang: string, body: string, info = '') => '```' + lang + (info ? ' ' + info : '') + '\n' + body + '\n```';
const box = (name: string, body: string, arg = '') => `:::${name}${arg ? ' ' + arg : ''}\n${body.trim()}\n:::`;

export function blockToMd(b: Record<string, unknown>): string {
  const t = b.type as string;
  const strip = (o: Record<string, unknown>) => Object.fromEntries(Object.entries(o).filter(([k, v]) => k !== 'type' && !k.startsWith('_') && v !== undefined));
  switch (t) {
    case 'section': return `## ${b.title}`;
    case 'paragraph': return String(b.text);
    case 'hook': return box('hook', String(b.text));
    case 'example': return box('example', String(b.text), String(b.title ?? ''));
    case 'sideNote': return box('sidenote', String(b.text));
    case 'yourGuess': return box('guess', `${b.question}\n---\n${b.answer}`);
    case 'tryThis': case 'describe': case 'remember': case 'doneWhen': return box(t, String(b.text));
    case 'upNext': return box('upNext', String(b.teaser));
    case 'diagram': return fence('mermaid', String(b.code), b.title ? String(b.title) : '');
    case 'equationCard': return fence('equation', yaml(strip(b)));
    case 'quiz': return fence('quiz', yaml(b.questions));
    case 'netCorner': return fence('net', yaml(strip(b)));
    case 'figure': {
      if (b.figure === 'plot') { const { plot, title, label } = b as { plot: Record<string, unknown>; title?: string; label?: string }; return fence('plot', yaml({ ...(title ? { title } : {}), ...(label ? { label } : {}), ...plot })); }
      const { figure, ...rest } = strip(b);
      return fence('figure', yaml({ id: figure, ...rest }));
    }
    case 'raw': return String(b.text);
    default: return '';
  }
}

export const blocksToMd = (bs: Record<string, unknown>[]) => bs.map(blockToMd).filter(Boolean).join('\n\n');

/* ---------------- live preview ---------------- */

const FENCE_LABEL: Record<string, string> = { mermaid: 'Drawing a diagram…', quiz: 'Writing the quiz…', net: 'Writing the NET corner…', equation: 'Writing an equation card…', figure: 'Setting up a figure…', plot: 'Setting up a plot…' };

/** Readable text for the unfinished tail of a Markdown stream. */
export function previewOfMd(partial: string) {
  const s = partial.replace(/^\s+/, '');
  if (!s) return '';
  const f = FENCE.exec(s.split('\n')[0]);
  if (f) return FENCE_LABEL[f[3].toLowerCase()] ?? 'Writing…';
  const t = s.replace(/^:::\s*[A-Za-z][\w-]*[^\n]*\n?/, '').replace(/^#+\s+/, '').replace(/\n-{3,}\n/, '\n\n');
  return t.length > 600 ? '…' + t.slice(-600) : t;
}
