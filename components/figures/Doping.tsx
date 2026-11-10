'use client';
import { useMemo, useState } from 'react';
import { SI, carriers, kT_eV, niAt, sci, sup } from '@/lib/physics';
import { FigureFrame } from '../lesson/Blocks';
import { Caption, Readouts, Slider, rng, useBeacon, useWidth } from '../ui/controls';
import { linear } from '../ui/plot';

const COLS = 8, ROWS = 4;

/** Slider s in [-5, 5]: s > 0 donors 10^(13+s), s < 0 acceptors 10^(13−s), |s| < 0.05 intrinsic. */
function dopingOf(s: number) {
  if (Math.abs(s) < 0.05) return { ND: 0, NA: 0 };
  const N = Math.pow(10, 13 + Math.abs(s));
  return s > 0 ? { ND: N, NA: 0 } : { ND: 0, NA: N };
}

export default function Doping() {
  const [s, setS] = useState(3);
  const [T, setT] = useState(300);
  const [ni300, setNi300] = useState(SI.ni300);
  const { beacon, touched } = useBeacon();
  const { ref, w } = useWidth<HTMLDivElement>();
  const { ND, NA } = dopingOf(s);
  const ni = niAt(T, ni300);
  const { n, p } = carriers(ND - NA, ni);
  const kT = kT_eV(T);
  const EFminusEi = kT * Math.log(n / ni); // eV
  const Eg = SI.Eg;

  // which lattice sites hold dopants: more sites as log doping grows (illustrative)
  const sites = useMemo(() => {
    const r = rng(3);
    const all = Array.from({ length: COLS * ROWS }, (_, i) => ({ i, k: r() }));
    return all.sort((a, b) => a.k - b.k).map((a) => a.i);
  }, []);
  const nDop = Math.abs(s) < 0.05 ? 0 : Math.round(1 + Math.abs(s) * 1.2);
  const dopSet = new Set(sites.slice(0, nDop));
  const isN = s > 0;

  const latW = Math.min(w * 0.46, 260);
  const bandX0 = w >= 560 ? latW + 28 : 12;
  const stacked = w < 560;
  const latH = 150;
  const bh = 200;
  const by = linear([-0.15, Eg + 0.15], [bh - 18, 18]);
  const EiY = Eg / 2;
  const EF = EiY + EFminusEi;
  const bw = (stacked ? w - 24 : w - bandX0 - 12);
  const sx = (latW - 30) / (COLS - 1), sy = (latH - 34) / (ROWS - 1);
  const logBar = linear([0, 20], [0, bw - 70]);

  const lattice = (
    <svg viewBox={`0 0 ${latW} ${latH}`} width={latW} height={latH} role="img" aria-label={`Lattice with ${nDop} ${isN ? 'phosphorus donor' : 'boron acceptor'} atoms drawn`} className="shrink-0">
      {Array.from({ length: COLS * ROWS }, (_, i) => {
        const c = i % COLS, r = Math.floor(i / COLS);
        const cx = 15 + c * sx, cy = 14 + r * sy;
        const dop = dopSet.has(i);
        return (
          <g key={i}>
            {c < COLS - 1 && <line x1={cx} x2={cx + sx} y1={cy} y2={cy} stroke="var(--line-strong)" />}
            {r < ROWS - 1 && <line x1={cx} x2={cx} y1={cy} y2={cy + sy} stroke="var(--line-strong)" />}
            <circle cx={cx} cy={cy} r={dop ? 10 : 8.5} fill={dop ? (isN ? 'var(--electron)' : 'var(--hole)') : 'var(--card)'} fillOpacity={dop ? 0.14 : 1} stroke={dop ? (isN ? 'var(--electron)' : 'var(--hole)') : 'var(--muted)'} strokeWidth={dop ? 1.6 : 0.8} />
            <text x={cx} y={cy + 3} textAnchor="middle" style={{ fontSize: dop ? 8.5 : 7, fill: dop ? 'var(--ink)' : 'var(--muted)', fontWeight: dop ? 700 : 400 }}>{dop ? (isN ? 'P' : 'B') : 'Si'}</text>
            {dop && isN && <circle cx={cx + 9} cy={cy - 9} r={3.6} fill="var(--electron)" />}
            {dop && !isN && <circle cx={cx + sx / 2} cy={cy} r={3.8} fill="var(--card)" stroke="var(--hole)" strokeWidth={1.5} />}
          </g>
        );
      })}
      <text x={4} y={latH - 4} className="plot-label">{nDop === 0 ? 'pure silicon' : isN ? 'P gives a 5th electron' : 'B leaves one bond short: a hole'}</text>
    </svg>
  );

  const bands = (
    <svg viewBox={`0 0 ${bw} ${bh}`} width={bw} height={bh} role="img" aria-label={`Band diagram. Fermi level ${EFminusEi >= 0 ? 'above' : 'below'} midgap by ${Math.abs(EFminusEi).toFixed(3)} electronvolts`}>
      <rect x={30} y={by(Eg)} width={bw - 40} height={by(0) - by(Eg)} fill="var(--accent-tint)" />
      <line x1={30} x2={bw - 10} y1={by(Eg)} y2={by(Eg)} stroke="var(--ink)" strokeWidth={2} />
      <line x1={30} x2={bw - 10} y1={by(0)} y2={by(0)} stroke="var(--ink)" strokeWidth={2} />
      <line x1={30} x2={bw - 10} y1={by(EiY)} y2={by(EiY)} stroke="var(--muted)" strokeDasharray="2 4" />
      <g style={{ transform: `translateY(${by(EF)}px)`, transition: 'transform 0.35s cubic-bezier(.2,.7,.2,1)' }}>
        <line x1={30} x2={bw - 10} y1={0} y2={0} stroke="var(--accent)" strokeWidth={2.2} strokeDasharray="7 4" />
        <text x={bw - 12} y={-6} textAnchor="end" className="plot-label" style={{ fill: 'var(--accent-deep)', fontWeight: 600 }}>E<tspan dy="3" fontSize="8.5">F</tspan></text>
      </g>
      {ND > 0 && <line x1={40} x2={bw - 20} y1={by(Eg - 0.045)} y2={by(Eg - 0.045)} stroke="var(--electron)" strokeDasharray="2 6" strokeWidth={2} />}
      {NA > 0 && <line x1={40} x2={bw - 20} y1={by(0.045)} y2={by(0.045)} stroke="var(--hole)" strokeDasharray="2 6" strokeWidth={2} />}
      <text x={2} y={by(Eg) + 4} className="plot-label">E<tspan dy="3" fontSize="8.5">c</tspan></text>
      <text x={2} y={by(0) + 4} className="plot-label">E<tspan dy="3" fontSize="8.5">v</tspan></text>
      <text x={2} y={by(EiY) + 4} className="plot-label">E<tspan dy="3" fontSize="8.5">i</tspan></text>
      {ND > 0 && <text x={40} y={by(Eg - 0.045) + 13} className="plot-label" style={{ fill: 'var(--electron)' }}>donor level, 45 meV below E<tspan dy="3" fontSize="8.5">c</tspan></text>}
      {NA > 0 && <text x={40} y={by(0.045) - 6} className="plot-label" style={{ fill: 'var(--hole)' }}>acceptor level, 45 meV above E<tspan dy="3" fontSize="8.5">v</tspan></text>}
    </svg>
  );

  const bars = (
    <svg viewBox={`0 0 ${bw} 70`} width={bw} height={70} role="img" aria-label="Log-scale bars of n and p">
      {[{ l: 'n', v: n, c: 'var(--electron)', y0: 10 }, { l: 'p', v: p, c: 'var(--hole)', y0: 38 }].map((b) => (
        <g key={b.l}>
          <text x={0} y={b.y0 + 13} className="plot-label" style={{ fill: 'var(--ink)', fontWeight: 600 }}>{b.l}</text>
          <rect x={14} y={b.y0} width={logBar(20)} height={18} rx={4} fill="var(--line)" />
          <rect x={14} y={b.y0} width={Math.max(2, logBar(Math.max(0, Math.log10(b.v))))} height={18} rx={4} fill={b.c} fillOpacity={0.75} style={{ transition: 'width 0.35s cubic-bezier(.2,.7,.2,1)' }} />
          <text x={18 + logBar(20)} y={b.y0 + 13} className="plot-label tnum">10{sup(Math.round(Math.log10(b.v)))}</text>
        </g>
      ))}
    </svg>
  );

  return (
    <FigureFrame label="Figure 1.5" title="One drop of ink in a bucket">
      <div ref={ref} className="px-3 pt-3">
        {stacked ? (
          <div className="flex flex-col items-center gap-2">{lattice}<div className="w-full">{bands}{bars}</div></div>
        ) : (
          <div className="flex items-start gap-4">{lattice}<div className="min-w-0 flex-1">{bands}{bars}</div></div>
        )}
      </div>
      <div className="grid gap-x-6 gap-y-2 border-t border-line px-4 py-3 sm:grid-cols-2">
        <Slider label="Doping (← boron · phosphorus →)" value={s} min={-5} max={5} step={0.1} onChange={(v) => { setS(v); touched(); }} display={NA ? `${sci(NA, 1)} B · p` : ND ? `${sci(ND, 1)} P · n` : 'intrinsic'} beacon={beacon} />
        <Slider label="Temperature" value={T} min={200} max={700} step={10} onChange={(v) => { setT(v); touched(); }} display={`${T} K`} />
      </div>
      <div className="flex flex-wrap items-center gap-2 border-t border-line px-4 py-3">
        <span className="text-[12.5px] text-muted">n<sub>i</sub> at 300 K</span>
        <button className="btn btn-sm" aria-pressed={ni300 === 1e10} onClick={() => setNi300(1e10)}>1.0 × 10¹⁰</button>
        <button className="btn btn-sm" aria-pressed={ni300 === 1.5e10} onClick={() => setNi300(1.5e10)}>1.5 × 10¹⁰ (textbooks)</button>
      </div>
      <Readouts items={[
        { k: 'Electrons n', v: `${sci(n, 2)} cm${sup(-3)}` },
        { k: 'Holes p', v: `${sci(p, 2)} cm${sup(-3)}` },
        { k: <>n·p vs n<sub>i</sub>²</>, v: `${sci(n * p, 2)} = ${sci(ni * ni, 2)}` },
        { k: <>E<sub>F</sub> − E<sub>i</sub></>, v: `${EFminusEi >= 0 ? '+' : '−'}${Math.abs(EFminusEi * 1000).toFixed(0)} meV` },
      ]} />
      <Caption>
        {ND + NA === 0
          ? <>Intrinsic: n = p = n<sub>i</sub> and E<sub>F</sub> sits at midgap.</>
          : ni > (ND + NA) / 3
            ? <>At {T} K the thermally generated carriers (n<sub>i</sub> = {sci(ni, 1)} cm⁻³) rival the dopants, so the crystal is drifting back toward intrinsic behaviour.</>
            : <>{sci(ND + NA, 1)} dopants per cm³ is about one atom in {sci(5e22 / (ND + NA), 1)}, yet the majority carrier count rises {sci((ND + NA) / ni, 1)} times above n<sub>i</sub>.</>}
      </Caption>
    </FigureFrame>
  );
}
