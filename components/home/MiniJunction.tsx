'use client';
import { useState } from 'react';
import { pnJunction, sci, sup } from '@/lib/physics';
import { Slider, useWidth } from '../ui/controls';

/** A small live tile: drag the n-side doping, see the depletion region and V_bi change. Real numbers from lib/physics. */
export default function MiniJunction() {
  const [ld, setLd] = useState(15);
  const NA = 1e17, ND = Math.pow(10, ld);
  const j = pnJunction(NA, ND, 300);
  const { ref, w } = useWidth<HTMLDivElement>(300);
  const h = 96;
  const L = 1.4; // µm half-window
  const X = (um: number) => w / 2 + (um / L) * (w / 2 - 8);
  const xp = j.xp * 1e4, xn = j.xn * 1e4;
  return (
    <div>
      <div ref={ref}>
        <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} role="img" aria-label={`Depletion region ${(j.W * 1e4).toFixed(2)} micrometres wide`}>
          <rect x={8} y={14} width={w / 2 - 8} height={60} rx={8} fill="var(--hole)" fillOpacity={0.07} stroke="var(--line-strong)" />
          <rect x={w / 2} y={14} width={w / 2 - 8} height={60} rx={8} fill="var(--electron)" fillOpacity={0.07} stroke="var(--line-strong)" />
          <rect x={X(-Math.min(xp, L))} y={14} width={X(Math.min(xn, L)) - X(-Math.min(xp, L))} height={60} fill="var(--muted)" fillOpacity={0.18} style={{ transition: 'all .3s ease-out' }} />
          <text x={14} y={88} className="plot-label">p · 10¹⁷</text>
          <text x={w - 14} y={88} textAnchor="end" className="plot-label">n · {sci(ND, 1)}</text>
          <text x={X((xn - xp) / 2)} y={50} textAnchor="middle" className="plot-label" style={{ fill: 'var(--ink)', fontWeight: 600 }}>W</text>
        </svg>
      </div>
      <Slider label={<>Donors N<sub>D</sub></>} value={ld} min={14.5} max={17} step={0.1} onChange={setLd} display={`${sci(ND, 1)} cm${sup(-3)}`} />
      <div className="mt-1 grid grid-cols-2 gap-2 text-[13px]">
        <div className="rounded-lg bg-[var(--accent-tint)] px-3 py-2"><span className="block text-muted">V<sub>bi</sub></span><b className="tnum text-[15px]">{j.Vbi.toFixed(3)} V</b></div>
        <div className="rounded-lg bg-[var(--accent-tint)] px-3 py-2"><span className="block text-muted">Width W</span><b className="tnum text-[15px]">{(j.W * 1e4).toFixed(2)} µm</b></div>
      </div>
    </div>
  );
}
