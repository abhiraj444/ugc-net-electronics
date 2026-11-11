'use client';
import type { ZodType } from 'zod';
import { findLesson, unitBySlug, allLessons } from '@/lib/curriculum';
import { db, uid, type AiLesson, type Issue, type PracticeSet, type StepState } from './db';
import { BlockSchema, CheckLineSchema, MetaLineSchema, OutlineLineSchema, PlanLineSchema, PracticeLineSchema, SCHEMA_DOC, type Block, type StoredBlock } from './schema';
import { LineSplitter, checkLine, mathProblem } from './ndjson';
import { MD_SCHEMA_DOC, PROMPT_VERSION, fill, getLearner, getOutputFormat, getPrompts, type OutputFormat } from './prompts';
import { MdBlockStream, blocksToMd, intendedType, mdUnitToBlock, parseMd, previewOfMd, type MdUnit } from './lessonMd';
import { sanitizeMermaid } from './mermaid';
import { zodMessage } from './schema';
import { runTask, type Msg } from './providers';
import { contextPack } from './context';
import { getFigureMode, mdTagsFor, promptFor } from './figureMode';
import { checkNumeric } from './mathsafe';
import type { Task } from './db';

export type Hooks = {
  signal?: AbortSignal;
  onStep?: (step: string, label: string) => void;
  onPartial?: (text: string) => void; // the unfinished line, for the typing preview
  onRepair?: (msg: string) => void;
};

/* ---------------- lesson records ---------------- */

export async function ensureLesson(id: string): Promise<AiLesson | undefined> {
  const d = db();
  const have = await d.lessons.get(id);
  if (have) return have;
  const f = findLesson(id);
  if (!f) return undefined;
  const l: AiLesson = {
    id, unit: f.unit.slug, number: f.lesson.number, title: f.lesson.title, dek: '', netWeight: 'Medium', minutes: f.lesson.minutes ?? 15, buildsOn: [],
    blocks: [], steps: {}, versions: [], status: 'empty', updatedAt: Date.now(),
  };
  await d.lessons.put(l);
  return l;
}

export const stepOrder = (l: Pick<AiLesson, 'plan'>) => ['outline', ...(l.plan ?? []).map((_, i) => `s${i}`), 'quiz', 'check'];
export const stepLabel = (l: Pick<AiLesson, 'plan'>, s: string) =>
  s === 'outline' ? 'Outline' : s === 'quiz' ? 'Quiz and NET corner' : s === 'check' ? 'Check pass' : `Section ${Number(s.slice(1)) + 1}: ${l.plan?.[Number(s.slice(1))]?.title ?? ''}`;

/** Keep blocks in pipeline order (hook, sections in plan order, closing blocks). Stable within a step. */
function sortBlocks(l: AiLesson) {
  const order = stepOrder(l);
  const rank = (b: StoredBlock) => { const r = order.indexOf(b._step ?? ''); return r < 0 ? order.length : r; };
  l.blocks = l.blocks.map((b, i) => [b, i] as const).sort((a, b) => rank(a[0]) - rank(b[0]) || a[1] - b[1]).map(([b]) => b);
}

export async function snapshot(id: string, note: string) {
  const d = db();
  const l = await d.lessons.get(id);
  if (!l || !l.blocks.length) return;
  const versions = [{ at: Date.now(), note, blocks: l.blocks }, ...l.versions].slice(0, 20);
  await d.lessons.update(id, { versions });
}

async function mutate(id: string, fn: (l: AiLesson) => void) {
  const d = db();
  await d.transaction('rw', d.lessons, async () => {
    const l = await d.lessons.get(id);
    if (!l) throw new Error('Lesson vanished');
    fn(l);
    l.updatedAt = Date.now();
    await d.lessons.put(l);
  });
}

/* ---------------- streaming one call into validated lines ---------------- */

async function systemMsg(): Promise<Msg> {
  const [p, learner] = await Promise.all([getPrompts(), getLearner()]);
  return { role: 'system', content: fill(p.system, { level: learner.level, language: learner.language === 'Hinglish' ? 'Hinglish (Hindi in Roman script mixed with English technical terms; keep maths and terms in English)' : 'English (Indian English spelling)' }) };
}

function firstJsonLine(text: string) {
  const t = text.replace(/```(?:json)?/g, '').trim();
  const line = t.split('\n').map((l) => l.trim()).find((l) => l.startsWith('{'));
  if (line && line.endsWith('}')) return line;
  const a = t.indexOf('{'), b = t.lastIndexOf('}');
  return a >= 0 && b > a ? t.slice(a, b + 1).replace(/\n\s*/g, ' ') : t;
}

/** One repair attempt for a line that failed parsing, schema or KaTeX. */
export async function repairLine<T>(task: Task, line: string, error: string, schema: ZodType<T>, h: Hooks, lessonId?: string) {
  h.onRepair?.(`Repairing a block: ${error.slice(0, 120)}`);
  const p = await getPrompts();
  try {
    const r = await runTask(task, [await systemMsg(), { role: 'user', content: fill(p.repair, { error, line, schema: SCHEMA_DOC }) }], { signal: h.signal, lessonId, step: 'repair', promptVersion: PROMPT_VERSION, params: { temperature: 0 } });
    return checkLine(firstJsonLine(r.text), schema);
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    return { ok: false as const, error: (e as Error).message };
  }
}

/** Stream a call; every complete line is validated (and repaired once) and handed to onLine as soon as it arrives. */
export async function streamLines<T>(task: Task, messages: Msg[], schema: ZodType<T>, h: Hooks, onLine: (v: T) => Promise<void> | void, onRaw: (line: string, error: string) => Promise<void> | void, meta: { lessonId?: string; step?: string } = {}) {
  const split = new LineSplitter();
  const queue: string[] = [];
  let chain = Promise.resolve();
  const handle = async (line: string) => {
    let c = checkLine(line, schema);
    if (!c.ok) c = await repairLine(task, line, c.error, schema, h, meta.lessonId);
    if (c.ok) await onLine(c.value);
    else await onRaw(line, c.error);
  };
  const enqueue = (lines: string[]) => { for (const l of lines) { queue.push(l); chain = chain.then(() => handle(queue.shift()!)); } };
  const r = await runTask(task, messages, {
    signal: h.signal, lessonId: meta.lessonId, step: meta.step, promptVersion: PROMPT_VERSION,
    onDelta: (chunk) => { enqueue(split.push(chunk)); h.onPartial?.(split.partial); },
  });
  enqueue(split.flush());
  h.onPartial?.('');
  await chain;
  return r;
}

/* ---------------- Markdown streaming ---------------- */

/** Mermaid's own parser, in the browser only; a node/SSR context skips the check. */
async function mermaidProblem(code: string): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    const mermaid = (await import('mermaid')).default;
    await mermaid.parse(sanitizeMermaid(code));
    return null;
  } catch (e) {
    return `Mermaid: ${String((e as Error)?.message ?? e).split('\n').slice(0, 2).join(' ').slice(0, 200)}`;
  }
}

/** Markdown unit -> validated block (same checks as a JSON line: zod, KaTeX, plus Mermaid parse). */
export async function checkMdUnit(u: MdUnit): Promise<{ ok: true; value: Block } | { ok: false; error: string }> {
  const c = mdUnitToBlock(u);
  if (!c.ok) return c;
  const r = BlockSchema.safeParse(c.block);
  if (!r.success) return { ok: false, error: `Schema (${String(c.block.type)}): ${zodMessage(r.error)}` };
  const m = mathProblem(r.data);
  if (m) return { ok: false, error: `KaTeX: ${m}` };
  if (r.data.type === 'diagram') { const e = await mermaidProblem(r.data.code); if (e) return { ok: false, error: e }; }
  return { ok: true, value: r.data };
}

/** One repair call for a broken Markdown block: the whole block text plus its section title. */
async function repairMdUnit(task: Task, u: MdUnit, error: string, section: string, h: Hooks, lessonId?: string): Promise<{ ok: true; value: Block[] } | { ok: false; error: string }> {
  h.onRepair?.(`Repairing a block: ${error.slice(0, 120)}`);
  const p = await getPrompts();
  try {
    const r = await runTask(task, [await systemMsg(), { role: 'user', content: fill(p.repairMd, { error, block: u.text, section: section || '(lesson opening)', schema: mdTagsFor(MD_SCHEMA_DOC, 'all') }) }], { signal: h.signal, lessonId, step: 'repair', promptVersion: PROMPT_VERSION, params: { temperature: 0 } });
    const units = parseMd(r.text);
    if (!units.length) return { ok: false, error: 'Repair returned nothing' };
    const out: Block[] = [];
    for (const x of units) { const c = await checkMdUnit(x); if (!c.ok) return { ok: false, error: `${error} (repair failed: ${c.error})` }; out.push(c.value); }
    const want = intendedType(u);
    if (want && !out.some((b) => b.type === want)) return { ok: false, error: `${error} (repair returned ${out.map((b) => b.type).join(', ')}, not ${want})` };
    return { ok: true, value: out };
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    return { ok: false, error: (e as Error).message };
  }
}

/** Stream a Markdown answer; each finished top-level block is validated (repaired once) and handed to onBlock immediately. */
export async function streamMd(task: Task, messages: Msg[], h: Hooks, onBlock: (v: Block) => Promise<void> | void, onRaw: (text: string, error: string) => Promise<void> | void, meta: { lessonId?: string; step?: string; section?: string } = {}) {
  const ms = new MdBlockStream();
  let section = meta.section ?? '';
  let chain = Promise.resolve();
  const handle = async (u: MdUnit) => {
    if (u.kind === 'section') section = u.text.replace(/^##\s+/, '');
    const c = await checkMdUnit(u);
    if (c.ok) return void (await onBlock(c.value));
    const r = await repairMdUnit(task, u, c.error, section, h, meta.lessonId);
    if (r.ok) { for (const b of r.value) await onBlock(b); }
    else await onRaw(u.text, r.error);
  };
  const enqueue = (us: MdUnit[]) => { for (const u of us) chain = chain.then(() => handle(u)); };
  const r = await runTask(task, messages, {
    signal: h.signal, lessonId: meta.lessonId, step: meta.step, promptVersion: PROMPT_VERSION,
    onDelta: (chunk) => { enqueue(ms.push(chunk)); h.onPartial?.(previewOfMd(ms.partial)); },
  });
  enqueue(ms.flush());
  h.onPartial?.('');
  await chain;
  return r;
}

/** Stream lesson blocks in the chosen output format. */
function streamBlocks(fmt: OutputFormat, task: Task, messages: Msg[], h: Hooks, onBlock: (v: Block) => Promise<void> | void, onRaw: (text: string, error: string) => Promise<void> | void, meta: { lessonId?: string; step?: string; section?: string }) {
  return fmt === 'md' ? streamMd(task, messages, h, onBlock, onRaw, meta) : streamLines(task, messages, BlockSchema, h, onBlock, onRaw, meta);
}

/* ---------------- the lesson pipeline ---------------- */

const asStored = (b: Block, step: string, model?: string): StoredBlock => ({ ...b, _id: uid('b'), _step: step, _ai: model });

async function setStep(id: string, step: string, s: StepState) {
  await mutate(id, (l) => { l.steps = { ...l.steps, [step]: s }; });
}

export async function runStep(id: string, step: string, h: Hooks = {}) {
  const d = db();
  const l0 = await d.lessons.get(id);
  if (!l0) throw new Error('Lesson not found');
  h.onStep?.(step, stepLabel(l0, step));
  const prompts = await getPrompts();
  const fmode = await getFigureMode();
  const fmt = await getOutputFormat();
  const ctx = await contextPack(l0, { golden: true, format: step === 'outline' || step === 'check' ? 'jsonl' : fmt });
  const sys = await systemMsg();
  // a redo replaces this step's earlier output
  if (l0.blocks.some((b) => b._step === step)) await snapshot(id, `Before regenerating ${stepLabel(l0, step)}`);
  await mutate(id, (l) => {
    l.blocks = l.blocks.filter((b) => b._step !== step);
    if (step === 'outline') l.plan = [];
    if (step === 'check') l.issues = [];
    l.steps = { ...l.steps, [step]: 'partial' };
  });
  let model = '';
  const raw = async (line: string, error: string) => {
    await mutate(id, (l) => { l.blocks.push({ type: 'raw', text: line, error: error.slice(0, 200), _id: uid('b'), _step: step }); sortBlocks(l); });
  };

  try {
    if (step === 'outline') {
      const r = await streamLines('lessonWriting', [sys, { role: 'user', content: promptFor(fill(prompts.outline, { context: ctx }), fmode) }], OutlineLineSchema, h, async (v) => {
        await mutate(id, (l) => {
          if (v.type === 'meta') { const m = MetaLineSchema.parse(v); l.dek = m.dek; l.netWeight = m.netWeight; l.minutes = m.minutes; l.buildsOn = m.buildsOn.filter((x) => !!findLesson(x) && x !== id); }
          else if (v.type === 'plan') { const p = PlanLineSchema.parse(v); l.plan = [...(l.plan ?? []), { title: p.title, goal: p.goal, figure: p.figure }]; }
          else { l.blocks.push(asStored(v as Block, 'outline', model)); sortBlocks(l); }
          if (l.status === 'empty') l.status = 'draft';
        });
      }, raw, { lessonId: id, step });
      model = r.model;
      const l = await d.lessons.get(id);
      if (!l?.plan?.length) throw new Error('The outline came back without any sections. Try again or pick a stronger model for Lesson writing.');
      await mutate(id, (x) => { x.meta = { ...(x.meta ?? {}), source: 'ai', model: r.model, generatedAt: Date.now() }; });
    } else if (step.startsWith('s')) {
      const i = Number(step.slice(1));
      const plan = l0.plan?.[i];
      if (!plan) throw new Error('No plan for this section; regenerate the outline.');
      const done = (l0.plan ?? []).slice(0, i).map((p, k) => `${k + 1}. ${p.title}`).join('; ') || 'none yet';
      let first = true;
      const vars = { n: i + 1, title: plan.title, goal: plan.goal, figure: fmode === 'text' ? 'none' : plan.figure ?? 'none', done, context: ctx };
      const content = fmt === 'md' ? mdTagsFor(fill(prompts.sectionMd, vars), fmode) : promptFor(fill(prompts.section, vars), fmode);
      const r = await streamBlocks(fmt, 'lessonWriting', [sys, { role: 'user', content }], h, async (v) => {
        await mutate(id, (l) => {
          if (first && v.type !== 'section') l.blocks.push({ type: 'section', title: plan.title, _id: uid('b'), _step: step, _ai: model });
          first = false;
          if (v.type === 'section' && l.blocks.some((b) => b._step === step && b.type === 'section')) return; // one heading per section
          if (['remember', 'quiz', 'netCorner', 'doneWhen', 'upNext', 'hook'].includes(v.type)) return; // belongs to other steps
          l.blocks.push(asStored(v, step, model));
          sortBlocks(l);
        });
      }, raw, { lessonId: id, step, section: plan.title });
      model = r.model;
    } else if (step === 'quiz') {
      const f = findLesson(id);
      const next = f?.next ? `${f.next.number} "${f.next.title}"` : 'the next topic in this unit';
      const kept = l0.blocks.filter((b) => b.type !== 'raw');
      const lessonText = (fmt === 'md' ? blocksToMd(kept.map(stripMeta) as Record<string, unknown>[]) : kept.map((b) => JSON.stringify(stripMeta(b))).join('\n')).slice(0, 14000);
      const content = fmt === 'md' ? mdTagsFor(fill(prompts.quizNetMd, { next, lesson: lessonText, context: ctx }), fmode) : fill(prompts.quizNet, { next, lesson: lessonText, context: ctx });
      const r = await streamBlocks(fmt, 'quiz', [sys, { role: 'user', content }], h, async (v) => {
        if (!['remember', 'quiz', 'netCorner', 'doneWhen', 'upNext'].includes(v.type)) return;
        await mutate(id, (l) => {
          if (l.blocks.some((b) => b._step === 'quiz' && b.type === v.type)) return;
          const b = asStored(v, 'quiz', model);
          if (v.type === 'netCorner') b._flags = numericFlags(v);
          l.blocks.push(b);
          sortBlocks(l);
        });
      }, raw, { lessonId: id, step, section: 'Quiz and NET corner' });
      model = r.model;
    } else if (step === 'check') {
      const lessonText = l0.blocks.map((b, i) => `[${i}] ${JSON.stringify(stripMeta(b))}`).join('\n').slice(0, 20000);
      const local: Issue[] = [];
      l0.blocks.forEach((b, i) => { for (const f of b._flags ?? []) local.push({ block: i, severity: 'high', problem: f }); if (b.type === 'raw') local.push({ block: i, severity: 'high', problem: `Unparsed block: ${b.error}` }); });
      const found: Issue[] = [];
      await streamLines('lessonWriting', [sys, { role: 'user', content: fill(prompts.check, { lesson: lessonText }) }], CheckLineSchema, h, (v) => {
        if (v.problem === 'No issues found.') return;
        const fix = v.fix && BlockSchema.safeParse(v.fix).success ? v.fix : undefined;
        found.push({ block: v.block, severity: v.severity, problem: v.problem, fix });
      }, () => { /* a malformed review line is not worth showing */ }, { lessonId: id, step });
      await mutate(id, (l) => { l.issues = [...local, ...found]; });
    }
    await setStep(id, step, 'done');
    await mutate(id, (l) => {
      const order = stepOrder(l).filter((s) => s !== 'check');
      if (order.every((s) => l.steps[s] === 'done')) l.status = 'complete';
    });
  } catch (e) {
    await setStep(id, step, (e as Error).name === 'AbortError' ? 'partial' : 'error');
    throw e;
  }
}

function stripMeta(b: StoredBlock) { const { _id, _step, _ai, _flags, ...rest } = b; void _id; void _step; void _ai; void _flags; return rest; }

export function numericFlags(b: Block): string[] | undefined {
  if (b.type !== 'netCorner') return undefined;
  // computed lazily in the renderer too; this records it with the block for the check pass
  const out: string[] = [];
  try {
    b.questions.forEach((q, i) => { if (q.numeric) { const r = checkNumeric(q.numeric, q.options[q.answer]); if (!r.ok) out.push(`NET question ${i + 1}: ${r.message}`); } });
  } catch { /* checker unavailable */ }
  return out.length ? out : undefined;
}

/** Run every unfinished step in order. Finished steps are skipped, so this is also Resume. */
export async function generateLesson(id: string, h: Hooks = {}, opts: { withCheck?: boolean } = { withCheck: true }) {
  for (let guard = 0; guard < 20; guard++) {
    const l = await db().lessons.get(id);
    if (!l) throw new Error('Lesson not found');
    const next = stepOrder(l).find((s) => l.steps[s] !== 'done' && (s !== 'check' || opts.withCheck));
    if (!next) return;
    await runStep(id, next, h);
  }
}

/* ---------------- per-block actions ---------------- */

export async function regenerateBlock(id: string, blockId: string, h: Hooks = {}) {
  const l = await db().lessons.get(id);
  const b = l?.blocks.find((x) => x._id === blockId);
  if (!l || !b) return;
  const prompts = await getPrompts();
  const ctx = await contextPack(l, { golden: false });
  await snapshot(id, `Before regenerating a ${b.type} block`);
  const neighbours = l.blocks.slice(Math.max(0, l.blocks.indexOf(b) - 2), l.blocks.indexOf(b) + 3).map((x) => JSON.stringify(stripMeta(x))).join('\n');
  const ask = `TASK: rewrite one block
Rewrite this ${b.type === 'raw' ? 'broken line as a valid block' : `"${b.type}" block`} so it is better and correct. Keep its role in the lesson. Output exactly ONE line of JSON, no fences.
Block: ${JSON.stringify(stripMeta(b))}
Around it:
${neighbours}

${ctx}`;
  const task: Task = b.type === 'quiz' || b.type === 'netCorner' ? 'quiz' : 'lessonWriting';
  let done = false;
  await streamLines(task, [await systemMsg(), { role: 'user', content: ask }], BlockSchema, h, async (v) => {
    if (done) return;
    done = true;
    await mutate(id, (x) => { const i = x.blocks.findIndex((y) => y._id === blockId); if (i >= 0) x.blocks[i] = { ...v, _id: uid('b'), _step: b._step, _ai: x.meta?.model, _flags: numericFlags(v) }; });
  }, () => { /* keep the old block */ }, { lessonId: id, step: 'block' });
  void prompts;
  if (!done) throw new Error('The model did not return a valid block. The old one is kept.');
}

export async function replaceBlock(id: string, blockId: string, json: string) {
  const c = checkLine(json.replace(/\n\s*/g, ' '), BlockSchema);
  if (!c.ok) throw new Error(c.error);
  await snapshot(id, 'Before an edit');
  await mutate(id, (l) => { const i = l.blocks.findIndex((b) => b._id === blockId); if (i >= 0) l.blocks[i] = { ...c.value, _id: l.blocks[i]._id, _step: l.blocks[i]._step, _ai: undefined, _flags: numericFlags(c.value) }; });
}

export async function deleteBlock(id: string, blockId: string) {
  await snapshot(id, 'Before deleting a block');
  await mutate(id, (l) => { l.blocks = l.blocks.filter((b) => b._id !== blockId); });
}

export async function insertBlocks(id: string, afterBlockId: string | null, blocks: Block[], step?: string) {
  await mutate(id, (l) => {
    const i = afterBlockId ? l.blocks.findIndex((b) => b._id === afterBlockId) : l.blocks.length - 1;
    const st = step ?? l.blocks[i]?._step;
    l.blocks.splice(i + 1, 0, ...blocks.map((b) => ({ ...b, _id: uid('b'), _step: st, _ai: l.meta?.model })));
  });
}

export async function rollback(id: string, at: number) {
  const l = await db().lessons.get(id);
  const v = l?.versions.find((x) => x.at === at);
  if (!l || !v) return;
  await snapshot(id, 'Before rollback');
  await mutate(id, (x) => { x.blocks = v.blocks; });
}

export async function applyIssueFix(id: string, idx: number) {
  const l = await db().lessons.get(id);
  const iss = l?.issues?.[idx];
  if (!l || !iss?.fix) return;
  const target = l.blocks[iss.block];
  if (!target) return;
  await replaceBlock(id, target._id, JSON.stringify(iss.fix));
  await mutate(id, (x) => { if (x.issues?.[idx]) x.issues[idx].applied = true; });
}

/* ---------------- practice sets ---------------- */

export async function generatePractice(unitSlug: string, h: Hooks = {}, count = 15) {
  const u = unitBySlug(unitSlug);
  if (!u) throw new Error('Unknown unit');
  const d = db();
  const have = (await d.practice.get(unitSlug)) ?? { id: unitSlug, unit: unitSlug, questions: [], updatedAt: Date.now(), complete: false } as PracticeSet;
  if (have.complete) { have.questions = []; have.complete = false; }
  await d.practice.put(have);
  const remaining = count - have.questions.length;
  h.onStep?.('practice', `Writing ${remaining} practice questions`);
  const p = await getPrompts();
  const lessons = allLessons(u).filter((l) => !l.project).map((l) => `${l.number} ${l.title}`).join(' | ');
  let content = fill(p.practice, { count: remaining, unit: u.roman, unitTitle: u.title, lessons });
  if (have.questions.length) content += `\nAlready written (do not repeat): ${have.questions.map((q) => q.stem.slice(0, 80)).join(' | ')}`;
  const r = await streamLines('quiz', [await systemMsg(), { role: 'user', content }], PracticeLineSchema, h, async (v) => {
    const { type, numeric, ...q } = v; void type;
    const flags: string[] = [];
    if (numeric) {
      const c = checkNumeric(numeric, q.options[q.answer]);
      if (!c.ok && c.message) flags.push(c.message);
    }
    const cur = (await d.practice.get(unitSlug))!;
    cur.questions.push({ ...q, _flags: flags.length ? flags : undefined });
    cur.updatedAt = Date.now();
    await d.practice.put(cur);
  }, () => { /* drop malformed questions */ }, { step: 'practice' });
  const cur = (await d.practice.get(unitSlug))!;
  cur.complete = true; cur.model = r.model;
  await d.practice.put(cur);
}

/* ---------------- remix ---------------- */

export type RemixMode = 'simpler' | 'example' | 'hinglish';

export async function remixSection(id: string, sectionIndex: number, mode: RemixMode, h: Hooks = {}) {
  const l = await db().lessons.get(id);
  if (!l) return;
  const step = `s${sectionIndex}`;
  const sec = l.blocks.filter((b) => b._step === step);
  if (!sec.length) throw new Error('This section has no blocks to remix.');
  h.onStep?.(step, mode === 'simpler' ? 'Rewriting the section more simply' : mode === 'example' ? 'Writing another example' : 'Rewriting the section in Hinglish');
  const p = await getPrompts();
  await snapshot(id, `Before remix (${mode}) of section ${sectionIndex + 1}`);
  let cleared = false;
  const figs = sec.filter((b) => b.type === 'figure');
  let placed = 0;
  await streamLines('remix', [await systemMsg(), { role: 'user', content: fill(p.remix, { mode, section: sec.map((b) => JSON.stringify(stripMeta(b))).join('\n') }) }], BlockSchema, h, async (v) => {
    await mutate(id, (x) => {
      if (mode === 'example') {
        if (v.type !== 'example') return;
        const last = x.blocks.map((b) => b._step).lastIndexOf(step);
        x.blocks.splice(last + 1, 0, { ...v, _id: uid('b'), _step: step, _ai: x.meta?.model });
        return;
      }
      if (['remember', 'quiz', 'netCorner', 'doneWhen', 'upNext', 'hook'].includes(v.type)) return;
      if (!cleared) {
        x.blocks = x.blocks.filter((b) => b._step !== step);
        cleared = true;
        if (v.type !== 'section') x.blocks.push({ ...(sec[0].type === 'section' ? sec[0] : { type: 'section', title: 'Section' }), _id: uid('b'), _step: step } as StoredBlock);
      }
      // interactive figures are code, not prose: the original figure goes where the remix puts its figure
      if (v.type === 'figure') { if (figs[placed]) x.blocks.push(figs[placed++]); }
      else x.blocks.push({ ...v, _id: uid('b'), _step: step, _ai: x.meta?.model });
      sortBlocks(x);
    });
  }, () => { /* skip malformed */ }, { lessonId: id, step: 'remix' });
  if (cleared && placed < figs.length) await mutate(id, (x) => { x.blocks.push(...figs.slice(placed)); sortBlocks(x); });
}

/* ---------------- topic trees ---------------- */

export { firstJsonLine, systemMsg };
