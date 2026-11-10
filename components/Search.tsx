'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { UNITS, allLessons, lessonHref } from '@/lib/curriculum';
import { IconClose, IconSearch } from './Icons';

type Item = { title: string; number: string; unitRoman: string; unitTitle: string; hue: number; href: string | null };

const ITEMS: Item[] = UNITS.flatMap((u) => [
  { title: u.title, number: `Unit ${u.roman}`, unitRoman: u.roman, unitTitle: u.short, hue: u.hue, href: `/course/${u.slug}/` },
  ...allLessons(u).map((l) => ({ title: l.title, number: l.number, unitRoman: u.roman, unitTitle: u.short, hue: u.hue, href: l.written ? lessonHref(u, l) : `/study/?id=${l.id}` })),
]).concat([{ title: 'Unit I practice set', number: 'Practice', unitRoman: 'I', unitTitle: 'Devices', hue: 35, href: '/practice/unit-1/' }]);

function score(item: Item, terms: string[]) {
  const hay = `${item.number} ${item.title} ${item.unitTitle}`.toLowerCase();
  let s = 0;
  for (const t of terms) {
    const i = hay.indexOf(t);
    if (i < 0) return -1;
    s += i === 0 ? 3 : hay[i - 1] === ' ' ? 2 : 1;
  }
  return s + (item.href ? 1 : 0);
}

export function openSearch() { window.dispatchEvent(new Event('esc-open-search')); }

export default function Search() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setOpen((o) => !o); }
      else if (e.key === '/' && !open && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) { e.preventDefault(); setOpen(true); }
      else if (e.key === 'Escape') setOpen(false);
    };
    const onOpen = () => setOpen(true);
    window.addEventListener('keydown', onKey);
    window.addEventListener('esc-open-search', onOpen);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('esc-open-search', onOpen); };
  }, [open]);

  useEffect(() => {
    if (open) { setQ(''); setActive(0); setTimeout(() => inputRef.current?.focus(), 30); document.body.style.overflow = 'hidden'; }
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  const results = useMemo(() => {
    const terms = q.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if (!terms.length) return ITEMS.filter((i) => i.href).slice(0, 12);
    return ITEMS.map((i) => ({ i, s: score(i, terms) })).filter((x) => x.s >= 0).sort((a, b) => b.s - a.s).slice(0, 30).map((x) => x.i);
  }, [q]);

  if (!open) return null;
  const go = (it: Item) => { if (it.href) { setOpen(false); router.push(it.href); } };

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="Search lessons">
      <div className="sheet-backdrop" onClick={() => setOpen(false)} />
      <div className="absolute inset-x-0 top-0 z-[81] mx-auto flex max-h-[100dvh] w-full max-w-xl flex-col bg-card shadow-2xl sm:top-[10vh] sm:max-h-[70vh] sm:rounded-2xl sm:border sm:border-line" style={{ paddingTop: 'var(--safe-t)' }}>
        <div className="flex items-center gap-2 border-b border-line px-3">
          <IconSearch className="ml-1 shrink-0 text-muted" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => { setQ(e.target.value); setActive(0); }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
              if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
              if (e.key === 'Enter' && results[active]) go(results[active]);
            }}
            placeholder="Search lessons: junction, Fermi, MOSFET…"
            className="h-14 min-w-0 flex-1 bg-transparent text-[17px] outline-none placeholder:text-muted"
            aria-label="Search lessons"
          />
          <button onClick={() => setOpen(false)} className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-muted" aria-label="Close search"><IconClose /></button>
        </div>
        <ul className="no-scrollbar min-h-0 flex-1 overflow-y-auto p-2" role="listbox">
          {results.length === 0 && <li className="px-3 py-8 text-center text-muted">No lesson matches “{q}”.</li>}
          {results.map((it, idx) => {
            const inner = (
              <div className="flex items-start gap-3">
                <span className="mt-0.5 w-12 shrink-0 font-mono text-xs text-muted">{it.number}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] leading-snug">{it.title}</span>
                  <span className="mt-0.5 block text-xs text-muted">Unit {it.unitRoman} · {it.unitTitle}{it.href?.startsWith('/study') ? ' · Generate with AI' : ''}</span>
                </span>
              </div>
            );
            return (
              <li key={it.number + it.title} role="option" aria-selected={idx === active} aria-disabled={!it.href}>
                {it.href ? (
                  <Link href={it.href} onClick={() => setOpen(false)} onMouseEnter={() => setActive(idx)} className={`block rounded-xl px-3 py-3 ${idx === active ? 'bg-[var(--accent-tint)]' : ''}`} style={{ ['--hue' as string]: it.hue }}>{inner}</Link>
                ) : (
                  <div className="cursor-not-allowed rounded-xl px-3 py-3 opacity-55">{inner}</div>
                )}
              </li>
            );
          })}
        </ul>
        <div className="hidden border-t border-line px-4 py-2 text-xs text-muted sm:block">↑ ↓ to move · Enter to open · Esc to close</div>
      </div>
    </div>
  );
}
