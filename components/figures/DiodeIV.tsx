'use client';
import { useMemo, useState } from 'react';
import { IsAt, diodeCurrent, eng, pnJunction, sci, thermalVoltage } from '@/lib/physics';
import { FigureFrame } from '../lesson/Blocks';
import { Caption, Readouts, Slider, rng, useBeacon, useWidth } from '../ui/controls';
import { Axes, linear, path } from '../ui/plot';

const V_MIN = -1, V_MAX = 0.85;

export default function DiodeIV({ V: V0, Is: Is0, n: n0, T: T0 }: { V?: number; Is?: number; n?: number; T?: number } = {}) {
  const [V, setV] = useState(V0 ?? 0.6);
  const [lIs, setLIs] = useState(Is0 && Is0 > 0 ? Math.log10(Is0) : -14); // log10 Is at 300 K, amps
  const [n, setN] = useState(n0 ?? 1);
  const [T, setT] = useState(T0 ?? 300);
  const [scale, setScale] = useState<'lin' | 'log'>('lin');
  const { beacon, touched } = useBeacon();
  const { ref, w } = useWidth<HTMLDivElement>();
  const Is = IsAt(T, Math.pow(10, lIs));
  const Vt = thermalVoltage(T);
  const I = diodeCurrent(V, Is, n, T);
  const V1mA = n * Vt * Math.log(1e-3 / Is + 1);
  const perDecade = n * Vt * Math.LN10;
  const j = pnJunction(1e18, 1e17, T, 0);
  const jb = pnJunction(1e18, 1e17, T, Math.min(V, j.Vbi - 0.02));

  const h = 250;
  const m = { l: 50, r: 14, t: 14, b: 34 };
  const x = linear([V_MIN, V_MAX], [m.l, w - m.r]);
  const yLin = linear([-1, 10], [h - m.b, m.t]); // mA
  const yLog = linear([-16, 0], [h - m.b, m.t]); // log10 |I| (A)
  const Vs = Array.from({ length: 371 }, (_, i) => V_MIN + ((V_MAX - V_MIN) * i) / 370);
  const curve = scale === 'lin'
    ? path(Vs.map((v) => [x(v), yLin(Math.max(-1, Math.min(10.5, diodeCurrent(v, Is, n, T) * 1e3)))] as [number, number]).filter(([, yy]) => yy >= m.t - 1))
    : path(Vs.filter((v) => Math.abs(v) > 1e-4).map((v) => [x(v), yLog(Math.max(-16, Math.min(0.2, Math.log10(Math.abs(diodeCurrent(v, Is, n, T))))))] as [number, number]).filter(([, yy]) => yy >= m.t - 1));
  const markerY = scale === 'lin' ? yLin(Math.max(-1, Math.min(10.5, I * 1e3))) : yLog(Math.max(-16, Math.min(0.2, Math.log10(Math.abs(I) || 1e-30))));

  // band diagram: barrier height q(Vbi − V)
  const bh = 168;
  const bx = linear([0, 1], [16, w - 16]);
  const barrier = Math.max(0.02, j.Vbi - V);
  const Eg = 1.12;
  const EcN = 0.25; // n-side Ec reference (eV, drawing units)
  const by = linear([EcN - Eg - 0.08, EcN + j.Vbi - V_MIN + 0.05], [bh - 12, 18]);
  const EcP = EcN + barrier;
  const half = Math.min(0.32, 0.06 + jb.W * 1e4 * 0.13);
  const sCurve = (t: number) => (t < 0.5 - half ? 1 : t > 0.5 + half ? 0 : 0.5 + 0.5 * Math.cos(((t - (0.5 - half)) / (2 * half)) * Math.PI));
  const ts = Array.from({ length: 121 }, (_, i) => i / 120);
  const ec = path(ts.map((t) => [bx(t), by(EcN + barrier * sCurve(t))]));
  const ev = path(ts.map((t) => [bx(t), by(EcN + barrier * sCurve(t) - Eg)]));
  const dots = useMemo(() => {
    const r = rng(5);
    return Array.from({ length: 34 }, () => ({ t: 0.7 + r() * 0.27, e: -Math.log(1 - r() * 0.999) })); // energy above Ec in units of kT (Boltzmann)
  }, []);
  const kTe = Vt; // eV
  const shown = dots.map((d) => ({ ...d, E: EcN + d.e * kTe * 3.2 })); // stretched ×3.2 so the tail is visible
  const fracOver = Math.exp(-barrier / kTe);

  return (
    <FigureFrame label="Figure 1.7" title="A door that swings open with a push">
      <div ref={ref} className="px-2 pt-2">
        <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} role="img" aria-label={`Diode current versus voltage, ${scale === 'lin' ? 'linear' : 'logarithmic'} scale. At ${V.toFixed(2)} volts the current is ${eng(I, 'amps')}.`}>
          {scale === 'lin'
            ? <Axes x={x} y={yLin} xTicks={[-1, -0.5, 0, 0.5]} yTicks={[0, 2, 4, 6, 8, 10]} xLabel="V (volts)" yLabel="I (mA)" zeroX zeroY />
            : <Axes x={x} y={yLog} xTicks={[-1, -0.5, 0, 0.5]} yTicks={[-15, -12, -9, -6, -3, 0]} yFmt={(v) => (v === 0 ? '1 A' : `10${String(v).replace('-', '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+d])}`)} xLabel="V (volts)" yLabel="|I| (A), log" zeroX />}
          <path d={curve} fill="none" stroke="var(--accent-deep)" strokeWidth={2.4} />
          {scale === 'lin' && V1mA < V_MAX && <line x1={x(V1mA)} x2={x(V1mA)} y1={yLin(0)} y2={yLin(1)} stroke="var(--muted)" strokeDasharray="2 3" />}
          <line x1={x(V)} x2={x(V)} y1={m.t} y2={h - m.b} stroke="var(--accent)" strokeOpacity={0.5} />
          <circle cx={x(V)} cy={markerY} r={6} fill="var(--card)" stroke="var(--accent-deep)" strokeWidth={2.5} />
        </svg>
        <div className="flex items-center justify-between gap-2 px-2 pb-1">
          <div className="text-[12.5px] text-muted">Band picture at this bias</div>
          <div className="flex gap-1.5" role="group" aria-label="Current axis scale">
            <button className="btn btn-sm" aria-pressed={scale === 'lin'} onClick={() => setScale('lin')}>Linear</button>
            <button className="btn btn-sm" aria-pressed={scale === 'log'} onClick={() => setScale('log')}>Log</button>
          </div>
        </div>
        <svg viewBox={`0 0 ${w} ${bh}`} width="100%" height={bh} role="img" aria-label={`Band diagram: barrier for electrons is ${barrier.toFixed(2)} electronvolts`}>
          <text x={bx(0)} y={12} className="plot-label" style={{ fill: 'var(--hole)', fontWeight: 600 }}>p side</text>
          <text x={bx(1)} y={12} textAnchor="end" className="plot-label" style={{ fill: 'var(--electron)', fontWeight: 600 }}>n side</text>
          <path d={ec} fill="none" stroke="var(--ink)" strokeWidth={2} style={{ transition: 'd 0.3s ease-out' }} />
          <path d={ev} fill="none" stroke="var(--ink)" strokeWidth={2} style={{ transition: 'd 0.3s ease-out' }} />
          <line x1={bx(0.06)} x2={bx(0.06)} y1={by(EcN)} y2={by(EcP)} stroke="var(--accent)" strokeWidth={1.5} />
          <line x1={bx(0.06)} x2={bx(0.62)} y1={by(EcN)} y2={by(EcN)} stroke="var(--muted)" strokeDasharray="2 3" />
          <text x={bx(0.06) + 6} y={Math.min((by(EcN) + by(EcP)) / 2 + 4, by(EcP) - 6)} className="plot-label tnum" style={{ fill: 'var(--accent-deep)', fontWeight: 600 }}>barrier {barrier.toFixed(2)} eV</text>
          {shown.map((d, i) => (
            <circle key={i} cx={bx(d.t)} cy={Math.max(by(EcN + 1.0), by(d.E))} r={3.3} fill="var(--electron)" fillOpacity={d.e * kTe * 3.2 >= barrier ? 1 : 0.35} />
          ))}
          <text x={bx(1)} y={bh - 4} textAnchor="end" className="plot-label">share with enough energy to cross: {sci(fracOver, 1)}</text>
        </svg>
      </div>
      <div className="grid gap-x-6 gap-y-2 border-t border-line px-4 py-3 sm:grid-cols-2">
        <Slider label="Bias voltage V" value={V} min={V_MIN} max={V_MAX} step={0.005} onChange={(v) => { setV(v); touched(); }} display={`${V >= 0 ? '+' : '−'}${Math.abs(V).toFixed(3)} V`} beacon={beacon} />
        <Slider label={<>Saturation current I<sub>s</sub> (at 300 K)</>} value={lIs} min={-16} max={-9} step={0.5} onChange={(v) => { setLIs(v); touched(); }} display={`${sci(Math.pow(10, lIs), 1)} A`} />
        <Slider label="Ideality factor n" value={n} min={1} max={2} step={0.05} onChange={(v) => { setN(v); touched(); }} display={n.toFixed(2)} />
        <Slider label="Temperature" value={T} min={250} max={400} step={5} onChange={(v) => { setT(v); touched(); }} display={`${T} K`} />
      </div>
      <Readouts items={[
        { k: 'Current I', v: eng(I, 'A', 3) },
        { k: 'V for 1 mA', v: `${V1mA.toFixed(3)} V` },
        { k: 'Per tenfold current', v: `${(perDecade * 1000).toFixed(1)} mV` },
        { k: <>I<sub>s</sub> at {T} K</>, v: eng(Is, 'A', 2) },
      ]} />
      <Caption>
        {V < -0.1 ? <>Reverse bias: the barrier grows and the current settles at −I<sub>s</sub>, independent of V.</> : V < 0.4 ? <>Below about 0.4 V the current is too small to see on the linear axis. Switch to Log to see the straight line.</> : <>Each extra {(perDecade * 1000).toFixed(0)} mV multiplies the current by 10. The barrier is V<sub>bi</sub> − V = {barrier.toFixed(2)} V (V<sub>bi</sub> = {j.Vbi.toFixed(2)} V for N<sub>A</sub> = 10¹⁸, N<sub>D</sub> = 10¹⁷ cm⁻³).</>}
      </Caption>
    </FigureFrame>
  );
}
