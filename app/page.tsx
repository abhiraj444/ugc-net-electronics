import Link from 'next/link';
import { UNITS, WRITTEN, lessonHref, totalLessons } from '@/lib/curriculum';
import { UNIT1_PRACTICE } from '@/content/practice/unit-1';
import RotatingVerb from '@/components/home/RotatingVerb';
import UnitsExplorer from '@/components/home/UnitsExplorer';
import MiniJunction from '@/components/home/MiniJunction';
import { Quiz } from '@/components/lesson/Interactive';
import { IconArrow } from '@/components/Icons';

const FAQ = [
  { q: 'Does this follow the official UGC NET syllabus?', a: 'Yes. The ten units mirror the official Paper 2 syllabus for Electronic Science (subject code 88), from semiconductor devices to instrumentation. Every topic in the syllabus has a lesson slot on the course map.' },
  { q: 'Are the questions from previous papers?', a: 'No. Every question here is a practice question written for this course in the NTA style, and is labelled as practice. A previous-year bank will only ever be built from genuine papers, marked with year and session.' },
  { q: 'How much of the course is ready?', a: `Unit I lessons 1.1 to 1.7 are fully written, each with an interactive figure, a quiz and a NET corner, plus a ${UNIT1_PRACTICE.length}-question practice set. The other ${totalLessons - WRITTEN.length} lessons are mapped and marked “Coming soon”.` },
  { q: 'Are there videos?', a: 'Not yet. Each lesson is built to be read and handled: plain-language text, a figure you can drag, and questions that check you. Videos will be added only when they exist.' },
  { q: 'Do I need an account?', a: 'No. Lessons you mark as done and your quiz scores are saved in this browser on this device. Clearing your browser data clears them.' },
  { q: 'Which value of nᵢ should I use, 1 × 10¹⁰ or 1.5 × 10¹⁰?', a: 'Use whichever the question gives. The modern measured value for silicon at 300 K is close to 1 × 10¹⁰ cm⁻³; many Indian textbooks still use 1.5 × 10¹⁰. The lessons show both and say which one each worked example uses.' },
];

const SAMPLE = UNIT1_PRACTICE[11];

export default function Home() {
  const first = WRITTEN[0];
  return (
    <main style={{ ['--hue' as string]: 35 }}>
      {/* Hero */}
      <section className="mx-auto max-w-[1080px] px-4 pb-10 pt-10 sm:px-6 sm:pt-16">
        <div className="eyebrow reveal">UGC NET · Electronic Science · Code 88</div>
        <h1 className="reveal mt-4 text-[38px] font-semibold leading-[1.08] tracking-[-0.03em] sm:text-[60px]" style={{ textWrap: 'balance' }}>
          Go beyond memorising electronics.
          <RotatingVerb />
        </h1>
        <p className="dek reveal mt-5 max-w-[600px]">An interactive course for the full Paper 2 syllabus. Every lesson is one idea in plain words, a figure you can push with your thumb, and the exam questions that test it.</p>
        <div className="reveal mt-7 flex flex-col gap-3 sm:flex-row">
          <Link href={lessonHref(first.unit, first.lesson)} className="btn btn-primary h-12 text-[16px]">Start Lesson 1.1 <IconArrow size={18} /></Link>
          <Link href="/course/" className="btn h-12 text-[16px]">See the course map</Link>
        </div>
        <dl className="reveal mt-9 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-[var(--line)] sm:grid-cols-4">
          {[
            { k: 'Units', v: '10', s: 'the whole syllabus' },
            { k: 'Lessons mapped', v: String(totalLessons), s: 'claim titles, in order' },
            { k: 'Live now', v: String(WRITTEN.length), s: 'Unit I, lessons 1.1–1.7' },
            { k: 'Practice', v: String(UNIT1_PRACTICE.length), s: 'questions with reasons' },
          ].map((x) => (
            <div key={x.k} className="bg-card px-4 py-3.5">
              <dt className="text-[12px] text-muted">{x.k}</dt>
              <dd className="text-[26px] font-semibold tracking-tight tnum">{x.v}</dd>
              <dd className="text-[12px] text-muted">{x.s}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Live lessons strip */}
      <section className="border-y border-line bg-card/60 py-6" aria-label="Lessons you can open today">
        <div className="mx-auto max-w-[1080px] px-4 sm:px-6">
          <div className="eyebrow mb-3">Open today</div>
        </div>
        <div className="no-scrollbar flex snap-x scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 sm:scroll-px-6 sm:px-6 lg:mx-auto lg:max-w-[1080px]">
          {WRITTEN.map(({ unit, lesson }) => (
            <Link key={lesson.id} href={lessonHref(unit, lesson)} className="card flex w-[250px] shrink-0 snap-start flex-col p-4 transition-colors hover:border-[var(--line-strong)]" style={{ ['--hue' as string]: unit.hue }}>
              <div className="flex items-center justify-between font-mono text-[11.5px] text-muted"><span>Lesson {lesson.number}</span><span>{lesson.minutes} min</span></div>
              <div className="mt-2 text-[15.5px] font-semibold leading-snug">{lesson.title}</div>
              <div className="mt-auto pt-3 text-[12.5px] text-[var(--accent-deep)]">Interactive · Quiz · NET corner</div>
            </Link>
          ))}
        </div>
      </section>

      {/* Read it. Drag it. Solve it. */}
      <section className="mx-auto max-w-[1080px] px-4 py-14 sm:px-6" aria-labelledby="three-h">
        <div className="flex items-baseline justify-between border-t border-line pt-5">
          <h2 id="three-h" className="text-[26px] font-semibold tracking-tight sm:text-[32px]">Read it. Drag it. Solve it.</h2>
          <span className="font-mono text-[26px] leading-none text-[var(--line-strong)]" aria-hidden>01</span>
        </div>
        <p className="mt-2 max-w-[620px] text-[15.5px] text-muted">Three ways into every idea. Different people get it through different doors, and each door makes the others easier.</p>
        <div className="mt-7 grid gap-4 md:grid-cols-3">
          <article className="reveal card flex flex-col p-5">
            <div className="eyebrow">Read · Lesson 1.6</div>
            <h3 className="mt-2 text-[18px] font-semibold leading-snug">A scene first, then the physics</h3>
            <blockquote className="mt-3 border-l-2 border-[var(--accent)] pl-4 font-read text-[16.5px] leading-relaxed">
              Picture two villages next to each other. One is crowded with people who want more space. The other is full of empty houses. Open the border and people rush across to fill them…
            </blockquote>
            <p className="mt-3 text-[14px] text-muted">Plain words and short sentences. Every new term in bold, explained on the spot. No equation before you have the picture.</p>
            <Link href="/course/unit-1/1-6/" className="mt-auto inline-flex min-h-[44px] items-center gap-1.5 pt-3 text-[14.5px] font-semibold text-[var(--accent-deep)]">Read the lesson <IconArrow size={16} /></Link>
          </article>
          <article className="reveal card flex flex-col p-5">
            <div className="eyebrow">Drag · a live figure</div>
            <h3 className="mt-2 text-[18px] font-semibold leading-snug">Push the doping, watch the wall move</h3>
            <p className="mt-2 text-[14px] text-muted">Lighter n-side doping, wider depletion region. The numbers are computed, not drawn.</p>
            <div className="mt-3"><MiniJunction /></div>
          </article>
          <article className="reveal card flex flex-col p-5">
            <div className="eyebrow">Solve · NET-style practice</div>
            <div className="mt-2">
              <Quiz id="home-sample" questions={[{ ...SAMPLE, tag: 'Numerical' }]} title="Try one" />
            </div>
          </article>
        </div>
      </section>

      {/* Units explorer */}
      <section className="mx-auto max-w-[1080px] px-4 pb-14 sm:px-6" aria-labelledby="units-h">
        <div className="flex items-baseline justify-between border-t border-line pt-5">
          <h2 id="units-h" className="text-[26px] font-semibold tracking-tight sm:text-[32px]">Ten units, one map</h2>
          <span className="font-mono text-[26px] leading-none text-[var(--line-strong)]" aria-hidden>02</span>
        </div>
        <p className="mb-6 mt-2 max-w-[620px] text-[15.5px] text-muted">Each unit ends in a project you keep and earns a milestone. Pick one to see what is inside.</p>
        <UnitsExplorer />
        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {UNITS.map((u) => (
            <Link key={u.slug} href={`/course/${u.slug}/`} className="rounded-xl border border-line bg-card px-3 py-2.5 text-[13px] hover:border-[var(--line-strong)]" style={{ ['--hue' as string]: u.hue }}>
              <span className="flex items-center gap-1.5 font-mono text-[11.5px] text-muted"><span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />Unit {u.roman}</span>
              <span className="mt-0.5 block font-medium leading-snug">{u.milestone}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-[1080px] px-4 pb-14 sm:px-6">
        <div className="card flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <div className="eyebrow">Start here · Lesson 1.1 · 14 minutes</div>
            <div className="mt-2 max-w-[520px] text-[21px] font-semibold leading-snug tracking-tight">{first.lesson.title}</div>
          </div>
          <Link href={lessonHref(first.unit, first.lesson)} className="btn btn-primary h-12 shrink-0 text-[16px]">Start Lesson 1.1 <IconArrow size={18} /></Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-[760px] px-4 pb-16 sm:px-6" aria-labelledby="faq-h">
        <div className="flex items-baseline justify-between border-t border-line pt-5">
          <h2 id="faq-h" className="text-[26px] font-semibold tracking-tight">Fair questions, straight answers</h2>
          <span className="font-mono text-[26px] leading-none text-[var(--line-strong)]" aria-hidden>03</span>
        </div>
        <div className="mt-5 divide-y divide-[var(--line)] rounded-2xl border border-line bg-card">
          {FAQ.map((f) => (
            <details key={f.q} className="describe group px-4">
              <summary className="flex min-h-[56px] items-center justify-between gap-3 py-3 text-[16px] font-medium">
                {f.q}
                <span className="chev shrink-0 text-[20px] text-muted transition-transform" aria-hidden>›</span>
              </summary>
              <p className="pb-4 text-[15.5px] leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[1080px] flex-col gap-2 px-4 py-8 text-[13px] text-muted sm:flex-row sm:justify-between sm:px-6">
          <span>Beyond Memorising · an independent study aid for UGC NET Electronic Science (Code 88). Not affiliated with NTA or UGC.</span>
          <span>Physics constants: CODATA 2018. Silicon data: Sze & Ng, 3rd ed.</span>
        </div>
      </footer>
    </main>
  );
}
