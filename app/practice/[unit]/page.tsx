import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { unitBySlug } from '@/lib/curriculum';
import { UNIT1_PRACTICE } from '@/content/practice/unit-1';
import PracticeRunner from '@/components/course/PracticeRunner';
import { IconBack } from '@/components/Icons';

export const dynamicParams = false;
export function generateStaticParams() { return [{ unit: 'unit-1' }]; }
export const metadata: Metadata = { title: 'Unit I practice' };

export default async function PracticePage({ params }: { params: Promise<{ unit: string }> }) {
  const u = unitBySlug((await params).unit);
  if (!u || u.n !== 1) notFound();
  return (
    <main className="mx-auto max-w-[720px] px-4 pb-16 pt-6 sm:px-6 sm:pt-10" style={{ ['--hue' as string]: u.hue }}>
      <Link href={`/course/${u.slug}/`} className="inline-flex min-h-[44px] items-center gap-1.5 text-[14px] text-muted hover:text-ink"><IconBack size={16} /> Unit {u.roman}</Link>
      <header className="mt-2">
        <div className="eyebrow">Practice · Unit {u.roman} · Lessons 1.1 to 1.7</div>
        <h1 className="claim mt-3">Practice set: semiconductors to the diode equation</h1>
        <p className="dek mt-4">Fifteen questions in the style of UGC NET Paper 2, about half of them numerical. Your score is kept on this device.</p>
        <p className="mt-4 rounded-xl border border-line bg-card px-4 py-3 text-[14px] leading-relaxed text-muted">These are <b className="text-ink">practice questions written for this course</b>, not previous-year questions. Where a value like n<sub>i</sub> or kT/q matters, the question states the one it uses. Unless stated, n<sub>i</sub> = 1 × 10¹⁰ cm⁻³ and kT/q = 25.85 mV at 300 K.</p>
      </header>
      <section className="mt-10">
        <PracticeRunner id={`practice-${u.slug}`} questions={UNIT1_PRACTICE} />
      </section>
    </main>
  );
}
