'use client';
import { Quiz } from '../lesson/Interactive';
import { recordPractice, useProgress } from '@/lib/progress';
import type { PracticeQ } from '@/content/practice/unit-1';

export default function PracticeRunner({ id, questions }: { id: string; questions: PracticeQ[] }) {
  const p = useProgress();
  const best = p.practice[id];
  return (
    <div>
      {best && <p className="mb-6 rounded-xl border border-line bg-card px-4 py-3 text-[14.5px]">Your best so far: <b>{best.best} / {best.total}</b> · last attempt {best.last} / {best.total}</p>}
      <Quiz
        id={id}
        title={`${questions.length} practice questions`}
        intro="Each question is tagged with the lesson it tests. Tap an answer to see why."
        questions={questions.map((q) => ({ ...q, tag: `${q.lesson}${q.tag ? ' · ' + q.tag : ''}` }))}
        onComplete={(c, t) => recordPractice(id, c, t)}
      />
    </div>
  );
}
