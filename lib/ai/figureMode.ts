'use client';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, kvGet, kvSet } from './db';
import type { StoredBlock } from './schema';

/** Settings → Figures & diagrams. 'all' = interactive figures + Mermaid diagrams (default). */
export type FigureMode = 'all' | 'interactive' | 'text';
export const FIGURE_MODES: { id: FigureMode; label: string; note: string }[] = [
  { id: 'all', label: 'Interactive + diagrams', note: 'Interactive figures and drawn flowcharts.' },
  { id: 'interactive', label: 'Interactive only', note: 'Interactive figures; flowcharts and static diagrams are hidden and not written.' },
  { id: 'text', label: 'Text only', note: 'No figures or diagrams. Their written descriptions stay.' },
];
export const getFigureMode = () => kvGet<FigureMode>('figureMode', 'all');
export const setFigureMode = (m: FigureMode) => kvSet('figureMode', m);
export function useFigureMode(): FigureMode {
  return (useLiveQuery(() => db().kv.get('figureMode'), [])?.value as FigureMode | undefined) ?? 'all';
}
export function useHideDiagrams(lessonId: string): [boolean, (v: boolean) => void] {
  const v = useLiveQuery(() => db().kv.get(`hideDiagrams:${lessonId}`), [lessonId])?.value;
  return [!!v, (x: boolean) => { kvSet(`hideDiagrams:${lessonId}`, x); }];
}

const isStaticDiagram = (b: StoredBlock) => b.type === 'diagram' || (b.type === 'figure' && b.figure === 'diagram');

/** Whether a block is hidden under the current figure mode / per-lesson toggle. */
export function hiddenBy(b: StoredBlock, mode: FigureMode, hideDiagrams: boolean) {
  if (mode === 'text') return b.type === 'figure' || b.type === 'diagram' || b.type === 'tryThis';
  if (mode === 'interactive' || hideDiagrams) return isStaticDiagram(b);
  return false;
}

/** Strip figure/diagram instructions from a prompt (Text only), or the diagram ones (Interactive only). */
export function promptFor(text: string, mode: FigureMode) {
  if (mode === 'all') return text;
  let t = text.split('\n').filter((l) => !/^\{"type":"diagram"/.test(l)).join('\n')
    .replace(/A Mermaid diagram goes in ONE "diagram" block[^.]*\.[^.]*lines\. /, '')
    .replace(/, "diagram" for a Mermaid flowchart,/, ',')
    .replace(/ For anything else use a "diagram" block \(Mermaid\), not a figure\./, '')
    .replace(/figure \(or diagram\)/g, 'figure');
  if (mode === 'text') {
    t = t.split('\n').filter((l) => !/^\{"type":"(figure|tryThis|describe)"/.test(l) && !/^Figure catalogue:/.test(l) && !/^Plot expressions use/.test(l)).join('\n')
      .replace(/Exactly one section should be the interactive "Try it" section with a figure\./, 'Text only: plan no figures; set "figure" to "none" in every plan line.')
      .replace(/ Planned figure: [^.]*\./, '')
      .replace(/, and where useful one of: yourGuess \(before the figure that answers it\), tryThis \+ figure \+ describe \(always in that order\), equationCard/, ', and where useful one of: yourGuess, equationCard')
      + '\nTEXT ONLY: do not write figure, diagram, tryThis or describe blocks.';
  }
  return t;
}
