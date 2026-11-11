'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ICONS: Record<string, React.ReactNode> = {
  Home: <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />,
  Course: <><path d="M4 5a2 2 0 0 1 2-2h13v15H6a2 2 0 0 0-2 2z" /><path d="M4 20a2 2 0 0 0 2 1h13v-3" /><path d="M9 7h6" /></>,
  Practice: <><circle cx="12" cy="12" r="9" /><path d="m8.5 12.5 2.5 2.5 4.5-5" /></>,
  Progress: <><path d="M4 20V10" /><path d="M10 20V4" /><path d="M16 20v-7" /><path d="M21 20H3" /></>,
  Settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></>,
};

const TABS = [
  { href: '/', label: 'Home', match: (p: string) => p === '/' },
  { href: '/course/', label: 'Course', match: (p: string) => p.startsWith('/course') },
  { href: '/practice/unit-1/', label: 'Practice', match: (p: string) => p.startsWith('/practice') },
  { href: '/progress/', label: 'Progress', match: (p: string) => p.startsWith('/progress') },
  { href: '/settings/', label: 'Settings', match: (p: string) => p.startsWith('/settings') },
];

/** Thumb-reachable navigation on phones. Lesson pages show their own lesson bar instead. */
export default function MobileTabBar() {
  const path = usePathname();
  const isLesson = /^\/course\/unit-\d+\/[^/]+\/?$/.test(path) || path.startsWith('/study') || path.startsWith('/golden');
  if (isLesson) return null;
  return (
    <>
      <div className="h-[64px] md:hidden" aria-hidden />
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-[color-mix(in_oklab,var(--card)_92%,transparent)] backdrop-blur-md md:hidden" style={{ paddingBottom: 'var(--safe-b)' }} aria-label="Main">
        <div className="grid h-[58px] grid-cols-5">
          {TABS.map((t) => {
            const on = t.match(path);
            return (
              <Link key={t.href} href={t.href} className={`relative flex flex-col items-center justify-center gap-0.5 text-[11px] ${on ? 'font-semibold text-ink' : 'text-muted'}`} aria-current={on ? 'page' : undefined}>
                <span className={`absolute top-0 h-[3px] w-8 rounded-b-full ${on ? 'bg-[var(--accent,var(--ink))]' : 'bg-transparent'}`} />
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth={on ? 2.1 : 1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden>{ICONS[t.label]}</svg>
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
