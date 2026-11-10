'use client';
import Link from 'next/link';
import { UNITS, WRITTEN, allLessons, lessonHref, unitBySlug } from '@/lib/curriculum';
import { useProgress } from '@/lib/progress';
import { IconArrow, IconCheck } from '../Icons';

export function UnitDoneCount({ slug }: { slug: string }) {
  const p = useProgress();
  const u = unitBySlug(slug)!;
  const ls = allLessons(u);
  const done = ls.filter((l) => p.done[l.id]).length;
  return <span className="tnum">{done}/{ls.length}</span>;
}

export function UnitBar({ slug }: { slug: string }) {
  const p = useProgress();
  const u = unitBySlug(slug)!;
  const ls = allLessons(u);
  const done = ls.filter((l) => p.done[l.id]).length;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--line)]" role="progressbar" aria-valuenow={done} aria-valuemax={ls.length} aria-label={`Unit ${u.roman} progress`}>
      <div className="h-full rounded-full bg-[var(--accent)]" style={{ width: `${(done / ls.length) * 100}%` }} />
    </div>
  );
}

export function LessonDoneMark({ id }: { id: string }) {
  const p = useProgress();
  if (!p.done[id]) return <span className="h-6 w-6 shrink-0 rounded-full border border-line" aria-hidden />;
  return <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--accent-deep)] text-[var(--card)]" aria-label="Done"><IconCheck size={13} /></span>;
}

/** The first written lesson not yet marked done. */
export function UpNextCard() {
  const p = useProgress();
  const next = WRITTEN.find((w) => !p.done[w.lesson.id]) ?? WRITTEN[0];
  const doneCount = WRITTEN.filter((w) => p.done[w.lesson.id]).length;
  const u = next.unit;
  return (
    <Link href={lessonHref(u, next.lesson)} className="card group block p-5 transition-colors hover:border-[var(--line-strong)] sm:p-6" style={{ ['--hue' as string]: u.hue }}>
      <div className="flex items-center justify-between gap-3">
        <span className="eyebrow">{doneCount === 0 ? 'Start here' : 'Up next'} · Lesson {next.lesson.number}</span>
        <span className="eyebrow tnum">{doneCount} of {WRITTEN.length} live lessons done</span>
      </div>
      <div className="mt-2 text-[20px] font-semibold leading-snug tracking-tight sm:text-[22px]">{next.lesson.title}</div>
      <div className="mt-4 inline-flex items-center gap-2 text-[15px] font-semibold text-[var(--accent-deep)]">{doneCount === 0 ? 'Start the lesson' : 'Continue'} <IconArrow size={17} className="transition-transform group-hover:translate-x-0.5" /></div>
    </Link>
  );
}

export function UnitsHeat() {
  const p = useProgress();
  return (
    <div className="grid grid-cols-5 gap-2 sm:grid-cols-10">
      {UNITS.map((u) => {
        const ls = allLessons(u);
        const done = ls.filter((l) => p.done[l.id]).length;
        const f = done / ls.length;
        return (
          <Link key={u.slug} href={`/course/${u.slug}/`} className="flex aspect-square flex-col items-center justify-center rounded-xl border border-line text-center" style={{ ['--hue' as string]: u.hue, background: `color-mix(in oklab, var(--accent) ${Math.round(6 + f * 70)}%, var(--card))` }} aria-label={`Unit ${u.roman}: ${done} of ${ls.length} done`}>
            <span className="font-mono text-[12px] font-semibold" style={{ color: f > 0.5 ? 'var(--card)' : 'var(--accent-deep)' }}>{u.roman}</span>
            <span className="text-[10.5px] tnum" style={{ color: f > 0.5 ? 'var(--card)' : 'var(--muted)' }}>{done}/{ls.length}</span>
          </Link>
        );
      })}
    </div>
  );
}
