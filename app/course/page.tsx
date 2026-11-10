import Link from 'next/link';
import type { Metadata } from 'next';
import { UNITS, WRITTEN, allLessons, totalLessons } from '@/lib/curriculum';
import { Milestone } from '@/components/course/Milestone';
import { UnitBar, UnitDoneCount, UpNextCard } from '@/components/course/UnitProgress';
import { IconArrow } from '@/components/Icons';

export const metadata: Metadata = { title: 'Course map' };

export default function CoursePage() {
  return (
    <main className="mx-auto max-w-[1080px] px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
      <header className="max-w-[720px]">
        <div className="eyebrow reveal">UGC NET · Electronic Science · Code 88</div>
        <h1 className="claim reveal mt-3">The whole syllabus, as ten units you can push and pull</h1>
        <p className="dek reveal mt-4">Every unit of the official Paper 2 syllabus, in dependency order. Each unit ends in a project and earns a milestone. Unit I is being written first; its first seven lessons are live.</p>
        <div className="reveal mt-5 flex flex-wrap gap-2">
          <span className="chip">10 units</span>
          <span className="chip">{totalLessons} lessons mapped</span>
          <span className="chip chip-accent" style={{ ['--hue' as string]: 35 }}>{WRITTEN.length} live now</span>
          <span className="chip">Progress saved on this device</span>
        </div>
        <p className="reveal mt-4 text-[14.5px] text-muted">Before you start: Class 12 physics and maths is enough. Every equation is introduced with a picture first.</p>
      </header>

      <div className="reveal mt-8 max-w-[720px]"><UpNextCard /></div>

      <section className="mt-12" aria-labelledby="units-h">
        <div className="flex items-baseline justify-between border-t border-line pt-5">
          <h2 id="units-h" className="text-[23px] font-semibold tracking-tight">Units</h2>
          <span className="font-mono text-[26px] leading-none text-[var(--line-strong)]" aria-hidden>01</span>
        </div>
        <p className="mt-2 max-w-[640px] text-[15px] text-muted">Each unit builds on the ones before it. Lessons that are not written yet are listed honestly as coming soon.</p>
        <ol className="mt-6 grid gap-3 md:grid-cols-2">
          {UNITS.map((u) => {
            const ls = allLessons(u);
            const live = ls.filter((l) => l.written).length;
            return (
              <li key={u.slug} className="reveal" style={{ ['--hue' as string]: u.hue }}>
                <Link href={`/course/${u.slug}/`} className="card group flex h-full flex-col gap-3 border-t-[3px] border-t-[var(--accent)] p-5 transition-colors hover:border-[var(--line-strong)] hover:border-t-[var(--accent)]">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono text-[12px] text-muted">Unit {u.roman}</span>
                    <span className="h-2.5 w-2.5 rounded-full bg-[var(--accent)]" aria-hidden />
                  </div>
                  <div className="text-[19px] font-semibold leading-snug tracking-tight">{u.title}</div>
                  <p className="text-[14.5px] leading-relaxed text-muted">{u.scope}</p>
                  <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                    <Milestone name={u.milestone} hue={u.hue} size="sm" />
                    <span className="text-[13px] text-muted">{ls.length} lessons{u.parts.length > 1 ? ` · ${u.parts.length} parts` : ''} · {live > 0 ? `${live} live` : 'coming soon'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <UnitBar slug={u.slug} />
                    <span className="shrink-0 text-[12.5px] text-muted"><UnitDoneCount slug={u.slug} /></span>
                    <IconArrow size={16} className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>
    </main>
  );
}
