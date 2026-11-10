import type { Metadata } from 'next';
import Settings from '@/components/ai/Settings';

export const metadata: Metadata = { title: 'Settings' };

export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-[760px] px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
      <header className="mb-10">
        <div className="eyebrow">Settings · AI layer</div>
        <h1 className="claim mt-3">Your models, your keys, this device</h1>
        <p className="dek mt-4">Connect any AI provider to generate missing lessons, go deeper on a topic and ask doubts. Everything you set here, and everything AI writes for you, stays in this browser until you publish it.</p>
      </header>
      <Settings />
    </main>
  );
}
