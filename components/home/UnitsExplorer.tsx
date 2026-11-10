'use client';
import Link from 'next/link';
import { useState } from 'react';
import { UNITS, allLessons, lessonHref } from '@/lib/curriculum';
import { Milestone } from '../course/Milestone';
import { IconArrow } from '../Icons';

export default function UnitsExplorer() {
  const [sel, setSel] = useState(0);
  const u = UNITS[sel];
  const ls = allLessons(u);
  const live = ls.filter((l) => l.written);
  const preview = ls.slice(0, 6);
  return (
    <div style={{ ['--hue' as string]: u.hue }}>
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="tablist" aria-label="Units">
        {UNITS.map((x, i) => (
          <button
            key={x.slug}
            role="tab"
            aria-selected={i === sel}
            aria-controls="unit-panel"
            onClick={() => setSel(i)}
            className={`flex h-11 shrink-0 items-center gap-2 rounded-xl border px-3.5 text-[14px] transition-colors ${i === sel ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--ground)]' : 'border-line bg-card text-ink hover:border-[var(--line-strong)]'}`}
            style={{ ['--hue' as string]: x.hue }}
          >
            <span className="h-2 w-2 rounded-full bg-[var(--accent)]" aria-hidden />
            <span className="font-mono text-[12.5px]">{x.roman}</span>
            <span className="hidden sm:inline">{x.short}</span>
          </button>
        ))}
      </div>
      <div id="unit-panel" role="tabpanel" className="card mt-4 grid gap-6 p-5 sm:p-7 md:grid-cols-[1.1fr_1fr]">
        <div>
          <div className="eyebrow">Unit {u.roman} · {ls.length} lessons{live.length ? ` · ${live.length} live` : ' · coming soon'}</div>
          <h3 className="mt-2 text-[22px] font-semibold leading-snug tracking-tight">{u.title}</h3>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">{u.scope}</p>
          <div className="mt-4 flex flex-wrap gap-2">{u.parts.map((p) => <Milestone key={p.milestone} name={p.milestone} hue={u.hue} size="sm" />)}</div>
          <div className="eyebrow mt-6">What you build</div>
          <ul className="mt-2 space-y-1.5 text-[15px]">
            {u.builds.map((b) => <li key={b} className="flex gap-2.5"><span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]" />{b}</li>)}
          </ul>
        </div>
        <div>
          <div className="eyebrow">Inside</div>
          <ol className="mt-2 divide-y divide-[var(--line)]">
            {preview.map((l) => (
              <li key={l.id} className="flex items-start gap-3 py-2.5">
                <span className="w-9 shrink-0 pt-0.5 font-mono text-[12px] text-muted">{l.number}</span>
                {l.written ? (
                  <Link href={lessonHref(u, l)} className="min-w-0 flex-1 text-[14.5px] font-medium leading-snug hover:text-[var(--accent-deep)]">{l.title}</Link>
                ) : (
                  <span className="min-w-0 flex-1 text-[14.5px] leading-snug text-muted">{l.title}</span>
                )}
              </li>
            ))}
          </ol>
          <Link href={`/course/${u.slug}/`} className="mt-3 inline-flex min-h-[44px] items-center gap-1.5 text-[14.5px] font-semibold text-[var(--accent-deep)]">See all {ls.length} lessons <IconArrow size={16} /></Link>
        </div>
      </div>
    </div>
  );
}
