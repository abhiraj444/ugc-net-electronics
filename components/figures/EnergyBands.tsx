'use client';
import { useMemo, useState } from 'react';
import { MATERIALS } from '@/lib/physics';
import { FigureFrame } from '../lesson/Blocks';
import { Caption, Readouts, Slider, useBeacon, useWidth } from '../ui/controls';
import { Axes, linear, path } from '../ui/plot';

type Mat = keyof typeof MATERIALS;
const DELTA = 6; // eV, separation of the two atomic levels (order of the Si 3s–3p spacing)
const LAMBDA = 0.08; // nm, decay length of the overlap
const D_MIN = 0.18, D_MAX = 0.6;
const NS = [2, 4, 8, 32] as const;

/**
 * Toy tight-binding chain: N atoms, two atomic levels (lower at 0 eV, upper at 6 eV).
 * Each level splits into N levels E = E0 ± 2t(d) cos(jπ/(N+1)), with overlap t(d) = t0 exp(-(d - d0)/λ).
 * t0 is calibrated so that, for N → ∞, the gap at the material's bond length d0 equals its real band gap.
 */
function model(mat: Mat) {
  const M = MATERIALS[mat];
  const t0 = (DELTA - M.Eg) / 4;
  const t = (d: number) => t0 * Math.exp(-(d - M.bond) / LAMBDA);
  return { M, t };
}

export default function EnergyBands() {
  const [mat, setMat] = useState<Mat>('Si');
  const [d, setD] = useState(0.5);
  const [N, setN] = useState<(typeof NS)[number]>(8);
  const { beacon, touched } = useBeacon();
  const { M, t } = useMemo(() => model(mat), [mat]);
  const { ref, w } = useWidth<HTMLDivElement>();
  const h = 300;
  const m = { l: 40, r: 14, t: 16, b: 34 };
  const x = linear([D_MAX, D_MIN], [m.l, w - m.r]); // atoms get closer to the right
  const y = linear([-6, 12], [h - m.b, m.t]);
  const cosj = (j: number) => Math.cos((j * Math.PI) / (N + 1));

  const curves = useMemo(() => {
    const ds = Array.from({ length: 120 }, (_, i) => D_MAX - ((D_MAX - D_MIN) * i) / 119);
    const out: { d: string; band: 0 | 1 }[] = [];
    for (let j = 1; j <= N; j++) {
      out.push({ band: 0, d: path(ds.map((dd) => [x(dd), y(0 + 2 * t(dd) * cosj(j))])) });
      out.push({ band: 1, d: path(ds.map((dd) => [x(dd), y(DELTA - 2 * t(dd) * cosj(j))])) });
    }
    return out;
  }, [N, t, w]); // eslint-disable-line react-hooks/exhaustive-deps

  const tn = t(d);
  const c1 = cosj(1);
  const lowTop = 2 * tn * c1, upBot = DELTA - 2 * tn * c1;
  const gap = upBot - lowTop;
  const width = 4 * tn * c1;

  // atom row illustration
  const rowW = w - 32;
  const shown = Math.min(N, 8);
  const spacingPx = Math.min((rowW - 20) / Math.max(shown - 1, 1), 18 + (d / D_MAX) * 60);

  return (
    <FigureFrame label="Figure 1.2" title="A choir that splits one note into many">
      <div ref={ref} className="px-2 pt-2">
        <svg viewBox={`0 0 ${w} 64`} width="100%" height={64} role="img" aria-label={`${N} atoms spaced ${d.toFixed(2)} nanometres apart`}>
          {Array.from({ length: shown }, (_, i) => {
            const cx = w / 2 + (i - (shown - 1) / 2) * spacingPx;
            const r = 12;
            return (
              <g key={i}>
                <circle cx={cx} cy={30} r={r + Math.max(0, 22 - spacingPx / 2) * 0.0} fill="var(--accent-tint)" stroke="var(--accent)" strokeWidth={1} />
                <circle cx={cx} cy={30} r={3} fill="var(--ink)" />
              </g>
            );
          })}
          {N > shown && <text x={w - 12} y={34} textAnchor="end" className="plot-label">… {N} atoms</text>}
          <text x={8} y={58} className="plot-label">spacing {d.toFixed(3)} nm{Math.abs(d - M.bond) < 0.006 ? ` · real ${M.name.toLowerCase()} bond` : ''}</text>
        </svg>
        <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} role="img" aria-label="Energy levels versus atomic spacing">
          <Axes x={x} y={y} xTicks={[0.6, 0.5, 0.4, 0.3, 0.2]} yTicks={[-6, -3, 0, 3, 6, 9, 12]} xLabel="atomic spacing d (nm) → closer" yLabel="E (eV)" grid={false} />
          {gap > 0 && <rect x={x(d) - 9} y={y(upBot)} width={18} height={Math.max(0, y(lowTop) - y(upBot))} rx={3} fill="var(--accent-soft)" />}
          {curves.map((c, i) => <path key={i} d={c.d} fill="none" stroke={c.band ? 'var(--accent-deep)' : 'var(--ink)'} strokeWidth={N > 8 ? 0.7 : 1.2} opacity={0.85} />)}
          <line x1={x(M.bond)} x2={x(M.bond)} y1={y(12)} y2={y(-6)} stroke="var(--muted)" strokeDasharray="3 4" />
          <text x={x(M.bond) - 5} y={y(11.2)} textAnchor="end" className="plot-label">{mat} bond {M.bond} nm</text>
          <line x1={x(d)} x2={x(d)} y1={y(12)} y2={y(-6)} stroke="var(--accent)" strokeWidth={2} />
          <circle cx={x(d)} cy={y(-6)} r={5} fill="var(--accent)" />
          {gap > 0.05 && (
            <text x={x(d) < w - 90 ? x(d) + 13 : x(d) - 13} textAnchor={x(d) < w - 90 ? 'start' : 'end'} y={(y(upBot) + y(lowTop)) / 2 + 4} className="plot-label tnum" style={{ fill: 'var(--accent-deep)', fontWeight: 600 }}>gap {gap.toFixed(2)} eV</text>
          )}
          <text x={m.l + 4} y={y(0) - 5} className="plot-label">lower level → valence band</text>
          <text x={m.l + 4} y={y(DELTA) - 5} className="plot-label" style={{ fill: 'var(--accent-deep)' }}>upper level → conduction band</text>
        </svg>
      </div>
      <div className="grid gap-x-6 gap-y-2 border-t border-line px-4 py-3 sm:grid-cols-2">
        <Slider label="Atomic spacing d" value={d} min={D_MIN} max={D_MAX} step={0.001} onChange={(v) => { setD(v); touched(); }} display={`${d.toFixed(3)} nm`} beacon={beacon} />
        <div>
          <div className="mb-1.5 text-[13.5px] text-muted">Number of atoms N</div>
          <div className="flex gap-1.5" role="group" aria-label="Number of atoms">
            {NS.map((n) => <button key={n} className="btn btn-sm flex-1" aria-pressed={N === n} onClick={() => { setN(n); touched(); }}>{n}</button>)}
          </div>
        </div>
      </div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto border-t border-line px-4 py-3">
        <span className="shrink-0 self-center text-[12.5px] text-muted">Crystal</span>
        {(Object.keys(MATERIALS) as Mat[]).map((k) => (
          <button key={k} className="btn btn-sm shrink-0" aria-pressed={mat === k} onClick={() => { setMat(k); setD(MATERIALS[k].bond); touched(); }}>{k} · {MATERIALS[k].Eg} eV</button>
        ))}
      </div>
      <Readouts items={[
        { k: 'Levels per band', v: `${N}` },
        { k: 'Each band is', v: `${width.toFixed(2)} eV wide` },
        { k: 'Gap between bands', v: gap > 0 ? `${gap.toFixed(2)} eV` : 'none (overlap)' },
        { k: 'Electrons it holds', v: `${2 * N}` },
      ]} />
      <Caption>
        {d > 0.45 ? 'Far apart, each atom keeps its own sharp level: N copies of the same note.' : gap > 0 ? `Closer, the overlap splits each level into ${N} and the levels spread into bands. With N = 32 they already look continuous; a real crystal has about 10²² atoms per cm³, where the gap here would be ${(DELTA - 4 * tn).toFixed(2)} eV.` : 'Squeezed this close, the toy bands overlap and the gap vanishes, as in a metal.'}
      </Caption>
    </FigureFrame>
  );
}
