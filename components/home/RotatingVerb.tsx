'use client';
import { useEffect, useState } from 'react';

const PHRASES = [
  { v: 'See', o: 'a junction form' },
  { v: 'Drag', o: 'the Fermi level' },
  { v: 'Solve', o: 'a NET numerical' },
  { v: 'Build', o: 'a band diagram' },
  { v: 'Tune', o: 'a diode’s current' },
  { v: 'Watch', o: 'silicon wake up' },
];

export default function RotatingVerb() {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setI((x) => (x + 1) % PHRASES.length), 2600);
    return () => clearInterval(t);
  }, []);
  const p = PHRASES[i];
  return (
    <span className="block min-h-[2.3em] sm:min-h-[1.15em]" aria-live="off">
      <span key={i} className="rot-word">
        <span className="text-[var(--accent-deep)]">{p.v}</span> {p.o}.
      </span>
    </span>
  );
}
