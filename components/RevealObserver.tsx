'use client';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/** Fades content blocks up as they scroll in. Staggers siblings 80/160/240 ms. */
export default function RevealObserver() {
  const path = usePathname();
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('.reveal:not(.in)'));
    if (!('IntersectionObserver' in window)) { els.forEach((e) => e.classList.add('in')); return; }
    const io = new IntersectionObserver((entries) => {
      let i = 0;
      for (const en of entries) {
        if (en.isIntersecting) {
          const el = en.target as HTMLElement;
          if (!el.style.getPropertyValue('--reveal-delay')) el.style.setProperty('--reveal-delay', `${Math.min(i, 3) * 80}ms`);
          el.classList.add('in');
          io.unobserve(el);
          i++;
        }
      }
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.01 });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [path]);
  return null;
}
