'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/', label: 'Home', match: (p: string) => p === '/' },
  { href: '/course/', label: 'Course', match: (p: string) => p.startsWith('/course') },
  { href: '/practice/unit-1/', label: 'Practice', match: (p: string) => p.startsWith('/practice') },
  { href: '/progress/', label: 'Progress', match: (p: string) => p.startsWith('/progress') },
];

/** Thumb-reachable navigation on phones. Lesson pages show their own lesson bar instead. */
export default function MobileTabBar() {
  const path = usePathname();
  const isLesson = /^\/course\/unit-\d+\/[^/]+\/?$/.test(path);
  if (isLesson) return null;
  return (
    <>
      <div className="h-[64px] md:hidden" aria-hidden />
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-[color-mix(in_oklab,var(--card)_92%,transparent)] backdrop-blur-md md:hidden" style={{ paddingBottom: 'var(--safe-b)' }} aria-label="Main">
        <div className="grid h-[58px] grid-cols-4">
          {TABS.map((t) => {
            const on = t.match(path);
            return (
              <Link key={t.href} href={t.href} className={`flex flex-col items-center justify-center gap-1 text-[12px] ${on ? 'font-semibold text-ink' : 'text-muted'}`} aria-current={on ? 'page' : undefined}>
                <span className={`h-1 w-5 rounded-full ${on ? 'bg-[var(--ink)]' : 'bg-transparent'}`} />
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
