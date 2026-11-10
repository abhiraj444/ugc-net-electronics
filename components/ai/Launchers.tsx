'use client';
import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { findLesson } from '@/lib/curriculum';

/** Light buttons for the static pages. The AI code (Dexie, zod, mathjs, prompts) loads only when one is pressed. */
const TopicTree = dynamic(() => import('./TopicTree'), { ssr: false });
const DoubtSheet = dynamic(() => import('./Remix').then((m) => m.DoubtSheet), { ssr: false });
export const CustomTopics = dynamic(() => import('./CustomTopics'), { ssr: false });

export function AddTopicButton({ unit, label = 'Add a topic' }: { unit?: string; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn" onClick={() => setOpen(true)}>{label}</button>
      {open && <TopicTree open onClose={() => setOpen(false)} unit={unit} />}
    </>
  );
}

export function GoDeeperButton({ lessonId, query }: { lessonId: string; query: string }) {
  const [open, setOpen] = useState(false);
  const f = findLesson(lessonId);
  return (
    <>
      <button className="btn btn-sm" onClick={() => setOpen(true)}>Go deeper</button>
      {open && <TopicTree open onClose={() => setOpen(false)} unit={f?.unit.slug} anchor={lessonId} anchorTitle={f ? `${f.lesson.number} ${f.lesson.title}` : undefined} initialQuery={query} />}
    </>
  );
}

/** Rendered at the end of every section on /course lesson pages: Go deeper on that section. */
export function SectionDeeper({ title }: { title: string }) {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => { const m = location.pathname.match(/^\/course\/unit-\d+\/([^/]+)\/?$/); setId(m ? m[1] : null); }, []);
  if (!id) return null;
  return <div className="mt-5 font-ui"><GoDeeperButton lessonId={id} query={title} /></div>;
}

export function DoubtLauncher({ lessonId, title, contextText }: { lessonId?: string; title?: string; contextText?: string }) {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState('');
  return (
    <>
      <button className="btn w-full sm:w-auto" onClick={() => { setSection(currentSectionTitle()); setOpen(true); }}>Ask a doubt about this lesson</button>
      {open && <DoubtSheet open onClose={() => setOpen(false)} lessonId={lessonId} title={title} contextText={contextText} section={section} />}
    </>
  );
}

export function currentSectionTitle() {
  const hs = Array.from(document.querySelectorAll<HTMLElement>('article h2'));
  let cur = '';
  for (const h of hs) if (h.getBoundingClientRect().top < 160) cur = h.innerText;
  return cur || hs[0]?.innerText || '';
}
