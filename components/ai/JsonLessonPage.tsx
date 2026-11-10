import { findLesson, lessonHref } from '@/lib/curriculum';
import type { LessonDoc } from '@/lib/ai/schema';
import { ReadingProgress } from '@/components/lesson/Interactive';
import { LessonBottomBar, LessonSidebar } from '@/components/lesson/LessonNav';
import { unitBySlug } from '@/lib/curriculum';
import LessonView from './LessonView';
import { lessonLink } from '@/lib/links';

/** A JSON lesson rendered as a full static page (golden example, published AI lessons). */
export default function JsonLessonPage({ doc, tag }: { doc: LessonDoc; tag?: string }) {
  const unit = unitBySlug(doc.unit);
  const f = findLesson(doc.id);
  const next = f?.next ? { number: f.next.number, title: f.next.title, href: f.next.written ? lessonHref(f.unit, f.next) : lessonLink(f.next.id) } : undefined;
  return (
    <div style={{ ['--hue' as string]: unit?.hue ?? 35 }}>
      <ReadingProgress />
      <div className="mx-auto flex max-w-[1180px] gap-10 px-4 sm:px-6 lg:px-8">
        {unit && <LessonSidebar unitSlug={unit.slug} current={doc.id} />}
        <article className="min-w-0 max-w-[720px] flex-1 pb-16 pt-7 sm:pt-10">
          <LessonView doc={doc} next={next} tag={tag ? <span className="ai-tag">{tag}</span> : undefined} />
        </article>
      </div>
      {unit && <LessonBottomBar unitSlug={unit.slug} current={doc.id} />}
    </div>
  );
}
