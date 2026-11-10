import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { WRITTEN, findLesson, lessonHref } from '@/lib/curriculum';
import { LESSONS } from '@/content/lessons';
import { Hook, MathBlock, Remember, UpNext } from '@/components/lesson/Blocks';
import { DoneWhen, Quiz, ReadingProgress } from '@/components/lesson/Interactive';
import { LessonBottomBar, LessonSidebar } from '@/components/lesson/LessonNav';
import { publishedById } from '@/lib/published';
import JsonLessonPage from '@/components/ai/JsonLessonPage';
import { lessonLink } from '@/lib/links';

export const dynamicParams = false;

export function generateStaticParams() {
  return WRITTEN.filter(({ lesson }) => LESSONS[lesson.id] || publishedById(lesson.id)).map(({ unit, lesson }) => ({ unit: unit.slug, lesson: lesson.id }));
}

type Params = { params: Promise<{ unit: string; lesson: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { lesson } = await params;
  const f = findLesson(lesson);
  return { title: f ? `${f.lesson.number} ${f.lesson.title}` : 'Lesson' };
}

export default async function LessonPage({ params }: Params) {
  const { unit: unitSlug, lesson: id } = await params;
  const found = findLesson(id);
  const c = LESSONS[id];
  if (!found || found.unit.slug !== unitSlug) notFound();
  if (!c) {
    const pub = publishedById(id);
    if (!pub) notFound();
    return <JsonLessonPage doc={pub} tag={`AI-written${pub.meta?.model ? ' · ' + pub.meta.model : ''} · reviewed`} />;
  }
  const { unit, lesson, next } = found;
  const builds = c.buildsOn.map((b) => findLesson(b)).filter(Boolean) as NonNullable<ReturnType<typeof findLesson>>[];

  return (
    <div style={{ ['--hue' as string]: unit.hue }}>
      <ReadingProgress />
      <div className="mx-auto flex max-w-[1180px] gap-10 px-4 sm:px-6 lg:px-8">
        <LessonSidebar unitSlug={unit.slug} current={id} />
        <article className="min-w-0 max-w-[720px] flex-1 pb-16 pt-7 sm:pt-10">
          <header>
            <div className="eyebrow reveal">
              <Link href={`/course/${unit.slug}/`} className="hover:text-ink">Lesson {lesson.number} · Unit {unit.roman} {unit.short}</Link>
            </div>
            <h1 className="claim reveal mt-3">{lesson.title}</h1>
            <p className="dek reveal mt-4">{c.dek}</p>
            <div className="reveal mt-5 flex flex-wrap gap-2">
              <span className="chip">About {lesson.minutes} minutes</span>
              <span className="chip">Interactive figure</span>
              <span className="chip">No code</span>
              <span className={`chip ${c.netWeight === 'High' ? 'chip-accent' : ''}`}>NET weight: {c.netWeight}</span>
            </div>
            {builds.length > 0 && (
              <p className="reveal mt-4 text-[14.5px] text-muted">
                Builds on{' '}
                {builds.map((b, i) => (
                  <span key={b.lesson.id}>{i > 0 && ', '}<Link className="font-medium text-ink underline decoration-[var(--line-strong)] underline-offset-4 hover:decoration-[var(--accent)]" href={lessonHref(b.unit, b.lesson)}>{b.lesson.number} {b.lesson.title}</Link></span>
                ))}
              </p>
            )}
          </header>

          <Hook>{c.hook}</Hook>
          {c.body}

          <Remember>{c.remember}</Remember>

          <section className="mt-14" aria-label="Quiz">
            <Quiz id={`lesson-${id}`} questions={c.quiz} title="Quiz · check yourself" intro="Tap an answer. You get the reason straight away." />
          </section>

          <section className="mt-14 rounded-2xl border border-line bg-[var(--accent-tint)] p-4 sm:p-6" aria-label="NET corner">
            <Quiz id={`net-${id}`} questions={c.net.questions} title="NET corner · exam-style practice" intro="Written in the style of UGC NET Paper 2. These are practice questions, not previous-year papers." />
            <div className="mt-8 font-ui">
              <div className="eyebrow mb-2">Exam traps</div>
              <ul className="space-y-2.5 text-[15.5px] leading-relaxed">
                {c.net.traps.map((t, i) => <li key={i} className="flex gap-3"><span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />{<span>{t}</span>}</li>)}
              </ul>
            </div>
            <div className="mt-7 rounded-xl border border-line bg-card px-4 py-3">
              <div className="eyebrow">Formula to memorise · {c.net.formulaLabel}</div>
              <div className="mt-1 text-[17px]"><MathBlock>{c.net.formula}</MathBlock></div>
            </div>
          </section>

          <DoneWhen id={id}>{c.doneWhen}</DoneWhen>

          {next && <UpNext number={next.number} title={next.title} href={next.written ? lessonHref(unit, next) : lessonLink(next.id)} teaser={c.upNextTeaser} />}
        </article>
      </div>
      <LessonBottomBar unitSlug={unit.slug} current={id} />
    </div>
  );
}
