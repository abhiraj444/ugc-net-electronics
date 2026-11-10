'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { recordQuiz, setDone, useProgress } from '@/lib/progress';
import { IconCheck } from '../Icons';
import { rich } from '@/lib/rich';

export type MCQ = { stem: string; options: string[]; answer: number; why: string[]; tag?: string };

export function YourGuess({ question, answer }: { question: ReactNode; answer: ReactNode }) {
  const [shown, setShown] = useState(false);
  return (
    <aside className="reveal aside my-7" aria-label="Your guess">
      <span className="aside-label">Your guess</span>
      <div className="prose-read !text-[18px]"><p>{typeof question === 'string' ? rich(question) : question}</p></div>
      {!shown ? (
        <button className="btn btn-sm mt-1" onClick={() => setShown(true)}>I&apos;ve guessed, show me</button>
      ) : (
        <div className="prose-read mt-1 border-t border-[color-mix(in_oklab,var(--accent)_25%,var(--line))] pt-3 !text-[17px]" role="status"><p>{answer}</p></div>
      )}
    </aside>
  );
}

const LETTERS = ['A', 'B', 'C', 'D', 'E'];



function Question({ q, idx, onAnswer, fmt = rich, note }: { q: MCQ; idx: number; onAnswer: (correct: boolean) => void; fmt?: (s: string) => ReactNode; note?: ReactNode }) {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  return (
    <li className="list-none">
      <div className="mb-3 flex gap-3">
        <span className="mt-[3px] font-mono text-xs text-muted">{String(idx + 1).padStart(2, '0')}</span>
        <p className="text-[17px] font-medium leading-snug">
          {q.tag && <span className="mr-2 rounded-md border border-line px-1.5 py-0.5 align-middle font-mono text-[10.5px] font-normal text-muted">{q.tag}</span>}
          {fmt(q.stem)}
        </p>
      </div>
      {note}
      <div className="space-y-2.5" role="radiogroup" aria-label={`Question ${idx + 1}`}>
        {q.options.map((o, i) => {
          const isRight = answered && i === q.answer;
          const isWrong = answered && i === picked && i !== q.answer;
          return (
            <div key={i}>
              <button
                role="radio"
                aria-checked={picked === i}
                disabled={answered}
                className={`opt ${isRight ? 'is-right' : ''} ${isWrong ? 'is-wrong' : ''}`}
                onClick={() => { setPicked(i); onAnswer(i === q.answer); }}
              >
                <span className="letter">{isRight ? <IconCheck size={14} /> : LETTERS[i]}</span>
                <span className="min-w-0 flex-1">{fmt(o)}</span>
              </button>
              {answered && (i === picked || i === q.answer) && (
                <p className="why" aria-live="polite"><span className={`font-semibold ${i === q.answer ? 'text-[var(--good)]' : 'text-[var(--bad)]'}`}>{i === q.answer ? (i === picked ? 'Right. ' : 'Correct answer. ') : 'Not quite. '}</span>{fmt(q.why[i])}</p>
              )}
            </div>
          );
        })}
      </div>
      {answered && (
        <details className="mt-2 pl-[42px] text-[14px] text-muted">
          <summary className="min-h-[36px] cursor-pointer py-2">Why the other options are wrong</summary>
          <ul className="space-y-1.5 pb-1">
            {q.options.map((_, i) => (i !== picked && i !== q.answer ? <li key={i}><span className="font-mono text-xs">{LETTERS[i]}</span> · {fmt(q.why[i])}</li> : null))}
          </ul>
        </details>
      )}
    </li>
  );
}

export function Quiz({ id, questions, title = 'Quiz', intro, onComplete, fmt, notes }: { id: string; questions: MCQ[]; title?: string; intro?: ReactNode; onComplete?: (correct: number, total: number) => void; fmt?: (s: string) => ReactNode; notes?: ReactNode[] }) {
  const [results, setResults] = useState<Record<number, boolean>>({});
  const [round, setRound] = useState(0);
  const answered = Object.keys(results).length;
  const correct = Object.values(results).filter(Boolean).length;
  useEffect(() => {
    if (answered === questions.length) { recordQuiz(id, correct, questions.length); onComplete?.(correct, questions.length); }
  }, [answered, correct, id, questions.length]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="font-ui">
      <div className="mb-5 flex items-end justify-between gap-3">
        <div>
          <div className="eyebrow">{title}</div>
          {intro && <p className="mt-1 text-[15px] text-muted">{intro}</p>}
        </div>
        <div className="shrink-0 text-right font-mono text-sm tabular-nums text-muted" aria-live="polite">{questions.length > 5 ? <>{answered}/{questions.length} answered<br />{correct} right</> : <>{correct}/{questions.length}</>}</div>
      </div>
      <ol key={round} className="space-y-9">
        {questions.map((q, i) => <Question key={i} q={q} idx={i} fmt={fmt} note={notes?.[i]} onAnswer={(ok) => setResults((r) => (i in r ? r : { ...r, [i]: ok }))} />)}
      </ol>
      {answered === questions.length && (
        <div className="mt-7 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-card px-4 py-3" role="status">
          <span className="text-[15px]"><b>{correct} of {questions.length}</b> right{correct === questions.length ? '. Clean sweep.' : correct >= questions.length - 1 ? '. Nearly there.' : '. Reread the sections above and try again.'}</span>
          <button className="btn btn-sm" onClick={() => { setResults({}); setRound((r) => r + 1); }}>Try again</button>
        </div>
      )}
    </div>
  );
}

export function DoneWhen({ id, children }: { id: string; children: ReactNode }) {
  const p = useProgress();
  const done = !!p.done[id];
  return (
    <section className="reveal mt-14 rounded-2xl border border-line bg-card p-5 sm:p-6" aria-label="Done when">
      <div className="eyebrow mb-2">Done when</div>
      <p className="font-read text-[18px] leading-relaxed">{children}</p>
      <button className={`btn mt-4 w-full sm:w-auto ${done ? '' : 'btn-primary'}`} onClick={() => setDone(id, !done)} aria-pressed={done}>
        {done ? <><IconCheck size={18} /> Done · tap to undo</> : 'Mark as done'}
      </button>
    </section>
  );
}

/** Slim reading-progress bar pinned under the top bar. */
export function ReadingProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const h = document.documentElement;
        const max = h.scrollHeight - h.clientHeight;
        setP(max > 0 ? Math.min(1, Math.max(0, h.scrollTop / max)) : 0);
      });
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => { window.removeEventListener('scroll', on); window.removeEventListener('resize', on); cancelAnimationFrame(raf); };
  }, []);
  return (
    <div className="sticky z-30 h-[3px] w-full bg-[var(--line)]" style={{ top: 'calc(52px + var(--safe-t))' }} role="progressbar" aria-label="Reading progress" aria-valuenow={Math.round(p * 100)} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full bg-[var(--accent)]" style={{ width: `${p * 100}%` }} />
    </div>
  );
}
