import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { UNITS, allLessons, lessonHref, unitBySlug } from '@/lib/curriculum';
import { LESSONS } from '@/content/lessons';
import { Milestone } from '@/components/course/Milestone';
import { LessonDoneMark, UnitBar, UnitDoneCount } from '@/components/course/UnitProgress';
import { IconArrow, IconBack } from '@/components/Icons';

export const dynamicParams = false;
export function generateStaticParams() { return UNITS.map((u) => ({ unit: u.slug })); }

type Params = { params: Promise<{ unit: string }> };
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const u = unitBySlug((await params).unit);
  return { title: u ? `Unit ${u.roman} · ${u.title}` : 'Unit' };
}

export default async function UnitPage({ params }: Params) {
  const u = unitBySlug((await params).unit);
  if (!u) notFound();
  const ls = allLessons(u);
  const live = ls.filter((l) => l.written && LESSONS[l.id]);
  const idx = UNITS.indexOf(u);
  const prevU = UNITS[idx - 1], nextU = UNITS[idx + 1];
  let n = 0;
  return (
    <main className="mx-auto max-w-[860px] px-4 pb-16 pt-6 sm:px-6 sm:pt-10" style={{ ['--hue' as string]: u.hue }}>
      <Link href="/course/" className="inline-flex min-h-[44px] items-center gap-1.5 text-[14px] text-muted hover:text-ink"><IconBack size={16} /> Course map</Link>
      <header className="mt-2">
        <div className="eyebrow reveal">Unit {u.roman} · {u.short}</div>
        <h1 className="claim reveal mt-3">{u.title}</h1>
        <p className="dek reveal mt-4">{u.scope}</p>
        <div className="reveal mt-5 flex flex-wrap items-center gap-2">
          <Milestone name={`Milestone: ${u.milestone}`} hue={u.hue} />
          {u.parts.length > 1 && u.parts.slice(1).map((p) => <Milestone key={p.milestone} name={p.milestone} hue={u.hue} />)}
          <span className="chip">{ls.length} lessons</span>
          <span className="chip">{live.length > 0 ? `${live.length} live` : 'All coming soon'}</span>
        </div>
        <div className="reveal mt-5 flex items-center gap-3"><UnitBar slug={u.slug} /><span className="shrink-0 text-[13px] text-muted"><UnitDoneCount slug={u.slug} /> done</span></div>
      </header>

      {live.length > 0 && (
        <Link href={lessonHref(u, live[0])} className="reveal btn btn-primary mt-7 w-full sm:w-auto">Start with Lesson {live[0].number} <IconArrow size={17} /></Link>
      )}

      <section className="reveal mt-10 rounded-2xl border border-line bg-card p-5">
        <div className="eyebrow mb-2">What you build</div>
        <ul className="space-y-1.5 text-[15.5px]">
          {u.builds.map((b) => <li key={b} className="flex gap-3"><span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />{b}</li>)}
        </ul>
      </section>

      {u.parts.map((part) => (
        <section key={part.title} className="mt-12" aria-label={part.title}>
          <div className="flex items-baseline justify-between gap-4 border-t border-line pt-5">
            <h2 className="text-[22px] font-semibold tracking-tight">{u.parts.length > 1 ? part.title : 'Lessons'}</h2>
            <span className="font-mono text-[26px] leading-none text-[var(--line-strong)]" aria-hidden>{String(++n).padStart(2, '0')}</span>
          </div>
          <ol className="mt-4 divide-y divide-[var(--line)] overflow-hidden rounded-2xl border border-line bg-card">
            {part.lessons.map((l) => {
              const ok = l.written && LESSONS[l.id];
              const inner = (
                <>
                  {ok ? <LessonDoneMark id={l.id} /> : <span className="h-6 w-6 shrink-0" aria-hidden />}
                  <span className="w-10 shrink-0 pt-0.5 font-mono text-[12px] text-muted">{l.number}</span>
                  <span className="min-w-0 flex-1">
                    <span className={`block text-[16px] leading-snug ${ok ? 'font-medium' : ''}`}>{l.title}</span>
                    <span className="mt-1 block text-[12.5px] text-muted">{ok ? `About ${l.minutes} min · Interactive figure · Quiz · NET corner` : l.project ? 'Project · Coming soon' : 'Coming soon'}</span>
                  </span>
                  {ok && <IconArrow size={17} className="mt-1 shrink-0 text-muted" />}
                </>
              );
              return (
                <li key={l.id} className="reveal">
                  {ok ? (
                    <Link href={lessonHref(u, l)} className="flex items-start gap-3 px-4 py-4 transition-colors hover:bg-[var(--accent-tint)]">{inner}</Link>
                  ) : (
                    <div className="flex items-start gap-3 px-4 py-4 opacity-60" aria-disabled="true">{inner}</div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ))}

      <section className="reveal mt-12 rounded-2xl border border-line bg-[var(--accent-tint)] p-5">
        <div className="eyebrow">Unit {u.roman} practice</div>
        {u.n === 1 ? (
          <>
            <p className="mt-1.5 text-[15.5px]">15 exam-style practice questions across lessons 1.1 to 1.7, with an explanation for every option.</p>
            <Link href="/practice/unit-1/" className="btn btn-primary mt-4">Open the practice set <IconArrow size={17} /></Link>
          </>
        ) : (
          <p className="mt-1.5 text-[15.5px] text-muted">The practice set for this unit arrives with its lessons.</p>
        )}
      </section>

      <nav className="mt-10 grid grid-cols-2 gap-3" aria-label="Other units">
        {prevU ? <Link href={`/course/${prevU.slug}/`} className="card p-4 text-[14px]" style={{ ['--hue' as string]: prevU.hue }}><span className="eyebrow">← Unit {prevU.roman}</span><span className="mt-1 block font-medium leading-snug">{prevU.short}</span></Link> : <span />}
        {nextU ? <Link href={`/course/${nextU.slug}/`} className="card p-4 text-right text-[14px]" style={{ ['--hue' as string]: nextU.hue }}><span className="eyebrow">Unit {nextU.roman} →</span><span className="mt-1 block font-medium leading-snug">{nextU.short}</span></Link> : <span />}
      </nav>
    </main>
  );
}
