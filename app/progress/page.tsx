import type { Metadata } from 'next';
import ProgressView from '@/components/course/ProgressView';

export const metadata: Metadata = { title: 'Your progress' };

export default function ProgressPage() {
  return (
    <main className="mx-auto max-w-[860px] px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
      <div className="eyebrow">Progress</div>
      <h1 className="claim mt-3">What you have done so far</h1>
      <p className="dek mt-4">Saved in this browser only. Nothing is sent anywhere, so it will not follow you to another device.</p>
      <ProgressView />
    </main>
  );
}
