import { findLesson, lessonHref } from '@/lib/curriculum';
import type { LessonDoc } from '@/lib/ai/schema';
import { ReadingProgress } from '@/components/lesson/Interactive';
import { LessonBottomBar, LessonSidebar } from '@/components/lesson/LessonNav';
import { unitBySlug } from '@/lib/curriculum';
import LessonView from './LessonView';
import { DoubtLauncher, GoDeeperButton } from './Launchers';
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
          <LessonView doc={doc} next={next} tag={tag ? <span className="ai-tag">{tag}</span> : undefined} actions={<div className="reveal mt-5 flex flex-wrap gap-2"><GoDeeperButton lessonId={doc.id} query={doc.title} /></div>}>
            <div className="mt-10"><DoubtLauncher title={`${doc.number} ${doc.title}`} contextText={doc.blocks.map((b) => ('text' in b && typeof b.text === 'string' ? b.text : b.type === 'section' ? `## ${b.title}` : '')).filter(Boolean).join('\n').slice(0, 9000)} /></div>
          </LessonView>
        </article>
      </div>
      {unit && <LessonBottomBar unitSlug={unit.slug} current={doc.id} />}
    </div>
  );
}
