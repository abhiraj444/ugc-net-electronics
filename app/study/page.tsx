import type { Metadata } from 'next';
import { Suspense } from 'react';
import Study from '@/components/ai/Study';

export const metadata: Metadata = { title: 'Study', robots: { index: false } };

/** One client route for everything AI writes on this device: /study?id=<lessonId> and /study?practice=<unit>. */
export default function StudyPage() {
  return (
    <Suspense fallback={<main className="mx-auto max-w-[720px] px-4 py-16 text-muted">Loading…</main>}>
      <Study />
    </Suspense>
  );
}
