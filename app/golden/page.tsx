import type { Metadata } from 'next';
import golden from '@/content/golden/1-6.json';
import { BlockSchema, zodMessage, type LessonDoc } from '@/lib/ai/schema';
import JsonLessonPage from '@/components/ai/JsonLessonPage';

export const metadata: Metadata = { title: 'Golden example · 1.6 as JSON', robots: { index: false } };

/** Lesson 1.6 converted to the AI block schema. Proves the renderer matches the hand-written page; also the example every prompt carries. */
export default function GoldenPage() {
  const doc = golden as unknown as LessonDoc;
  doc.blocks.forEach((b, i) => {
    const r = BlockSchema.safeParse(b);
    if (!r.success) throw new Error(`golden 1-6 block ${i} invalid: ${zodMessage(r.error)}`);
  });
  return <JsonLessonPage doc={doc} tag="Rendered from JSON" />;
}
