'use client';
import dynamic from 'next/dynamic';
import { Fragment, useEffect, useState, type ReactNode } from 'react';
import { Describe, EquationCard, Example, FigureFrame, Hook, MathBlock, Remember, Section, SideNote, TryThis, UpNext } from '@/components/lesson/Blocks';
import { DoneWhen, Quiz, YourGuess } from '@/components/lesson/Interactive';
import type { FigureBlock, NetQuestion, StoredBlock } from '@/lib/ai/schema';
import { Md, mdInline } from './Markdown';
import { looksLikeMermaid } from '@/lib/ai/mermaid';

const Loading = () => <div className="figure my-3 grid h-[260px] place-items-center font-ui text-[14px] text-muted">Loading figure…</div>;
const FIGS: Record<string, React.ComponentType<Record<string, number>>> = {
  'pn-junction': dynamic(() => import('@/components/figures/PNJunction'), { loading: Loading }) as never,
  'diode-iv': dynamic(() => import('@/components/figures/DiodeIV'), { loading: Loading }) as never,
  doping: dynamic(() => import('@/components/figures/Doping'), { loading: Loading }) as never,
  'effective-mass': dynamic(() => import('@/components/figures/EffectiveMass'), { loading: Loading }) as never,
  'energy-bands': dynamic(() => import('@/components/figures/EnergyBands'), { loading: Loading }) as never,
  'fermi-filling': dynamic(() => import('@/components/figures/FermiFilling'), { loading: Loading }) as never,
  'thermal-lattice': dynamic(() => import('@/components/figures/ThermalLattice'), { loading: Loading }) as never,
};
const PlotFigure = dynamic(() => import('./PlotFigure'), { loading: Loading });
const Diagram = dynamic(() => import('./Diagram'), { ssr: false });

export function Figure({ b }: { b: FigureBlock }) {
  if (b.figure === 'plot' && b.plot) return <div className="reveal"><PlotFigure spec={b.plot} title={b.title} label={b.label} /></div>;
  if (b.figure === 'diagram' && b.diagram && looksLikeMermaid(b.diagram)) return <Diagram code={b.diagram} title={b.title} />;
  if (b.figure === 'diagram' || !FIGS[b.figure]) {
    return (
      <div className="reveal"><FigureFrame label={b.label ?? 'Figure'} title={b.title ?? 'Diagram'}>
        <div className="prose-read border-t border-line px-4 py-4 !text-[16px] [&_p:last-child]:mb-0"><Md text={b.diagram ?? `Figure "${b.figure}" is not in the catalogue.`} /></div>
      </FigureFrame></div>
    );
  }
  const C = FIGS[b.figure];
  const params = Object.fromEntries(Object.entries(b.params ?? {}).map(([k, v]) => [k, Number(v)]).filter(([, v]) => isFinite(v as number)));
  return <C {...params} />;
}

function NetCorner({ id, b }: { id: string; b: Extract<StoredBlock, { type: 'netCorner' }> }) {
  const [notes, setNotes] = useState<ReactNode[]>([]);
  useEffect(() => {
    let live = true;
    import('@/lib/ai/mathsafe').then(({ checkNumeric }) => {
      if (!live) return;
      setNotes(b.questions.map((q: NetQuestion) => {
        if (!q.numeric) return null;
        const r = checkNumeric(q.numeric, q.options[q.answer]);
        return r.ok ? null : <p className="note-bad mb-3 ml-[26px] !text-[13.5px]" role="note"><b>Number check failed.</b> {r.message} Treat this question with care.</p>;
      }));
    });
    return () => { live = false; };
  }, [b]);
  return (
    <section className="mt-14 rounded-2xl border border-line bg-[var(--accent-tint)] p-4 sm:p-6" aria-label="NET corner">
      <Quiz id={`net-${id}`} questions={b.questions} fmt={(s) => mdInline(s)} notes={notes} title="NET corner · exam-style practice" intro="Written in the style of UGC NET Paper 2. These are practice questions, not previous-year papers." />
      <div className="mt-8 font-ui">
        <div className="eyebrow mb-2">Exam traps</div>
        <ul className="space-y-2.5 text-[15.5px] leading-relaxed">
          {b.traps.map((t, i) => <li key={i} className="flex gap-3"><span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" /><span>{mdInline(t)}</span></li>)}
        </ul>
      </div>
      <div className="mt-7 rounded-xl border border-line bg-card px-4 py-3">
        <div className="eyebrow">Formula to memorise · {b.formulaLabel}</div>
        <div className="mt-1 text-[17px]"><MathBlock>{b.formula}</MathBlock></div>
      </div>
    </section>
  );
}

export type NextInfo = { number: string; title: string; href?: string };
export type Wrap = (b: StoredBlock, i: number, node: ReactNode) => ReactNode;

function one(b: StoredBlock, lessonId: string, next?: NextInfo): ReactNode {
  switch (b.type) {
    case 'hook': return <Hook><Md text={b.text} /></Hook>;
    case 'paragraph': return <div className="reveal"><Md text={b.text} /></div>;
    case 'equationCard': return <EquationCard title={b.title} tex={b.tex} symbols={b.symbols} typical={<>{mdInline(b.typical)}</>} />;
    case 'example': return <Example title={b.title}><Md text={b.text} /></Example>;
    case 'sideNote': return <SideNote><Md text={b.text} /></SideNote>;
    case 'yourGuess': return <YourGuess question={<>{mdInline(b.question)}</>} answer={<>{mdInline(b.answer)}</>} />;
    case 'tryThis': return <TryThis>{mdInline(b.text)}</TryThis>;
    case 'figure': return <Figure b={b} />;
    case 'diagram': return <Diagram code={b.code} title={b.title} label={b.label} />;
    case 'describe': return <Describe><Md text={b.text} /></Describe>;
    case 'remember': return <Remember>{mdInline(b.text)}</Remember>;
    case 'quiz': return <section className="mt-14" aria-label="Quiz"><Quiz id={`lesson-${lessonId}`} questions={b.questions} fmt={(s) => mdInline(s)} title="Quiz · check yourself" intro="Tap an answer. You get the reason straight away." /></section>;
    case 'netCorner': return <NetCorner id={lessonId} b={b} />;
    case 'doneWhen': return <DoneWhen id={lessonId}>{mdInline(b.text)}</DoneWhen>;
    case 'upNext': return next ? <UpNext number={next.number} title={next.title} href={next.href} teaser={b.teaser} /> : null;
    case 'raw': return (
      <div className="my-6 rounded-xl border border-dashed border-[var(--bad)] bg-card px-4 py-3 font-ui">
        <div className="eyebrow !text-[var(--bad)]">Unparsed block · {b.error}</div>
        <p className="mt-1 whitespace-pre-wrap break-words text-[14.5px] leading-relaxed">{b.text}</p>
      </div>
    );
    default: return null;
  }
}

const CLOSERS = new Set(['remember', 'quiz', 'netCorner', 'doneWhen', 'upNext', 'hook']);

/** Renders stored lesson blocks with the same components as the hand-written lessons. */
export default function BlockRenderer({ blocks, lessonId, next, wrap, after }: { blocks: StoredBlock[]; lessonId: string; next?: NextInfo; wrap?: Wrap; after?: (sectionIndex: number, title: string) => ReactNode }) {
  const out: ReactNode[] = [];
  let sec: { n: number; title: string; items: ReactNode[]; head: ReactNode } | null = null;
  let n = 0;
  const flush = () => {
    if (!sec) return;
    const s = sec;
    out.push(<Fragment key={`s${s.n}`}><Section n={s.n} title={s.title}>{s.head}{s.items}{after?.(s.n, s.title)}</Section></Fragment>);
    sec = null;
  };
  blocks.forEach((b, i) => {
    const node = one(b, lessonId, next);
    const wrapped = wrap ? wrap(b, i, node) : node;
    if (b.type === 'section') {
      flush();
      n++;
      sec = { n, title: b.title, items: [], head: wrap ? <Fragment key={b._id + 'h'}>{wrap(b, i, null)}</Fragment> : null };
      return;
    }
    if (CLOSERS.has(b.type)) flush();
    if (sec) (sec as { items: ReactNode[] }).items.push(<Fragment key={b._id}>{wrapped}</Fragment>);
    else out.push(<Fragment key={b._id}>{wrapped}</Fragment>);
  });
  flush();
  return <>{out}</>;
}
