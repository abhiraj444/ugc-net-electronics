'use client';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/** Fades content blocks up as they scroll in. Staggers siblings 80/160/240 ms.
 *  Also watches for blocks added later (AI lessons stream in after the page loads). */
export default function RevealObserver() {
  const path = usePathname();
  useEffect(() => {
    const scan = () => Array.from(document.querySelectorAll<HTMLElement>('.reveal:not(.in):not([data-rv])'));
    if (!('IntersectionObserver' in window)) {
      const all = () => scan().forEach((e) => e.classList.add('in'));
      all();
      const mo = new MutationObserver(all);
      mo.observe(document.body, { childList: true, subtree: true });
      return () => mo.disconnect();
    }
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
    const observe = () => scan().forEach((e) => { e.dataset.rv = '1'; io.observe(e); });
    observe();
    let raf = 0;
    const mo = new MutationObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(observe); });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); cancelAnimationFrame(raf); document.querySelectorAll<HTMLElement>('[data-rv]').forEach((e) => delete e.dataset.rv); };
  }, [path]);
  return null;
}
