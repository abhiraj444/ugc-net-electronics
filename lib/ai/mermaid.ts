/** Mermaid helpers: detect Mermaid-looking text and sanitize AI-written flowcharts before rendering. Pure functions, no DOM. */

const HEADER = /^\s*(graph|flowchart)\b/i;
const OTHER_TYPES = /^\s*(sequenceDiagram|classDiagram|stateDiagram(-v2)?|erDiagram|gantt|pie|mindmap|timeline|journey)\b/;
const STYLE_LINE = /^\s*(style|classDef|linkStyle|class)\s/;

/** One line that looks like a piece of a Mermaid flowchart (used when merging split `raw` blocks). */
export function looksLikeMermaidLine(text: string) {
  const t = text.trim();
  if (!t || t.includes('**')) return false;
  return HEADER.test(t) || /^subgraph\b/.test(t) || /^end;?$/.test(t) || STYLE_LINE.test(t) || /^direction\s+(TB|TD|BT|LR|RL)\b/.test(t)
    || /(-->|---|==>|-\.->|--\s)/.test(t) && /[A-Za-z0-9_]\s*[[({]|-->|---/.test(t) && !/[.!?]\s*$/.test(t);
}

/** A whole block of text that is Mermaid code rather than prose (used for figure:"diagram" blocks). */
export function looksLikeMermaid(text: string) {
  if (!text || text.includes('**')) return false;
  if (/^\s*(graph|flowchart)\b/im.test(text) || /^\s*subgraph\b/m.test(text) || /^\s*direction\s+(TB|TD|BT|LR|RL)\s*$/m.test(text)) return true;
  const lines = text.split('\n').filter((l) => l.trim());
  return lines.length > 0 && lines.filter(looksLikeMermaidLine).length / lines.length >= 0.6;
}

const OPEN = '[({';
const CLOSE: Record<string, string> = { '[': ']', '(': ')', '{': '}' };

/** Quote every unquoted node label: H[Holes (majority)] -> H["Holes (majority)"], A(x) -> A("x"). */
const ARROW = /(\s*(?:<-->|-->|---|==>|-\.->)(?:\|[^|]*\|)?\s*)/;
const safeId = (id: string) => id.replace(/-/g, '_');

/** "A -- text --> B" -> "A -->|text| B"; a bare multi-word node "Depletion Region" -> Depletion_Region["Depletion Region"]. */
function normalizeEdges(line: string) {
  const l = line.replace(/(^|[^-<])--\s+([^>|-][^>|]*?)\s+-->/g, '$1-->|$2|').replace(/==\s+([^>|=][^>|]*?)\s+==>/g, '==>|$1|').replace(/\s*(?:-->|---|==>|-\.->)(?:\|[^|]*\|)?\s*$/, '');
  return l.split(ARROW).map((seg, k) => {
    if (k % 2) return seg;
    const t = seg.trim();
    if (/^[A-Za-z][\w-]*(\s+[A-Za-z][\w-]*)+$/.test(t) && !/^(subgraph|direction|end)\b/.test(t)) return seg.replace(t, `${safeId(t.replace(/\s+/g, '_'))}["${t}"]`);
    return seg;
  }).join('');
}

function quoteLabels(line: string) {
  line = normalizeEdges(line);
  let out = '';
  let i = 0;
  while (i < line.length) {
    if (line[i] === '|') { const e = line.indexOf('|', i + 1); const stop = e < 0 ? line.length : e + 1; out += line.slice(i, stop); i = stop; continue; }
    const m = /^[A-Za-z0-9_]+(?:-[A-Za-z0-9_]+)*/.exec(line.slice(i));
    const prev = i > 0 ? line[i - 1] : ' ';
    if (!m || /[\w"]/.test(prev)) { out += line[i]; i++; continue; }
    const id = m[0];
    let j = i + id.length;
    let opener = '';
    while (opener.length < 2 && j < line.length && OPEN.includes(line[j])) { opener += line[j]; j++; }
    if (!opener) { out += id.includes('-') ? `${safeId(id)}["${id}"]` : id; i += id.length; continue; }
    const closer = opener.split('').reverse().map((c) => CLOSE[c]).join('');
    let depth = 0, k = j, end = -1, inQ = false;
    for (; k < line.length; k++) {
      const c = line[k];
      if (c === '"') { inQ = !inQ; continue; }
      if (inQ) continue;
      if (depth === 0 && line.startsWith(closer, k)) { end = k; break; }
      if (OPEN.includes(c)) depth++;
      else if ('])}'.includes(c)) depth = Math.max(0, depth - 1);
    }
    if (end < 0) { out += line.slice(i); break; }
    const inner = line.slice(j, end).trim();
    const q = /^".*"$/.test(inner) ? inner : `"${inner.replace(/"/g, '#quot;')}"`;
    out += `${safeId(id)}${opener}${q}${closer}`;
    i = end + closer.length;
  }
  // edge labels: -->|a (b)| -> -->|"a (b)"|
  return out.replace(/\|([^|"]*[()[\]{}:;][^|"]*)\|/g, (_, t) => `|"${t.trim()}"|`);
}

/** Make AI-written Mermaid drawable: drop styling, quote labels, fix subgraph titles, balance `end`s, add a header. */
export function sanitizeMermaid(src: string) {
  const lines = src.replace(/\r/g, '').replace(/^```(?:mermaid)?\s*|```\s*$/g, '').split('\n');
  const out: string[] = [];
  let depth = 0, sg = 0;
  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');
    const t = line.trim();
    if (!t || STYLE_LINE.test(t)) continue;
    if (/^end;?$/.test(t)) { if (depth > 0) { depth--; out.push(line); } continue; }
    const s = /^(\s*)subgraph\s+(.+)$/.exec(line);
    if (s) {
      depth++;
      const rest = s[2].trim();
      const idLabel = /^([A-Za-z_][\w]*)\s*\[\s*"?(.*?)"?\s*\]$/.exec(rest);
      if (/^[A-Za-z_][\w]*$/.test(rest)) out.push(line);
      else if (idLabel) out.push(`${s[1]}subgraph ${idLabel[1]}["${idLabel[2].replace(/"/g, '#quot;')}"]`);
      else out.push(`${s[1]}subgraph sg${++sg}["${rest.replace(/^"|"$/g, '').replace(/"/g, '#quot;')}"]`);
      continue;
    }
    if (HEADER.test(t) || OTHER_TYPES.test(t) || /^direction\s/.test(t) || t.startsWith('%%')) { out.push(line); continue; }
    out.push(quoteLabels(line));
  }
  while (depth-- > 0) out.push('end');
  // drop empty subgraphs (a subgraph line straight followed by its end)
  for (let k = out.length - 2; k >= 0; k--) if (/^\s*subgraph\b/.test(out[k]) && out[k + 1].trim() === 'end') out.splice(k, 2);
  const first = out.find((l) => l.trim());
  if (!first || !(HEADER.test(first) || OTHER_TYPES.test(first))) {
    // a leading "direction LR" becomes the header direction
    const d = first && /^\s*direction\s+(TB|TD|BT|LR|RL)/.exec(first);
    if (d) out.splice(out.indexOf(first!), 1);
    out.unshift(`flowchart ${d ? d[1] : 'TD'}`);
  }
  return out.join('\n');
}
