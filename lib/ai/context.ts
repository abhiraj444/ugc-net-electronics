'use client';
import golden from '@/content/golden/1-6.json';
import { UNITS, allLessons, findLesson, unitBySlug } from '@/lib/curriculum';
import { db, type AiLesson } from './db';
import { LESSON_FACTS } from './lessonFacts';
import { SCHEMA_DOC, type LessonDoc, type StoredBlock } from './schema';

const strip = (b: StoredBlock) => { const { _id, _step, _ai, _flags, ...rest } = b as StoredBlock & Record<string, unknown>; void _id; void _step; void _ai; void _flags; return rest; };

/** The golden 1.6 lesson cut down to one example of each block type, as NDJSON. */
export function goldenExample(): string {
  const blocks = (golden as unknown as LessonDoc).blocks;
  const seen = new Set<string>();
  const lines: string[] = [];
  for (const b of blocks) {
    if (seen.has(b.type) && b.type !== 'section') continue;
    if (b.type === 'section' && seen.has('section') && lines.length > 8) continue;
    seen.add(b.type);
    let o = strip(b) as Record<string, unknown>;
    if (b.type === 'describe') o = { ...o, text: (b.text as string).split('\n\n').slice(0, 2).join('\n\n') };
    if (b.type === 'quiz') o = { ...o, questions: (b.questions as unknown[]).slice(0, 1) };
    if (b.type === 'netCorner') o = { ...o, questions: (b.questions as unknown[]).slice(0, 1), traps: (b.traps as string[]).slice(0, 2) };
    lines.push(JSON.stringify(o));
  }
  return lines.join('\n');
}

async function factsFor(id: string): Promise<string> {
  const f = LESSON_FACTS[id];
  const ref = findLesson(id);
  const name = ref ? `${ref.lesson.number} ${ref.lesson.title}` : id;
  if (f) return `- ${name}\n  Remember: ${f.remember}\n  Key equations: ${f.equations.slice(0, 2).join(' ; ')}`;
  const ai = await db().lessons.get(id);
  if (ai) {
    const rem = ai.blocks.find((b) => b.type === 'remember') as { text?: string } | undefined;
    const eqs = ai.blocks.filter((b) => b.type === 'equationCard').map((b) => (b as { tex: string }).tex).slice(0, 2);
    return `- ${ai.number} ${ai.title}\n  Remember: ${rem?.text ?? '(not written yet)'}${eqs.length ? `\n  Key equations: ${eqs.join(' ; ')}` : ''}`;
  }
  return `- ${name}`;
}

export type Position = { unitTitle: string; unitScope: string; part?: string; number: string; title: string; prev?: string; next?: string; nextId?: string; existing: string[]; buildsOn: string[]; extra?: string };

/** Where a lesson sits in the syllabus. Works for official lessons and for custom topics. */
export async function positionOf(l: Pick<AiLesson, 'id' | 'unit' | 'number' | 'title' | 'buildsOn' | 'meta'>): Promise<Position> {
  const f = findLesson(l.id);
  const unit = f?.unit ?? unitBySlug(l.unit);
  const existing = unit ? allLessons(unit).map((x) => `${x.number} ${x.title}`) : UNITS.flatMap((u) => allLessons(u).slice(0, 4).map((x) => `${x.number} ${x.title}`));
  if (f) {
    const ls = allLessons(f.unit);
    const before = ls.slice(Math.max(0, f.index - 2), f.index).map((x) => x.id);
    return {
      unitTitle: `Unit ${f.unit.roman} · ${f.unit.title}`, unitScope: f.unit.scope, part: f.unit.parts.find((p) => p.lessons.includes(f.lesson))?.title,
      number: f.lesson.number, title: f.lesson.title, prev: f.prev ? `${f.prev.number} ${f.prev.title}` : undefined, next: f.next ? `${f.next.number} ${f.next.title}` : undefined, nextId: f.next?.id,
      existing, buildsOn: l.buildsOn?.length ? l.buildsOn : before,
    };
  }
  // custom topic
  const topic = l.meta?.topicId ? await db().topics.get(l.meta.topicId) : undefined;
  const siblings = topic ? await db().lessons.bulkGet(topic.lessonIds) : [];
  const idx = siblings.findIndex((s) => s?.id === l.id);
  const prev = idx > 0 ? siblings[idx - 1] : undefined, next = siblings[idx + 1];
  const anchor = topic?.anchor ? findLesson(topic.anchor) : undefined;
  return {
    unitTitle: unit ? `Unit ${unit.roman} · ${unit.title}` : 'My topics (outside the unit map)', unitScope: unit?.scope ?? '',
    part: topic ? `Added topic: ${topic.root}` : undefined, number: l.number, title: l.title,
    prev: prev ? `${prev.number} ${prev.title}` : anchor ? `${anchor.lesson.number} ${anchor.lesson.title}` : undefined,
    next: next ? `${next.number} ${next.title}` : undefined, nextId: next?.id,
    existing, buildsOn: l.buildsOn?.length ? l.buildsOn : anchor ? [anchor.lesson.id] : [],
    extra: (l as AiLesson).dek ? `Why it matters: ${(l as AiLesson).dek}` : undefined,
  };
}

/** The context pack attached to every lesson-writing call. */
export async function contextPack(l: Pick<AiLesson, 'id' | 'unit' | 'number' | 'title' | 'buildsOn' | 'meta' | 'dek'>, opts: { golden?: boolean } = { golden: true }) {
  const pos = await positionOf(l as AiLesson);
  const facts = (await Promise.all(pos.buildsOn.slice(0, 3).map(factsFor))).join('\n');
  return [
    `CURRICULUM POSITION`,
    `Syllabus: UGC NET Electronic Science (Code 88), ${pos.unitTitle}${pos.part && !pos.unitTitle.includes(pos.part) ? ` · ${pos.part}` : ''}.`,
    pos.unitScope && `Unit scope (official syllabus line): ${pos.unitScope}`,
    `This lesson: ${pos.number} "${pos.title}" (id ${l.id}).`,
    pos.extra,
    pos.prev && `Previous lesson: ${pos.prev}`,
    pos.next && `Next lesson: ${pos.next}`,
    facts && `It builds on (do not re-teach, refer back):\n${facts}`,
    `Other lessons in this unit (do not duplicate): ${pos.existing.join(' | ')}`,
    ``,
    `BLOCK SCHEMA`,
    SCHEMA_DOC,
    opts.golden !== false && `\nGOLDEN EXAMPLE (lesson 1.6, trimmed; match this voice and density)\n${goldenExample()}`,
  ].filter(Boolean).join('\n');
}
