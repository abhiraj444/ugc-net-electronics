'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';
import { IconSearch } from './Icons';
import { openSearch } from './Search';

const NAV = [
  { href: '/course/', label: 'Course' },
  { href: '/practice/unit-1/', label: 'Practice' },
  { href: '/progress/', label: 'Progress' },
  { href: '/settings/', label: 'Settings' },
];

export default function TopBar() {
  const path = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-[color-mix(in_oklab,var(--ground)_88%,transparent)] backdrop-blur-md" style={{ paddingTop: 'var(--safe-t)' }}>
      <div className="mx-auto flex h-[52px] max-w-[1280px] items-center gap-1 px-3 sm:px-5">
        <Link href="/" className="mr-auto flex min-w-0 items-center gap-2.5 rounded-lg py-2 pr-2" aria-label="Beyond Memorising, home">
          <Logo />
          <span className="truncate text-[15px] font-semibold tracking-tight">Beyond Memorising<span className="hidden font-normal text-muted sm:inline"> · Electronic Science</span></span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={`rounded-lg px-3 py-2 text-[14px] ${path.startsWith(n.href.replace(/unit-1\/$/, '')) ? 'font-semibold text-ink' : 'text-muted hover:text-ink'}`}>{n.label}</Link>
          ))}
        </nav>
        <button onClick={openSearch} className="ml-1 flex h-11 items-center gap-2 rounded-xl px-3 text-muted hover:bg-[var(--accent-tint)] hover:text-ink md:border md:border-line md:bg-card" aria-label="Search lessons (Ctrl K)">
          <IconSearch size={19} />
          <span className="hidden text-sm md:inline">Search</span>
          <kbd className="hidden rounded border border-line px-1.5 text-[11px] lg:inline">⌘K</kbd>
        </button>
        <ThemeToggle />
      </div>
    </header>
  );
}

export function Logo() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden className="shrink-0">
      <rect x="1" y="1" width="24" height="24" rx="7" fill="var(--ink)" />
      <path d="M6 15.5c2.2 0 2.6-5 4.8-5s2.6 5 4.4 5 2.6-5 4.8-5" fill="none" stroke="var(--ground)" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="19.8" cy="10.5" r="1.9" fill="oklch(0.7 0.13 35)" />
    </svg>
  );
}
