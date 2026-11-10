'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { allLessons, lessonHref, unitBySlug } from '@/lib/curriculum';
import { useProgress } from '@/lib/progress';
import { IconBack, IconCheck, IconClose, IconArrow, IconList } from '../Icons';

function LessonList({ unitSlug, current, onPick }: { unitSlug: string; current: string; onPick?: () => void }) {
  const unit = unitBySlug(unitSlug)!;
  const prog = useProgress();
  return (
    <div className="space-y-6">
      {unit.parts.map((part) => (
        <div key={part.title}>
          {unit.parts.length > 1 && <div className="eyebrow mb-2 px-2">{part.title}</div>}
          <ol className="space-y-0.5">
            {part.lessons.map((l) => {
              const on = l.id === current;
              const done = !!prog.done[l.id];
              const inner = (
                <>
                  <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[10px] ${done ? 'border-[var(--accent-deep)] bg-[var(--accent-deep)] text-[var(--card)]' : 'border-line'}`}>
                    {done ? <IconCheck size={13} /> : null}
                  </span>
                  <span className="w-9 shrink-0 font-mono text-[11.5px] text-muted">{l.number}</span>
                  <span className="min-w-0 flex-1 text-[14.5px] leading-snug">{l.title}</span>
                </>
              );
              return (
                <li key={l.id}>
                  {l.written ? (
                    <Link href={lessonHref(unit, l)} onClick={onPick} aria-current={on ? 'page' : undefined} className={`flex min-h-[44px] items-start gap-2 rounded-xl px-2 py-2.5 ${on ? 'bg-[var(--accent-tint)] font-semibold' : 'hover:bg-[var(--accent-tint)]'}`}>{inner}</Link>
                  ) : (
                    <Link href={`/study/?id=${l.id}`} onClick={onPick} aria-current={on ? 'page' : undefined} className={`flex min-h-[44px] items-start gap-2 rounded-xl px-2 py-2.5 ${on ? 'bg-[var(--accent-tint)] font-semibold' : 'text-muted hover:bg-[var(--accent-tint)]'}`}>{inner}<span className="mt-0.5 shrink-0 text-[10.5px] text-muted">Generate</span></Link>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      ))}
    </div>
  );
}

export function LessonSidebar({ unitSlug, current }: { unitSlug: string; current: string }) {
  const unit = unitBySlug(unitSlug)!;
  return (
    <aside className="sticky top-[76px] hidden max-h-[calc(100dvh-96px)] w-[300px] shrink-0 overflow-y-auto pb-10 pr-2 lg:block" aria-label="Lessons in this unit">
      <Link href={`/course/${unit.slug}/`} className="mb-4 block rounded-xl px-2 py-1">
        <div className="eyebrow">Unit {unit.roman}</div>
        <div className="mt-0.5 font-semibold leading-snug">{unit.title}</div>
      </Link>
      <LessonList unitSlug={unitSlug} current={current} />
      <Link href={`/practice/${unit.slug}/`} className="mt-5 flex min-h-[44px] items-center gap-2 rounded-xl border border-line bg-card px-3 text-[14px] font-medium">Unit {unit.roman} practice set <IconArrow size={16} className="ml-auto" /></Link>
    </aside>
  );
}

export function LessonBottomBar({ unitSlug, current }: { unitSlug: string; current: string }) {
  const unit = unitBySlug(unitSlug)!;
  const ls = allLessons(unit);
  const i = ls.findIndex((l) => l.id === current);
  const prev = ls[i - 1];
  const next = ls[i + 1];
  const [open, setOpen] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    setTimeout(() => sheetRef.current?.querySelector<HTMLElement>('[aria-current="page"]')?.scrollIntoView({ block: 'center' }), 50);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [open]);
  const navBtn = 'flex h-11 min-w-0 items-center gap-1.5 rounded-xl px-3 text-[14px] font-medium';
  return (
    <>
      <div className="h-[72px] lg:hidden" aria-hidden />
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-[color-mix(in_oklab,var(--card)_92%,transparent)] backdrop-blur-md lg:hidden" style={{ paddingBottom: 'var(--safe-b)' }} aria-label="Lesson navigation">
        <div className="mx-auto flex h-[60px] max-w-[720px] items-center justify-between gap-1 px-2">
          {prev ? (
            <Link href={prev.written ? lessonHref(unit, prev) : `/study/?id=${prev.id}`} className={`${navBtn} text-muted`} aria-label={`Previous: ${prev.number} ${prev.title}`}><IconBack size={18} /> {prev.number}</Link>
          ) : <span className="w-[72px]" />}
          <button onClick={() => setOpen(true)} className="flex h-11 items-center gap-2 rounded-xl border border-line bg-card px-4 text-[14px] font-semibold" aria-haspopup="dialog">
            <IconList size={18} /> Lesson {ls[i]?.number} <span className="font-normal text-muted">of {ls.length}</span>
          </button>
          {next ? (
            <Link href={next.written ? lessonHref(unit, next) : `/study/?id=${next.id}`} className={`${navBtn} text-ink`} aria-label={`Next: ${next.number} ${next.title}`}>{next.number} <IconArrow size={18} /></Link>
          ) : <Link href={`/practice/${unit.slug}/`} className={`${navBtn} text-ink`}>Practice <IconArrow size={18} /></Link>}
        </div>
      </nav>
      {open && (
        <div role="dialog" aria-modal="true" aria-label="Lessons in this unit" className="lg:hidden">
          <div className="sheet-backdrop" onClick={() => setOpen(false)} />
          <div className="sheet" ref={sheetRef}>
            <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-[var(--line-strong)]" aria-hidden />
            <div className="flex items-center justify-between px-4 pb-2 pt-3">
              <div className="min-w-0">
                <div className="eyebrow">Unit {unit.roman} · {unit.milestone}</div>
                <div className="truncate font-semibold">{unit.title}</div>
              </div>
              <button onClick={() => setOpen(false)} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl" aria-label="Close"><IconClose /></button>
            </div>
            <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-2 pb-4">
              <LessonList unitSlug={unitSlug} current={current} onPick={() => setOpen(false)} />
              <Link href={`/practice/${unit.slug}/`} onClick={() => setOpen(false)} className="mx-2 mt-4 flex min-h-[48px] items-center gap-2 rounded-xl border border-line px-3 text-[14.5px] font-medium">Unit {unit.roman} practice set <IconArrow size={16} className="ml-auto" /></Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
