'use client';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { findLesson, unitBySlug } from '@/lib/curriculum';
import { lessonLink } from '@/lib/links';
import type { LessonDoc } from '@/lib/ai/schema';
import BlockRenderer, { type NextInfo, type Wrap } from './BlockRenderer';


/** Lesson header + blocks, laid out exactly like the hand-written lesson pages. */
export default function LessonView({ doc, next, wrap, after, tag, actions, children, publishedIds = [], hideDiagrams }: {
  doc: LessonDoc; next?: NextInfo; wrap?: Wrap; after?: (n: number, title: string) => ReactNode; tag?: ReactNode; actions?: ReactNode; children?: ReactNode; publishedIds?: string[]; hideDiagrams?: boolean;
}) {
  const unit = unitBySlug(doc.unit);
  const hasFigure = doc.blocks.some((b) => b.type === 'figure');
  const builds = doc.buildsOn.map((b) => ({ id: b, f: findLesson(b) })).filter((x) => x.f);
  const href = (id: string) => (publishedIds.includes(id) && unit ? `/course/${unit.slug}/${id}/` : lessonLink(id));
  return (
    <>
      <header>
        <div className="eyebrow reveal">
          {unit ? <Link href={`/course/${unit.slug}/`} className="hover:text-ink">Lesson {doc.number} · Unit {unit.roman} {unit.short}</Link> : <>Lesson {doc.number} · My topics</>}
        </div>
        <h1 className="claim reveal mt-3">{doc.title}</h1>
        {doc.dek && <p className="dek reveal mt-4">{doc.dek}</p>}
        <div className="reveal mt-5 flex flex-wrap gap-2">
          <span className="chip">About {doc.minutes} minutes</span>
          {hasFigure && <span className="chip">Interactive figure</span>}
          <span className="chip">No code</span>
          <span className={`chip ${doc.netWeight === 'High' ? 'chip-accent' : ''}`}>NET weight: {doc.netWeight}</span>
          {tag}
        </div>
        {builds.length > 0 && (
          <p className="reveal mt-4 text-[14.5px] text-muted">
            Builds on{' '}
            {builds.map((b, i) => (
              <span key={b.id}>{i > 0 && ', '}<Link className="font-medium text-ink underline decoration-[var(--line-strong)] underline-offset-4 hover:decoration-[var(--accent)]" href={href(b.id)}>{b.f!.lesson.number} {b.f!.lesson.title}</Link></span>
            ))}
          </p>
        )}
        {actions}
      </header>
      <BlockRenderer blocks={doc.blocks} lessonId={doc.id} next={next} wrap={wrap} after={after} hideDiagrams={hideDiagrams} />
      {children}
    </>
  );
}
