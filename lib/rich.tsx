import type { ReactNode } from 'react';

/** Turns E_F, n_i, V_{bi} into proper subscripts so question text reads like a textbook. */
export function rich(text: string): ReactNode {
  const parts: ReactNode[] = [];
  const re = /([A-Za-zµεσρτ*])_(\{[^}]+\}|[A-Za-z0-9]+)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    parts.push(text.slice(last, m.index) + m[1]);
    parts.push(<sub key={i++}>{m[2].replace(/[{}]/g, '')}</sub>);
    last = m.index + m[0].length;
  }
  parts.push(text.slice(last));
  return parts;
}
