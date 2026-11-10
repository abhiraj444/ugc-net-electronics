import { findLesson, lessonHref } from './curriculum';

/** A lesson's URL: its static page when written or published, otherwise the AI study route. */
export function lessonLink(id: string) {
  const f = findLesson(id);
  if (f && f.lesson.written) return lessonHref(f.unit, f.lesson);
  return `/study/?id=${encodeURIComponent(id)}`;
}
