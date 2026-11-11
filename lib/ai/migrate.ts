import type { AiLesson, Issue } from './db';
import type { StoredBlock } from './schema';
import { looksLikeMermaid, looksLikeMermaidLine, sanitizeMermaid } from './mermaid';

const rawMermaid = (b: StoredBlock) => b.type === 'raw' && looksLikeMermaidLine(b.text);
const figMermaid = (b: StoredBlock) => b.type === 'figure' && b.figure === 'diagram' && !!b.diagram && looksLikeMermaid(b.diagram);
const TECH = /unparsed|invalid|json|schema|mermaid|parse/i;

/** Only style/end lines left once sanitized: nothing worth drawing. */
const drawable = (code: string) => sanitizeMermaid(code).split('\n').slice(1).some((l) => l.trim() && l.trim() !== 'end');

/**
 * Repair lessons written before the `diagram` block existed: Mermaid split into `raw` lines is merged into one
 * diagram block, figure:"diagram" blocks holding Mermaid become diagram blocks, and issues on fixed blocks are dropped.
 * Pure; returns the same object when nothing changed.
 */
export function migrateLesson<T extends Pick<AiLesson, 'blocks'> & { issues?: Issue[] }>(l: T): { lesson: T; changed: boolean; summary: string } {
  const src = l.blocks;
  const out: StoredBlock[] = [];
  const map = new Map<number, number>(); // old index -> new index (kept or converted blocks)
  const fixed = new Set<number>(); // old indices that were converted or merged
  const removed = new Set<number>();
  let merged = 0, converted = 0;
  const used = new Set<number>();

  for (let i = 0; i < src.length; i++) {
    if (used.has(i)) continue;
    const b = src[i];
    if (rawMermaid(b)) {
      // gather raw Mermaid lines in this section, stepping over other Mermaid-looking blocks
      const group = [i];
      for (let j = i + 1; j < src.length; j++) {
        const x = src[j];
        if (x.type === 'section') break;
        if (rawMermaid(x)) { group.push(j); continue; }
        if (figMermaid(x) || x.type === 'diagram') continue;
        break;
      }
      group.forEach((g) => used.add(g));
      const code = group.map((g) => (src[g] as { text: string }).text).join('\n');
      if (drawable(code)) {
        map.set(i, out.length);
        out.push({ type: 'diagram', code, _id: b._id, _step: b._step, _ai: b._ai });
        group.forEach((g) => fixed.add(g));
        group.slice(1).forEach((g) => removed.add(g));
        merged += group.length;
      } else {
        group.forEach((g) => removed.add(g)); // only style lines: nothing to draw
        merged += group.length;
      }
      continue;
    }
    if (figMermaid(b)) {
      const f = b as Extract<StoredBlock, { type: 'figure' }>;
      map.set(i, out.length);
      out.push({ type: 'diagram', code: f.diagram!, ...(f.title ? { title: f.title } : {}), ...(f.label ? { label: f.label } : {}), _id: f._id, _step: f._step, _ai: f._ai, ...(f._flags ? { _flags: f._flags } : {}) });
      fixed.add(i);
      converted++;
      continue;
    }
    map.set(i, out.length);
    out.push(b);
  }

  if (!merged && !converted) return { lesson: l, changed: false, summary: 'Nothing to repair.' };
  const issues = l.issues?.flatMap((x) => {
    if (removed.has(x.block) && !map.has(x.block)) return [];
    if (fixed.has(x.block) && TECH.test(x.problem)) return [];
    const n = map.get(x.block);
    return n === undefined ? [] : [{ ...x, block: n }];
  });
  const lesson = { ...l, blocks: out, ...(l.issues ? { issues } : {}) };
  const parts = [merged && `merged ${merged} unparsed line${merged > 1 ? 's' : ''} into diagrams`, converted && `converted ${converted} text diagram${converted > 1 ? 's' : ''}`].filter(Boolean);
  return { lesson, changed: true, summary: `Repaired: ${parts.join(', ')}.` };
}

/** Run migrateLesson on a stored lesson and save it (with a version to roll back to). */
export async function repairStoredLesson(id: string): Promise<string> {
  const { db } = await import('./db');
  const d = db();
  const l = await d.lessons.get(id);
  if (!l) return 'Lesson not found.';
  const r = migrateLesson(l);
  if (!r.changed) return r.summary;
  const versions = [{ at: Date.now(), note: 'Before repair', blocks: l.blocks }, ...l.versions].slice(0, 20);
  await d.lessons.put({ ...r.lesson, versions, updatedAt: Date.now() });
  return r.summary;
}

/** Import one exported lesson JSON (the "Export JSON" file) into this device, repaired. Returns its id. */
export async function importLessonJson(j: Record<string, unknown>): Promise<{ id: string; summary: string }> {
  if (typeof j.id !== 'string' || !Array.isArray(j.blocks) || typeof j.title !== 'string') throw new Error('This is not an exported lesson (needs id, title and blocks).');
  const { db } = await import('./db');
  const d = db();
  const old = await d.lessons.get(j.id);
  const base = j as unknown as AiLesson;
  const l: AiLesson = {
    ...base, unit: base.unit ?? '', number: base.number ?? '', dek: base.dek ?? '', netWeight: base.netWeight ?? 'Medium', minutes: base.minutes ?? 15, buildsOn: base.buildsOn ?? [],
    steps: base.steps ?? {}, status: base.status ?? 'complete', versions: [...(old ? [{ at: Date.now(), note: 'Before import', blocks: old.blocks }] : []), ...(base.versions ?? [])].slice(0, 20), updatedAt: Date.now(),
  };
  const r = migrateLesson(l);
  await d.lessons.put(r.lesson);
  return { id: l.id, summary: r.changed ? r.summary : 'No repairs needed.' };
}
