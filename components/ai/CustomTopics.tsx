'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { unitBySlug } from '@/lib/curriculum';
import { db, type AiLesson, type Topic } from '@/lib/ai/db';

/** Lists the learner's own topics (from IndexedDB) for a unit, or for "My topics" when unit is "". */
export default function CustomTopics({ unit, showEmpty = false, all = false }: { unit?: string; showEmpty?: boolean; all?: boolean }) {
  const [data, setData] = useState<{ topics: Topic[]; lessons: Record<string, AiLesson> } | null>(null);
  useEffect(() => {
    let live = true;
    const load = async () => {
      const d = db();
      const topics = all ? await d.topics.orderBy('createdAt').toArray() : await d.topics.where('unit').equals(unit ?? '').sortBy('createdAt');
      const ls = await d.lessons.bulkGet(topics.flatMap((t) => t.lessonIds));
      if (live) setData({ topics, lessons: Object.fromEntries(ls.filter(Boolean).map((l) => [l!.id, l!])) });
    };
    load();
    const t = setInterval(load, 4000);
    return () => { live = false; clearInterval(t); };
  }, [unit, all]);
  if (!data || (!data.topics.length && !showEmpty)) return null;
  return (
    <div className="space-y-4">
      {data.topics.map((t) => {
        const u = unitBySlug(t.unit);
        return (
          <div key={t.id} className="custom-mark rounded-2xl border border-line bg-card" style={u ? { ['--hue' as string]: u.hue } : undefined}>
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-line px-4 py-3">
              <div className="min-w-0"><span className="chip chip-accent mr-2 !h-6 !text-[11.5px]">Your topic</span><span className="font-semibold">{t.root}</span></div>
              <span className="text-[12.5px] text-muted">{all ? (u ? `Unit ${u.roman}` : 'My topics') : ''}{t.anchorTitle ? ` · from ${t.anchorTitle}` : ''}</span>
            </div>
            <ol className="divide-y divide-[var(--line)]">
              {t.lessonIds.map((id) => {
                const l = data.lessons[id];
                if (!l) return null;
                return (
                  <li key={id}>
                    <Link href={`/study/?id=${id}`} className="flex items-start gap-3 px-4 py-3.5 hover:bg-[var(--accent-tint)]">
                      <span className="w-12 shrink-0 pt-0.5 font-mono text-[12px] text-muted">{l.number}</span>
                      <span className="min-w-0 flex-1"><span className="block text-[15.5px] leading-snug">{l.title}</span><span className="mt-1 block text-[12.5px] text-muted">{l.status === 'complete' ? `AI-written${l.reviewed ? ' · reviewed' : ''}${l.meta?.publishedAt ? ' · published' : ''}` : l.status === 'draft' ? 'Draft · resume' : 'Generate'}</span></span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </div>
        );
      })}
    </div>
  );
}

