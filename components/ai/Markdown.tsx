import katex from 'katex';
import type { ReactNode } from 'react';
import { rich } from '@/lib/rich';

/**
 * A small Markdown subset for AI-written text: paragraphs, "- " and "1. " lists, **bold**, *italic*,
 * `code`, [links](https://...), inline $...$ and display $$...$$ maths. No HTML is ever interpreted.
 */

function tex(src: string, display: boolean, key: number) {
  const html = katex.renderToString(src, { throwOnError: false, displayMode: display, output: 'html', strict: 'ignore' });
  return display
    ? <div key={key} className="eq-display" role="math" aria-label={src} dangerouslySetInnerHTML={{ __html: html }} />
    : <span key={key} dangerouslySetInnerHTML={{ __html: html }} />;
}

/** Inline formatting only (no paragraphs). */
export function mdInline(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let k = 0;
  // tokens: $..$ | **..** | *..* | `..` | [..](..)
  const re = /(\$(?!\$)((?:\\\$|[^$])+?)\$)|(\*\*([^*]+?)\*\*)|(\*([^*\s][^*]*?)\*)|(`([^`]+)`)|(\[([^\]]+)\]\(((?:https?:\/\/|\/)[^)\s]+)\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(<span key={k++}>{rich(text.slice(last, m.index))}</span>);
    if (m[1]) out.push(tex(m[2], false, k++));
    else if (m[3]) out.push(<strong key={k++}>{mdInline(m[4])}</strong>);
    else if (m[5]) out.push(<em key={k++}>{mdInline(m[6])}</em>);
    else if (m[7]) out.push(<code key={k++} className="rounded bg-[var(--accent-tint)] px-1 text-[0.88em]">{m[8]}</code>);
    else if (m[9]) out.push(<a key={k++} href={m[11]} target={m[11].startsWith('/') ? undefined : '_blank'} rel="noreferrer">{mdInline(m[10])}</a>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(<span key={k++}>{rich(text.slice(last))}</span>);
  return out;
}

/** Block-level Markdown: returns paragraphs, lists and display maths. */
export function Md({ text }: { text: string }) {
  const nodes: ReactNode[] = [];
  let k = 0;
  // split out display maths first so it can span lines
  const parts = text.split(/(\$\$[\s\S]+?\$\$)/g);
  for (const part of parts) {
    if (!part) continue;
    if (part.startsWith('$$') && part.endsWith('$$') && part.length > 4) { nodes.push(tex(part.slice(2, -2).trim(), true, k++)); continue; }
    for (const chunk of part.split(/\n\s*\n/)) {
      const lines = chunk.split('\n').map((l) => l.trimEnd()).filter((l) => l.trim());
      if (!lines.length) continue;
      if (lines.every((l) => /^\s*[-*]\s+/.test(l))) {
        nodes.push(<ul key={k++}>{lines.map((l, i) => <li key={i}>{mdInline(l.replace(/^\s*[-*]\s+/, ''))}</li>)}</ul>);
      } else if (lines.every((l) => /^\s*\d+[.)]\s+/.test(l))) {
        nodes.push(<ol key={k++}>{lines.map((l, i) => <li key={i}>{mdInline(l.replace(/^\s*\d+[.)]\s+/, ''))}</li>)}</ol>);
      } else {
        nodes.push(<p key={k++}>{mdInline(lines.join(' '))}</p>);
      }
    }
  }
  return <>{nodes}</>;
}

/** Every maths string in a text field; used to test-render with KaTeX before showing. */
export function mathIn(text: string): { src: string; display: boolean }[] {
  const out: { src: string; display: boolean }[] = [];
  const d = /\$\$([\s\S]+?)\$\$/g;
  let m: RegExpExecArray | null;
  while ((m = d.exec(text))) out.push({ src: m[1], display: true });
  const rest = text.replace(d, ' ');
  const i = /\$(?!\$)((?:\\\$|[^$])+?)\$/g;
  while ((m = i.exec(rest))) out.push({ src: m[1], display: false });
  return out;
}

export function katexError(src: string, display = false): string | null {
  try { katex.renderToString(src, { throwOnError: true, displayMode: display, strict: 'ignore' }); return null; } catch (e) { return (e as Error).message.replace(/^KaTeX parse error: /, ''); }
}
