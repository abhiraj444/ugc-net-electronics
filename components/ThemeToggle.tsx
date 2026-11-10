'use client';
import { useEffect, useState } from 'react';
import { IconMoon, IconSun } from './Icons';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark' | null>(null);
  useEffect(() => {
    setTheme((document.documentElement.dataset.theme as 'light' | 'dark') || 'light');
  }, []);
  const flip = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('esc-theme', next); } catch {}
    setTheme(next);
  };
  return (
    <button onClick={flip} className="grid h-11 w-11 place-items-center rounded-xl text-ink hover:bg-[var(--accent-tint)]" aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
      {theme === 'dark' ? <IconSun /> : <IconMoon />}
    </button>
  );
}
