'use client';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';

export type LocalStatus = { status: 'draft' | 'complete'; published: boolean };

/** Per-lesson AI status from IndexedDB. Undefined on the server and the first client render (no hydration mismatch). */
export function useLessonStatuses(unit: string): Record<string, LocalStatus> | undefined {
  return useLiveQuery(async () => {
    const rows = await db().lessons.where('unit').equals(unit).toArray();
    const out: Record<string, LocalStatus> = {};
    for (const l of rows) {
      const started = l.status !== 'empty' || Object.keys(l.steps ?? {}).length > 0 || (l.blocks?.length ?? 0) > 0;
      if (!started) continue;
      out[l.id] = { status: l.status === 'complete' ? 'complete' : 'draft', published: !!l.meta?.publishedAt };
    }
    return out;
  }, [unit]);
}

export function statusLabel(s?: LocalStatus) {
  if (!s) return 'Generate with AI';
  if (s.status === 'complete') return s.published ? 'AI-written · Published' : 'AI-written · Ready';
  return 'Draft · Resume';
}
