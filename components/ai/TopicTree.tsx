'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { UNITS, allLessons, findLesson, unitBySlug } from '@/lib/curriculum';
import { db, uid, type AiLesson, type Topic, type TopicNode } from '@/lib/ai/db';
import { fill, getPrompts, PROMPT_VERSION } from '@/lib/ai/prompts';
import { errorText, runTask } from '@/lib/ai/providers';
import { checkLine } from '@/lib/ai/ndjson';
import { firstJsonLine, repairLine, systemMsg } from '@/lib/ai/pipeline';
import { ErrorNote, Sheet, UnlockBar } from './ui';

type RawNode = { title: string; why: string; prerequisites: string[]; netWeight: 'High' | 'Medium' | 'Low'; minutes: number; children?: RawNode[] };
const NodeSchema: z.ZodType<RawNode> = z.lazy(() => z.object({
  title: z.string().min(3),
  why: z.string().default(''),
  prerequisites: z.array(z.string()).default([]),
  netWeight: z.enum(['High', 'Medium', 'Low']).catch('Medium'),
  minutes: z.number().catch(15),
  children: z.array(NodeSchema).max(8).optional(),
})) as never;
const TreeSchema = z.object({ root: z.string().min(1), nodes: z.array(NodeSchema).min(1).max(10) });

type Row = TopicNode & { on: boolean };
const toRows = (ns: RawNode[], depth = 0): Row[] => ns.map((n) => ({ key: uid('n'), title: n.title, why: n.why, prerequisites: n.prerequisites, netWeight: n.netWeight, minutes: Math.round(Math.min(40, Math.max(5, n.minutes))), on: true, children: toRows(n.children ?? [], depth + 1) as Row[] }));

/** Add a topic / Go deeper: AI proposes a topic tree, you tick, reorder and rename, then add it to the course. */
export default function TopicTree({ open, onClose, unit, anchor, anchorTitle, initialQuery = '' }: { open: boolean; onClose: () => void; unit?: string; anchor?: string; anchorTitle?: string; initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [target, setTarget] = useState(unit ?? '');
  const [rows, setRows] = useState<Row[] | null>(null);
  const [root, setRoot] = useState('');
  const [stream, setStream] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<{ msg: string; hint?: string } | null>(null);
  const [added, setAdded] = useState<{ first?: string; count: number } | null>(null);
  const ctl = useRef<AbortController | null>(null);
  useEffect(() => () => ctl.current?.abort(), []);

  const propose = async () => {
    if (!query.trim()) return;
    setBusy(true); setErr(null); setRows(null); setStream(''); setAdded(null);
    ctl.current = new AbortController();
    try {
      const p = await getPrompts();
      const u = unitBySlug(target);
      const existing = (u ? allLessons(u) : UNITS.flatMap(allLessons)).map((l) => l.title);
      const customs = (await db().lessons.where('unit').equals(target).toArray()).filter((l) => l.meta?.custom).map((l) => l.title);
      const a = anchor ? findLesson(anchor) : undefined;
      const ctx = `CURRICULUM POSITION\nSyllabus: UGC NET Electronic Science (Code 88)${u ? `, Unit ${u.roman} · ${u.title}. Scope: ${u.scope}` : ''}.${a ? `\nThe learner is reading lesson ${a.lesson.number} "${a.lesson.title}".` : ''}`;
      const content = fill(p.topicTree, { query: query.trim(), anchor: anchorTitle ? ` (from lesson ${anchorTitle})` : '', existing: [...existing, ...customs].join(' | ').slice(0, 6000), context: ctx });
      const r = await runTask('topicExpansion', [await systemMsg(), { role: 'user', content }], { signal: ctl.current.signal, onDelta: (_, full) => setStream(full), promptVersion: PROMPT_VERSION, step: 'topics' });
      let c = checkLine(firstJsonLine(r.text), TreeSchema);
      if (!c.ok) c = await repairLine('topicExpansion', firstJsonLine(r.text), c.error, TreeSchema, { signal: ctl.current.signal });
      if (!c.ok) throw new Error(`The topic tree did not come back in the right shape (${c.error}). Try again or pick another model for Topic expansion.`);
      setRoot(c.value.root);
      setRows(toRows(c.value.nodes));
    } catch (e) { setErr(errorText(e)); }
    setBusy(false); setStream('');
  };

  const update = (key: string, patch: Partial<Row>) => {
    const walk = (rs: Row[]): Row[] => rs.map((r) => (r.key === key ? { ...r, ...patch } : { ...r, children: walk(r.children as Row[]) }));
    setRows((rs) => (rs ? walk(rs) : rs));
  };
  const move = (key: string, dir: -1 | 1) => {
    const walk = (rs: Row[]): Row[] => {
      const i = rs.findIndex((r) => r.key === key);
      if (i >= 0) { const j = i + dir; if (j < 0 || j >= rs.length) return rs; const c = [...rs]; [c[i], c[j]] = [c[j], c[i]]; return c; }
      return rs.map((r) => ({ ...r, children: walk(r.children as Row[]) }));
    };
    setRows((rs) => (rs ? walk(rs) : rs));
  };

  const addToCourse = async () => {
    if (!rows) return;
    const d = db();
    const topicId = uid('t');
    const u = unitBySlug(target);
    const a = anchor ? findLesson(anchor) : undefined;
    const anchorNo = a?.lesson.number ?? (anchor ? (await d.lessons.get(anchor))?.number : undefined);
    const flat: Row[] = [];
    const walk = (rs: Row[]) => rs.forEach((r) => { if (r.on && r.title.trim()) flat.push(r); walk(r.children as Row[]); });
    walk(rows);
    if (!flat.length) return;
    const existingCount = (await d.topics.where('unit').equals(target).toArray()).reduce((s, t) => s + t.lessonIds.length, 0);
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    const lessons: AiLesson[] = flat.map((r, k) => ({
      id: `${topicId}-${k + 1}`, unit: target,
      number: anchorNo ? `${anchorNo}${letters[k] ?? k + 1}` : u ? `${u.n}.A${existingCount + k + 1}` : `M${existingCount + k + 1}`,
      title: r.title.trim(), dek: r.why, netWeight: r.netWeight, minutes: r.minutes, buildsOn: a ? [a.lesson.id] : [],
      blocks: [], steps: {}, versions: [], status: 'empty', updatedAt: Date.now(), meta: { custom: true, topicId },
    }));
    const clean = (rs: Row[]): TopicNode[] => rs.filter((r) => r.on).map(({ on, ...r }) => { void on; return { ...r, children: clean(r.children as Row[]) }; });
    const topic: Topic = { id: topicId, unit: target, anchor, anchorTitle, query: query.trim(), root, nodes: clean(rows), lessonIds: lessons.map((l) => l.id), createdAt: Date.now() };
    await d.transaction('rw', d.topics, d.lessons, async () => { await d.topics.put(topic); await d.lessons.bulkPut(lessons); });
    setAdded({ first: lessons[0]?.id, count: lessons.length });
  };

  const count = (rs: Row[] | null): number => (rs ?? []).reduce((s, r) => s + (r.on ? 1 : 0) + count(r.children as Row[]), 0);

  const renderRows = (rs: Row[], depth: number) => (
    <ol className={depth ? 'mt-2 space-y-2 border-l border-dashed border-line pl-3' : 'space-y-3'}>
      {rs.map((r, i) => (
        <li key={r.key} className={`rounded-xl border border-line bg-card ${r.on ? '' : 'opacity-55'}`}>
          <div className="flex items-start gap-2 p-2.5">
            <label className="grid h-11 w-9 shrink-0 place-items-center"><input type="checkbox" className="h-5 w-5 accent-[var(--accent-deep)]" checked={r.on} onChange={(e) => update(r.key, { on: e.target.checked })} aria-label={`Include ${r.title}`} /></label>
            <div className="min-w-0 flex-1">
              <textarea rows={2} className="field !min-h-0 resize-none !py-1.5 !font-ui !text-[15px] font-medium leading-snug" value={r.title} onChange={(e) => update(r.key, { title: e.target.value.replace(/\n/g, ' ') })} aria-label="Lesson title" />
              <p className="mt-1.5 text-[13.5px] leading-snug text-muted">{r.why}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5"><span className={`chip !h-6 !text-[11.5px] ${r.netWeight === 'High' ? 'chip-accent' : ''}`}>NET {r.netWeight}</span><span className="chip !h-6 !text-[11.5px]">{r.minutes} min</span>{r.prerequisites.slice(0, 2).map((p) => <span key={p} className="chip !h-6 max-w-[200px] truncate !text-[11.5px]">needs {p}</span>)}</div>
            </div>
            <div className="flex shrink-0 flex-col">
              <button className="icon-btn !min-h-[40px]" disabled={i === 0} onClick={() => move(r.key, -1)} aria-label="Move up">↑</button>
              <button className="icon-btn !min-h-[40px]" disabled={i === rs.length - 1} onClick={() => move(r.key, 1)} aria-label="Move down">↓</button>
            </div>
          </div>
          {(r.children as Row[]).length > 0 && <div className="px-2.5 pb-2.5">{renderRows(r.children as Row[], depth + 1)}</div>}
        </li>
      ))}
    </ol>
  );

  return (
    <Sheet open={open} onClose={() => { ctl.current?.abort(); onClose(); }} title={anchorTitle ? 'Go deeper' : 'Add a topic'} wide>
      {added ? (
        <div className="space-y-4">
          <div className="note-good">Added {added.count} lesson{added.count > 1 ? 's' : ''} {unitBySlug(target) ? `to Unit ${unitBySlug(target)!.roman}` : 'to My topics'}. Each has a Generate button.</div>
          <div className="flex flex-wrap gap-2">
            {added.first && <Link href={`/study/?id=${added.first}`} className="btn btn-primary" onClick={onClose}>Open the first lesson</Link>}
            <button className="btn" onClick={() => { setAdded(null); setRows(null); }}>Add another</button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); propose(); }}>
            <div>
              <label className="flabel" htmlFor="tt-q">{anchorTitle ? `What do you want to go deeper into? (from ${anchorTitle})` : 'What topic do you want to add?'}</label>
              <input id="tt-q" className="field" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. Varactor diodes and how they tune a radio" />
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-[180px] flex-1">
                <label className="flabel" htmlFor="tt-u">Save under</label>
                <select id="tt-u" className="field" value={target} onChange={(e) => setTarget(e.target.value)}>
                  <option value="">My topics (outside the units)</option>
                  {UNITS.map((u) => <option key={u.slug} value={u.slug}>Unit {u.roman} · {u.short}</option>)}
                </select>
              </div>
              {busy ? <button type="button" className="btn" onClick={() => ctl.current?.abort()}>Stop</button> : <button className="btn btn-primary" disabled={!query.trim()}>{rows ? 'Ask again' : 'Suggest lessons'}</button>}
            </div>
          </form>
          <UnlockBar />
          {busy && <div className="rounded-xl border border-dashed border-line px-3 py-2"><div className="eyebrow mb-1">Thinking out a topic tree</div><p className="typing max-h-[140px] overflow-hidden !font-mono !text-[12.5px]">{stream.slice(-500)}</p></div>}
          {err && <ErrorNote msg={err.msg} hint={err.hint} />}
          {rows && (
            <>
              <div className="flex items-baseline justify-between gap-3"><div className="font-semibold">{root}</div><div className="shrink-0 text-[13px] text-muted">{count(rows)} selected</div></div>
              <p className="text-[13.5px] text-muted">Untick what you do not want, rename freely, and use the arrows to reorder. Each ticked line becomes one lesson.</p>
              {renderRows(rows, 0)}
              <div className="sticky bottom-0 -mx-4 border-t border-line bg-card px-4 py-3"><button className="btn btn-primary w-full" disabled={!count(rows)} onClick={addToCourse}>Add {count(rows)} to course</button></div>
            </>
          )}
        </div>
      )}
    </Sheet>
  );
}

