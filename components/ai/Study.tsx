'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, kvSet, type AiLesson } from '@/lib/ai/db';
import { findLesson, lessonHref, unitBySlug } from '@/lib/curriculum';
import { lessonLink } from '@/lib/links';
import { applyIssueFix, deleteBlock, ensureLesson, generateLesson, generatePractice, regenerateBlock, replaceBlock, rollback, runStep, stepLabel, stepOrder, type Hooks } from '@/lib/ai/pipeline';
import { errorText, resolveTask } from '@/lib/ai/providers';
import { getLearner, type Learner } from '@/lib/ai/prompts';
import { publishLesson } from '@/lib/ai/github';
import { previewOf } from '@/lib/ai/ndjson';
import type { StoredBlock } from '@/lib/ai/schema';
import { ReadingProgress, Quiz } from '@/components/lesson/Interactive';
import { LessonBottomBar, LessonSidebar } from '@/components/lesson/LessonNav';
import { IconBack } from '@/components/Icons';
import LessonView from './LessonView';
import { mdInline } from './Markdown';
import { ErrorNote, Sheet, UnlockBar, download } from './ui';
import TopicTree from './TopicTree';
import { RemixMenu } from './Remix';
import { DoubtLauncher } from './Launchers';

type Run = { step: string; label: string; partial: string; repair: string } | null;

function useRunner() {
  const [run, setRun] = useState<Run>(null);
  const [err, setErr] = useState<{ msg: string; hint?: string } | null>(null);
  const ctl = useRef<AbortController | null>(null);
  const start = useCallback(async (fn: (h: Hooks) => Promise<void>) => {
    ctl.current?.abort();
    const c = new AbortController();
    ctl.current = c;
    setErr(null);
    setRun({ step: '', label: 'Starting…', partial: '', repair: '' });
    try {
      await fn({
        signal: c.signal,
        onStep: (step, label) => setRun({ step, label, partial: '', repair: '' }),
        onPartial: (t) => setRun((r) => (r ? { ...r, partial: t } : r)),
        onRepair: (m) => setRun((r) => (r ? { ...r, repair: m } : r)),
      });
    } catch (e) {
      setErr(errorText(e));
    } finally {
      if (ctl.current === c) { ctl.current = null; setRun(null); }
    }
  }, []);
  const stop = () => ctl.current?.abort();
  useEffect(() => () => ctl.current?.abort(), []);
  return { run, err, start, stop, setErr };
}

export default function Study() {
  const q = useSearchParams();
  const id = q.get('id');
  const practice = q.get('practice');
  if (practice) return <PracticeStudy unit={practice} />;
  if (!id) return <main className="mx-auto max-w-[720px] px-4 py-16"><p className="text-muted">Nothing to study here. <Link className="underline" href="/course/">Open the course map</Link>.</p></main>;
  return <LessonStudy key={id} id={id} />;
}

/* ---------------- lesson ---------------- */

function ModelLine() {
  const [s, setS] = useState<string | null>(null);
  const [l, setL] = useState<Learner | null>(null);
  useEffect(() => {
    resolveTask('lessonWriting').then((r) => setS(`${r.prov.name} · ${r.model}`)).catch(() => setS(''));
    getLearner().then(setL);
  }, []);
  if (s === null || !l) return null;
  const setLearner = (patch: Partial<Learner>) => { const n = { ...l, ...patch }; setL(n); kvSet('learner', n); };
  return (
    <div className="mt-5 space-y-4">
      {s ? <p className="text-[14.5px] text-muted">Writes with <span className="font-mono text-[13px] text-ink">{s}</span> · <Link href="/settings/" className="underline underline-offset-4">change</Link></p>
        : <div className="note-bad">No AI provider yet. <Link href="/settings/" className="font-semibold underline underline-offset-4">Add one in Settings</Link>; it takes a minute and your key stays on this device.</div>}
      <div className="flex flex-wrap gap-x-6 gap-y-3">
        <div><div className="flabel">Level</div><div className="flex flex-wrap gap-1.5">{(['beginner', 'intermediate', 'exam-ready'] as const).map((v) => <button key={v} className="btn btn-sm" aria-pressed={l.level === v} onClick={() => setLearner({ level: v })}>{v[0].toUpperCase() + v.slice(1)}</button>)}</div></div>
        <div><div className="flabel">Language</div><div className="flex flex-wrap gap-1.5">{(['English', 'Hinglish'] as const).map((v) => <button key={v} className="btn btn-sm" aria-pressed={l.language === v} onClick={() => setLearner({ language: v })}>{v}</button>)}</div></div>
      </div>
    </div>
  );
}

function Progress({ l, run, onStop }: { l: AiLesson; run: Run; onStop: () => void }) {
  const steps = stepOrder(l);
  return (
    <div className="sticky z-20 -mt-2 mb-6 rounded-2xl border border-line bg-[color-mix(in_oklab,var(--card)_94%,transparent)] px-4 py-3 shadow-[var(--shadow)] backdrop-blur-md" style={{ top: 'calc(60px + var(--safe-t))' }} role="status" aria-live="polite">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="eyebrow">Writing · step {Math.max(1, steps.indexOf(run?.step ?? '') + 1)} of {steps.length}</div>
          <div className="mt-0.5 truncate font-semibold">{run?.label}</div>
        </div>
        <button className="btn btn-sm shrink-0" onClick={onStop}>Stop</button>
      </div>
      <ol className="mt-3 flex gap-1" aria-hidden>
        {steps.map((s) => <li key={s} className={`h-1.5 flex-1 rounded-full ${l.steps[s] === 'done' ? 'bg-[var(--accent)]' : s === run?.step ? 'bg-[var(--accent-soft)]' : 'bg-[var(--line)]'}`} />)}
      </ol>
      {run?.repair && <p className="mt-2 text-[13px] text-muted">{run.repair}</p>}
    </div>
  );
}

function blockLabel(b: StoredBlock) {
  return ({ hook: 'Hook', section: 'Section title', paragraph: 'Paragraph', equationCard: 'Equation card', example: 'Example', sideNote: 'Side note', yourGuess: 'Your guess', tryThis: 'Try this', figure: 'Figure', diagram: 'Diagram', describe: 'Figure description', remember: 'Remember', quiz: 'Quiz', netCorner: 'NET corner', doneWhen: 'Done when', upNext: 'Up next', raw: 'Unparsed block' } as Record<string, string>)[b.type] ?? b.type;
}

function LessonStudy({ id }: { id: string }) {
  const [missing, setMissing] = useState(false);
  useEffect(() => { ensureLesson(id).then((l) => { if (!l) db().lessons.get(id).then((x) => setMissing(!x)); }); }, [id]);
  const l = useLiveQuery(() => db().lessons.get(id), [id]);
  const { run, err, start, stop, setErr } = useRunner();
  const [review, setReview] = useState(false);
  const [editing, setEditing] = useState<StoredBlock | null>(null);
  const [panel, setPanel] = useState<'' | 'versions' | 'issues'>('');
  const [deeper, setDeeper] = useState<{ query: string; anchorTitle?: string } | null>(null);
  const [pubMsg, setPubMsg] = useState<{ ok: boolean; text: string; url?: string } | null>(null);
  const f = findLesson(id);

  if (f?.lesson.written) {
    return <main className="mx-auto max-w-[720px] px-4 py-16"><p>This lesson is already part of the course. <Link className="font-semibold underline" href={lessonHref(f.unit, f.lesson)}>Open {f.lesson.number}</Link></p></main>;
  }
  if (missing) return <main className="mx-auto max-w-[720px] px-4 py-16"><p className="text-muted">This lesson is not on this device. AI lessons are saved in the browser that wrote them; import a backup in <Link href="/settings/" className="underline">Settings</Link> to bring them here.</p></main>;
  if (!l) return <main className="mx-auto max-w-[720px] px-4 py-16 text-muted">Loading…</main>;

  const unit = unitBySlug(l.unit);
  const running = !!run;
  const steps = stepOrder(l);
  const doneCount = steps.filter((s) => l.steps[s] === 'done').length;
  const started = Object.keys(l.steps).length > 0;
  const unfinished = steps.filter((s) => s !== 'check').some((s) => l.steps[s] !== 'done');
  const generate = () => start((h) => generateLesson(id, h));
  const next = f?.next ? { number: f.next.number, title: f.next.title, href: lessonLink(f.next.id) } : undefined;

  const wrap = (b: StoredBlock, i: number, node: ReactNode) => {
    if (!review) return node;
    const flagged = l.issues?.some((x) => x.block === i && !x.applied && x.severity === 'high');
    return (
      <div className={`relative -mx-2 my-1 rounded-xl px-2 py-1 ${flagged ? 'ring-1 ring-[var(--bad)]' : 'ring-1 ring-[var(--line)]'}`}>
        {node}
        <div className="block-tools font-ui">
          <span className="self-center pr-1 font-mono text-[11px] text-muted">{blockLabel(b)}</span>
          <button className="btn btn-sm" disabled={running} onClick={() => start(async (h) => { h.onStep?.('block', `Rewriting ${blockLabel(b).toLowerCase()}`); await regenerateBlock(id, b._id, h); })}>Regenerate</button>
          <button className="btn btn-sm" disabled={running} onClick={() => setEditing(b)}>Edit</button>
          <button className="btn btn-sm" disabled={running} onClick={() => { if (confirm(`Delete this ${blockLabel(b).toLowerCase()}? You can roll back from Versions.`)) deleteBlock(id, b._id); }}>Delete</button>
        </div>
      </div>
    );
  };

  const after = (n: number, title: string) => {
    if (running || !l.plan?.length) return null;
    return (
      <div className="mt-5 flex flex-wrap gap-2 font-ui">
        <RemixMenu lessonId={id} sectionIndex={n - 1} disabled={running} start={start} />
        <button className="btn btn-sm" onClick={() => setDeeper({ query: title, anchorTitle: `${l.number} ${l.title}` })}>Go deeper</button>
        {review && <button className="btn btn-sm" onClick={() => start((h) => runStep(id, `s${n - 1}`, h))}>Regenerate section</button>}
      </div>
    );
  };

  const header = (
    <div className="eyebrow reveal">
      {unit ? <Link href={`/course/${unit.slug}/`} className="hover:text-ink">Lesson {l.number} · Unit {unit.roman} {unit.short}</Link> : <Link href="/course/" className="hover:text-ink">Lesson {l.number} · My topics</Link>}
    </div>
  );

  const tag = l.meta?.model ? <span className="ai-tag" title="Written by AI on this device">AI-written · {l.meta.model}</span> : null;
  const issuesOpen = (l.issues ?? []).filter((x) => !x.applied && x.problem !== 'No issues found.');

  const actions = l.status !== 'empty' && !running && (
    <div className="reveal mt-6 rounded-2xl border border-line bg-card p-4 font-ui">
      <div className="flex flex-wrap items-center gap-2">
        <button className="btn btn-sm" aria-pressed={review} onClick={() => setReview((r) => !r)}>{review ? 'Done reviewing' : 'Review and edit'}</button>
        {unfinished ? <button className="btn btn-sm btn-primary" onClick={generate}>Resume · {doneCount} of {steps.length} steps done</button>
          : l.steps.check !== 'done' ? <button className="btn btn-sm" onClick={() => start((h) => runStep(id, 'check', h))}>Run check pass</button> : null}
        {l.issues && <button className="btn btn-sm" onClick={() => setPanel('issues')}>{issuesOpen.length ? `${issuesOpen.length} issue${issuesOpen.length > 1 ? 's' : ''} found` : 'Check: no open issues'}</button>}
        <button className="btn btn-sm" onClick={() => setPanel('versions')} disabled={!l.versions.length}>Versions{l.versions.length ? ` · ${l.versions.length}` : ''}</button>
        <button className="btn btn-sm" onClick={() => setDeeper({ query: l.title, anchorTitle: `${l.number} ${l.title}` })}>Go deeper</button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
        <label className="flex min-h-[44px] items-center gap-2.5 text-[14.5px]"><input type="checkbox" className="h-5 w-5 accent-[var(--accent-deep)]" checked={!!l.reviewed} onChange={(e) => db().lessons.update(id, { reviewed: e.target.checked })} /> I have reviewed this lesson</label>
        <button className="btn btn-sm btn-primary" disabled={!l.reviewed || unfinished} onClick={async () => { setPubMsg(null); try { const url = await publishLesson(id); setPubMsg({ ok: true, text: 'Published to the course repo. It becomes a normal page after the next deploy.', url }); } catch (e) { setPubMsg({ ok: false, text: (e as Error).message }); } }}>{l.meta?.publishedAt ? 'Publish update' : 'Publish to course'}</button>
        <button className="btn btn-sm" onClick={() => download(`lesson-${id}.json`, l)}>Export JSON</button>
      </div>
      {!l.reviewed && <p className="mt-1 text-[13px] text-muted">Publishing needs a finished lesson that you have read and ticked as reviewed.</p>}
      {pubMsg && <div className={`mt-3 ${pubMsg.ok ? 'note-good' : 'note-bad'}`} role="status">{pubMsg.text}{pubMsg.url && <> <a className="underline" href={pubMsg.url} target="_blank" rel="noreferrer">See the commit</a></>}</div>}
    </div>
  );

  return (
    <div style={{ ['--hue' as string]: unit?.hue ?? 35 }}>
      <ReadingProgress />
      <div className="mx-auto flex max-w-[1180px] gap-10 px-4 sm:px-6 lg:px-8">
        {unit && <LessonSidebar unitSlug={unit.slug} current={id} />}
        <article className="min-w-0 max-w-[720px] flex-1 pb-16 pt-7 sm:pt-10">
          {running && <Progress l={l} run={run} onStop={stop} />}
          {l.status === 'empty' && !running && !started ? (
            <>
              {header}
              <h1 className="claim reveal mt-3">{l.title}</h1>
              <p className="dek reveal mt-4">{l.dek || 'This lesson is mapped but not written yet. Generate it now and it is saved on this device, private to you, until you choose to publish it.'}</p>
              <div className="reveal mt-5 flex flex-wrap gap-2"><span className="chip">Coming soon</span>{l.meta?.custom && <span className="chip chip-accent">Your topic</span>}</div>
              <section className="reveal mt-8 rounded-2xl border border-line bg-card p-5 sm:p-6" aria-label="Generate">
                <div className="eyebrow">Generate with AI</div>
                <ol className="mt-3 space-y-2 text-[15.5px]">
                  {['Outline: the hook, 4 or 5 sections and the figure plan', 'Each section, streamed block by block', 'Quiz, NET corner, Remember and Done when', 'A check pass for wrong numbers and broken maths'].map((t, i) => (
                    <li key={i} className="flex gap-3"><span className="w-5 shrink-0 font-mono text-[13px] text-muted">{i + 1}</span><span>{t}</span></li>
                  ))}
                </ol>
                <p className="mt-3 text-[14px] text-muted">Each step is saved the moment it finishes. If you lose the connection, come back and press Resume.</p>
                <ModelLine />
                <UnlockBar />
                <button className="btn btn-primary mt-5 w-full sm:w-auto" onClick={generate}>Generate this lesson</button>
              </section>
            </>
          ) : (
            <LessonView doc={l} next={next} wrap={wrap} after={after} tag={tag} actions={actions}>
              {running && run?.partial && <div className="mt-6 rounded-xl border border-dashed border-line px-4 py-3" aria-hidden><p className="typing">{previewOf(run.partial)}</p></div>}
            </LessonView>
          )}
          {err && <div className="mt-6"><ErrorNote msg={err.msg} hint={err.hint}><div className="mt-2 flex flex-wrap gap-2"><button className="btn btn-sm" onClick={generate}>{started ? 'Resume' : 'Try again'}</button><button className="btn btn-sm" onClick={() => setErr(null)}>Dismiss</button></div></ErrorNote></div>}
          <div className="mt-10"><DoubtLauncher lessonId={id} /></div>
        </article>
      </div>
      {unit && <LessonBottomBar unitSlug={unit.slug} current={id} />}

      <EditSheet lessonId={id} block={editing} onClose={() => setEditing(null)} />
      <Sheet open={panel === 'versions'} onClose={() => setPanel('')} title="Version history">
        <ul className="space-y-2">
          {l.versions.map((v) => (
            <li key={v.at} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2">
              <span className="min-w-0 flex-1"><span className="block text-[14.5px]">{v.note}</span><span className="block font-mono text-[12px] text-muted">{new Date(v.at).toLocaleString('en-IN')} · {v.blocks.length} blocks</span></span>
              <button className="btn btn-sm" onClick={async () => { await rollback(id, v.at); setPanel(''); }}>Roll back</button>
            </li>
          ))}
        </ul>
      </Sheet>
      <Sheet open={panel === 'issues'} onClose={() => setPanel('')} title="Check pass">
        {(l.issues ?? []).length === 0 ? <p className="text-muted">No issues found.</p> : (
          <ul className="space-y-3">
            {(l.issues ?? []).map((x, i) => (
              <li key={i} className={`rounded-xl border px-3 py-3 ${x.severity === 'high' ? 'border-[color-mix(in_oklab,var(--bad)_40%,var(--line))]' : 'border-line'}`}>
                <div className="font-mono text-[12px] text-muted">{x.severity === 'high' ? 'Important' : 'Minor'} · block {x.block + 1} · {l.blocks[x.block] ? blockLabel(l.blocks[x.block]) : 'gone'}</div>
                <p className="mt-1 text-[15px]">{mdInline(x.problem)}</p>
                <div className="mt-2 flex gap-2">
                  {x.fix && !x.applied ? <button className="btn btn-sm" onClick={() => applyIssueFix(id, i)}>Apply the suggested fix</button> : null}
                  {x.applied && <span className="chip">Fixed</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Sheet>
      {deeper && <TopicTree open onClose={() => setDeeper(null)} unit={l.unit} anchor={id} anchorTitle={deeper.anchorTitle} initialQuery={deeper.query} />}
    </div>
  );
}

function EditSheet({ lessonId, block, onClose }: { lessonId: string; block: StoredBlock | null; onClose: () => void }) {
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const simple = block && 'text' in block && typeof (block as { text?: unknown }).text === 'string' && block.type !== 'raw';
  useEffect(() => {
    if (!block) return;
    setErr('');
    if (simple) setText((block as { text: string }).text);
    else { const { _id, _step, _ai, _flags, ...rest } = block; void _id; void _step; void _ai; void _flags; setText(JSON.stringify(rest, null, 2)); }
  }, [block, simple]);
  if (!block) return null;
  const save = async () => {
    try {
      const json = simple ? JSON.stringify({ ...Object.fromEntries(Object.entries(block).filter(([k]) => !k.startsWith('_'))), text }) : text;
      await replaceBlock(lessonId, block._id, json);
      onClose();
    } catch (e) { setErr((e as Error).message); }
  };
  return (
    <Sheet open onClose={onClose} title={`Edit · ${blockLabel(block)}`} wide>
      <p className="mb-2 text-[13.5px] text-muted">{simple ? 'Markdown: **bold**, *italic*, "- " lists, $maths$ and $$display maths$$.' : 'The block as JSON. It is checked against the schema and KaTeX before saving.'}</p>
      <textarea className={`field !min-h-[300px] ${simple ? '!font-read !text-[16px]' : ''}`} spellCheck={!!simple} value={text} onChange={(e) => setText(e.target.value)} aria-label="Block content" />
      {err && <div className="note-bad mt-2">{err}</div>}
      <div className="mt-3 flex gap-2"><button className="btn btn-primary" onClick={save}>Save</button><button className="btn" onClick={onClose}>Cancel</button></div>
    </Sheet>
  );
}

/* ---------------- practice ---------------- */

function PracticeStudy({ unit: slug }: { unit: string }) {
  const u = unitBySlug(slug);
  const set = useLiveQuery(() => db().practice.get(slug), [slug]);
  const { run, err, start, stop } = useRunner();
  if (!u) return <main className="mx-auto max-w-[720px] px-4 py-16 text-muted">Unknown unit.</main>;
  const qs = set?.questions ?? [];
  return (
    <main className="mx-auto max-w-[720px] px-4 pb-16 pt-6 sm:px-6 sm:pt-10" style={{ ['--hue' as string]: u.hue }}>
      <Link href={`/course/${u.slug}/`} className="inline-flex min-h-[44px] items-center gap-1.5 text-[14px] text-muted hover:text-ink"><IconBack size={16} /> Unit {u.roman}</Link>
      <header className="mt-2">
        <div className="eyebrow">Practice · Unit {u.roman} · {u.short}</div>
        <h1 className="claim mt-3">Practice set: {u.title}</h1>
        <p className="dek mt-4">Fifteen exam-style questions in the style of UGC NET Paper 2, about half numerical, written by AI on this device.</p>
        <p className="mt-4 rounded-xl border border-line bg-card px-4 py-3 text-[14px] leading-relaxed text-muted">These are <b className="text-ink">practice questions</b>, not previous-year questions. Numericals are recomputed by the app; any mismatch is flagged on the question.</p>
        {set?.model && <div className="mt-3"><span className="ai-tag">AI-written · {set.model}</span></div>}
      </header>
      {!running(run) && (!set || !set.complete) && (
        <section className="mt-8 rounded-2xl border border-line bg-card p-5">
          <div className="eyebrow">Generate with AI</div>
          <p className="mt-2 text-[15px]">{qs.length ? `${qs.length} questions saved. Resume to write the rest.` : 'Writes 15 questions, one at a time, and saves each as it arrives.'}</p>
          <ModelLine />
          <UnlockBar />
          <button className="btn btn-primary mt-4" onClick={() => start((h) => generatePractice(slug, h))}>{qs.length ? 'Resume' : 'Generate practice set'}</button>
        </section>
      )}
      {run && (
        <div className="sticky z-20 mt-6 flex items-center justify-between gap-3 rounded-2xl border border-line bg-card p-4" style={{ top: 'calc(64px + var(--safe-t))' }} role="status">
          <div className="min-w-0"><div className="eyebrow">Writing · {qs.length} of 15</div><p className="typing mt-1 !text-[15px] line-clamp-2">{previewOf(run.partial)}</p></div>
          <button className="btn btn-sm shrink-0" onClick={stop}>Stop</button>
        </div>
      )}
      {err && <div className="mt-6"><ErrorNote msg={err.msg} hint={err.hint} /></div>}
      {qs.length > 0 && (
        <section className="mt-10">
          <Quiz key={`${qs.length}-${set?.complete}`} id={`practice-ai-${slug}`} title={`${qs.length} practice questions`} intro="Each question is tagged with the lesson it tests. Tap an answer to see why." fmt={(s) => mdInline(s)}
            questions={qs.map((x) => ({ ...x, tag: `Practice${x.lesson ? ' · ' + x.lesson : ''}${x.tag ? ' · ' + x.tag : ''}` }))}
            notes={qs.map((x) => (x._flags?.length ? <p className="note-bad mb-3 ml-[26px] !text-[13.5px]"><b>Number check failed.</b> {x._flags.join(' ')}</p> : null))} />
          {set?.complete && !run && <button className="btn btn-sm mt-8" onClick={() => { if (confirm('Replace this set with 15 new questions?')) start((h) => generatePractice(slug, h)); }}>Write a fresh set</button>}
        </section>
      )}
    </main>
  );
}
const running = (r: Run) => !!r;
