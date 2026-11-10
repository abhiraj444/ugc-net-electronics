'use client';
import { useEffect, useRef, useState } from 'react';
import { hbar, m0, parabolicE, q } from '@/lib/physics';
import { FigureFrame } from '../lesson/Blocks';
import { Caption, Readouts, Slider, useBeacon, useRaf, useReducedMotion, useWidth } from '../ui/controls';
import { Axes, linear, path } from '../ui/plot';

const PRESETS = [
  { label: 'Free electron', m: 1 },
  { label: 'Si (0.26)', m: 0.26 },
  { label: 'Ge (0.12)', m: 0.12 },
  { label: 'GaAs (0.067)', m: 0.067 },
];
const T_END = 1e-12; // s: race lasts 1 ps of simulated time
const K_MAX = 1.0; // nm^-1 shown on the E–k plot

export default function EffectiveMass() {
  const [lm, setLm] = useState(Math.log10(0.067)); // log10(m*/m0)
  const [F, setF] = useState(3); // kV/cm
  const [time, setTime] = useState(0); // s
  const [running, setRunning] = useState(false);
  const reduced = useReducedMotion();
  const { beacon, touched } = useBeacon();
  const mr = Math.pow(10, lm);
  const field = F * 1e5; // V/m
  const { ref, w } = useWidth<HTMLDivElement>();
  const done = useRef(false);

  useRaf(running, (dt) => {
    setTime((t) => {
      const nt = t + (dt / 2.5) * T_END;
      if (nt >= T_END) { setRunning(false); return T_END; }
      return nt;
    });
  });
  useEffect(() => { setTime(0); setRunning(false); done.current = false; }, [lm, F]);

  const go = () => { touched(); if (reduced) { setTime((t) => Math.min(T_END, t + T_END / 4)); } else { setTime(0); setRunning(true); } };

  // E–k parabola
  const h = 230;
  const m = { l: 44, r: 14, t: 14, b: 32 };
  const x = linear([-K_MAX, K_MAX], [m.l, w - m.r]);
  const y = linear([0, 0.6], [h - m.b, m.t]);
  const ks = Array.from({ length: 161 }, (_, i) => -K_MAX + (2 * K_MAX * i) / 160);
  const free = path(ks.map((k) => [x(k), y(Math.min(parabolicE(k, 1), 0.7))]));
  const crys = path(ks.map((k) => [x(k), y(Math.min(parabolicE(k, mr), 0.7))]).filter(([, yy]) => yy >= m.t - 2));
  // k gained in the field is the same for any mass: ħ dk/dt = qE
  const kNow = ((q * field * time) / hbar) * 1e-9; // nm^-1
  const kShown = Math.min(kNow, K_MAX);
  const curvature = (hbar * hbar) / (mr * m0) / q * 1e18; // eV·nm²  (d²E/dk²)
  const a = (q * field) / (mr * m0);
  const aFree = (q * field) / m0;
  const xCrys = 0.5 * a * time * time; // m
  const xFree = 0.5 * aFree * time * time;
  const xEnd = 0.5 * a * T_END * T_END;
  const lane = linear([0, Math.max(xEnd, 0.5 * aFree * T_END * T_END) * 1.05], [12, w - 22]);

  return (
    <FigureFrame label="Figure 1.3" title="Running in a swimming pool">
      <div ref={ref} className="px-2 pt-2">
        <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} role="img" aria-label={`E versus k parabola for effective mass ${mr.toFixed(3)} times the free electron mass`}>
          <Axes x={x} y={y} xTicks={[-1, -0.5, 0, 0.5, 1]} yTicks={[0, 0.2, 0.4, 0.6]} xLabel="wavevector k (nm⁻¹)" yLabel={<>E − E<tspan dy="3" fontSize="8.5">c</tspan><tspan dy="-3"> (eV)</tspan></>} />
          <path d={free} fill="none" stroke="var(--muted)" strokeWidth={1.4} strokeDasharray="5 4" />
          <path d={crys} fill="none" stroke="var(--accent-deep)" strokeWidth={2.4} style={{ transition: 'd 0.35s ease-out' }} />
          <text x={x(-0.97)} y={y(parabolicE(-1, 1)) - 7} className="plot-label">free electron, m₀ (dashed)</text>
          {time > 0 && (<>
            <circle cx={x(kShown)} cy={y(Math.min(parabolicE(kShown, mr), 0.6))} r={6} fill="var(--electron)" />
            <circle cx={x(kShown)} cy={y(parabolicE(kShown, 1))} r={5} fill="none" stroke="var(--muted)" strokeWidth={1.5} />
          </>)}
        </svg>
        <svg viewBox={`0 0 ${w} 92`} width="100%" height={92} role="img" aria-label="Race: distance travelled in the field">
          <text x={12} y={14} className="plot-label" style={{ fill: 'var(--ink)', fontWeight: 600 }}>Race in the same field, {(time * 1e12).toFixed(2)} ps</text>
          {[{ label: `crystal electron, m* = ${mr.toPrecision(2)} m₀`, xx: xCrys, y0: 38, c: 'var(--electron)' }, { label: 'free electron', xx: xFree, y0: 72, c: 'var(--muted)' }].map((l) => (
            <g key={l.label}>
              <line x1={12} x2={w - 22} y1={l.y0} y2={l.y0} stroke="var(--line-strong)" strokeDasharray="2 4" />
              <circle cx={lane(l.xx)} cy={l.y0} r={6} fill={l.c} />
              <text x={12} y={l.y0 - 9} className="plot-label">{l.label} · {(l.xx * 1e9).toFixed(1)} nm</text>
            </g>
          ))}
        </svg>
      </div>
      <div className="flex flex-wrap items-center gap-2 px-4 pb-3 pt-1">
        <button className={`btn btn-accent ${beacon ? 'beacon' : ''}`} onClick={go} disabled={running}>{reduced ? 'Step 0.25 ps' : 'Push with the field'}</button>
        <button className="btn" onClick={() => { setRunning(false); setTime(0); }}>Reset</button>
      </div>
      <div className="grid gap-x-6 gap-y-2 border-t border-line px-4 py-3 sm:grid-cols-2">
        <Slider label={<>Effective mass m*/m₀</>} value={lm} min={-1.35} max={0.3} step={0.01} onChange={(v) => { setLm(v); touched(); }} display={mr.toPrecision(2)} />
        <Slider label="Applied field E" value={F} min={0.1} max={5} step={0.1} onChange={(v) => { setF(v); touched(); }} display={`${F.toFixed(1)} kV/cm`} />
      </div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto border-t border-line px-4 py-3">
        {PRESETS.map((p) => <button key={p.label} className="btn btn-sm shrink-0" aria-pressed={Math.abs(mr - p.m) < 0.002} onClick={() => { setLm(Math.log10(p.m)); touched(); }}>{p.label}</button>)}
      </div>
      <Readouts items={[
        { k: <>Curvature d²E/dk²</>, v: `${curvature.toFixed(3)} eV·nm²` },
        { k: 'Acceleration vs free', v: `${(1 / mr).toFixed(1)}×` },
        { k: 'k gained (any mass)', v: `${kNow.toFixed(3)} nm⁻¹` },
        { k: 'Speed now', v: `${((hbar * kNow * 1e9) / (mr * m0) / 1000).toFixed(0)} km/s` },
      ]} />
      <Caption>
        Both dots gain the same k, because ħ·dk/dt = qE does not care about mass. The sharper curve turns that k into more speed: v = ħk/m*. Acceleration in this field: {(a / 1e15).toFixed(1)} × 10¹⁵ m/s².
      </Caption>
    </FigureFrame>
  );
}
