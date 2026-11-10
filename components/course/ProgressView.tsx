'use client';
import Link from 'next/link';
import { useState } from 'react';
import { UNITS, WRITTEN, allLessons, findLesson, lessonHref } from '@/lib/curriculum';
import { resetProgress, useProgress } from '@/lib/progress';
import { Milestone } from './Milestone';
import { UnitsHeat, UpNextCard } from './UnitProgress';

export default function ProgressView() {
  const p = useProgress();
  const [confirm, setConfirm] = useState(false);
  const done = Object.keys(p.done).length;
  const quizKeys = Object.keys(p.quiz).filter((k) => k.startsWith('lesson-') || k.startsWith('net-'));
  const qTotals = quizKeys.reduce((a, k) => ({ c: a.c + p.quiz[k].correct, t: a.t + p.quiz[k].total }), { c: 0, t: 0 });
  const practice = p.practice['practice-unit-1'];
  return (
    <div className="mt-8 space-y-10">
      <div className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-line bg-[var(--line)]">
        {[
          { k: 'Lessons done', v: `${done}`, s: `of ${WRITTEN.length} live` },
          { k: 'Quiz accuracy', v: qTotals.t ? `${Math.round((qTotals.c / qTotals.t) * 100)}%` : '–', s: qTotals.t ? `${qTotals.c}/${qTotals.t} best` : 'no quizzes yet' },
          { k: 'Unit I practice', v: practice ? `${practice.best}/${practice.total}` : '–', s: practice ? 'best score' : 'not tried' },
        ].map((x) => (
          <div key={x.k} className="bg-card p-4">
            <div className="text-[12px] text-muted">{x.k}</div>
            <div className="mt-1 text-[24px] font-semibold tnum">{x.v}</div>
            <div className="text-[12px] text-muted">{x.s}</div>
          </div>
        ))}
      </div>

      <UpNextCard />

      <section>
        <div className="eyebrow mb-3">All ten units</div>
        <UnitsHeat />
      </section>

      <section>
        <div className="eyebrow mb-3">Milestones</div>
        <div className="flex flex-wrap gap-2">
          {UNITS.map((u) => {
            const ls = allLessons(u);
            const earned = ls.every((l) => p.done[l.id]);
            return <Milestone key={u.slug} name={`${u.roman} · ${u.milestone}`} hue={u.hue} earned={earned} size="sm" />;
          })}
        </div>
        <p className="mt-2 text-[13px] text-muted">A milestone fills in when every lesson in its unit is marked done.</p>
      </section>

      <section>
        <div className="eyebrow mb-3">Lesson by lesson</div>
        <ol className="divide-y divide-[var(--line)] overflow-hidden rounded-2xl border border-line bg-card">
          {WRITTEN.map(({ unit, lesson }) => {
            const qz = p.quiz[`lesson-${lesson.id}`];
            const net = p.quiz[`net-${lesson.id}`];
            return (
              <li key={lesson.id} style={{ ['--hue' as string]: unit.hue }}>
                <Link href={lessonHref(unit, lesson)} className="flex items-center gap-3 px-4 py-3.5 hover:bg-[var(--accent-tint)]">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${p.done[lesson.id] ? 'bg-[var(--accent)]' : 'border border-[var(--line-strong)]'}`} aria-label={p.done[lesson.id] ? 'done' : 'not done'} />
                  <span className="w-8 shrink-0 font-mono text-[12px] text-muted">{lesson.number}</span>
                  <span className="min-w-0 flex-1 truncate text-[15px]">{findLesson(lesson.id)!.lesson.title.split(':')[0]}</span>
                  <span className="shrink-0 text-right text-[12.5px] tnum text-muted">{qz ? `Quiz ${qz.correct}/${qz.total}` : 'Quiz –'}<br />{net ? `NET ${net.correct}/${net.total}` : 'NET –'}</span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="border-t border-line pt-6">
        {!confirm ? (
          <button className="btn btn-sm" onClick={() => setConfirm(true)}>Reset my progress</button>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[14.5px]">Clear every lesson, quiz and practice score on this device?</span>
            <button className="btn btn-sm" onClick={() => { resetProgress(); setConfirm(false); }}>Yes, clear it</button>
            <button className="btn btn-sm" onClick={() => setConfirm(false)}>Keep it</button>
          </div>
        )}
      </section>
    </div>
  );
}
