'use client';
import { useState } from 'react';
import { NcAt, NvAt, SI, fd12, fermiDirac, kT_eV, sci, sup } from '@/lib/physics';
import { FigureFrame } from '../lesson/Blocks';
import { Caption, Readouts, Slider, useBeacon, useWidth } from '../ui/controls';
import { linear, path } from '../ui/plot';

const Eg = SI.Eg; // Ev = 0, Ec = 1.12 eV
const E_LO = -0.45, E_HI = Eg + 0.45;

export default function FermiFilling() {
  const [T, setT] = useState(300);
  const [EF, setEF] = useState(0.56);
  const { beacon, touched } = useBeacon();
  const { ref, w } = useWidth<HTMLDivElement>();
  const kT = kT_eV(T);
  const Nc = NcAt(T), Nv = NvAt(T);
  const n = Nc * fd12((EF - Eg) / kT);
  const p = Nv * fd12((0 - EF) / kT);
  const ni2 = Nc * Nv * Math.exp(-Eg / kT);
  const Ei = Eg / 2 + (kT / 2) * Math.log(Nv / Nc);

  const h = 330;
  const top = 22, bot = h - 28;
  const y = linear([E_LO, E_HI], [bot, top]);
  const gapX = 8, axisW = 36;
  const pw = (w - axisW - 2 * gapX - 8) / 3;
  const x0 = axisW, x1 = axisW + pw + gapX, x2 = axisW + 2 * (pw + gapX);
  const Es = Array.from({ length: 701 }, (_, i) => E_LO + ((E_HI - E_LO) * i) / 700);
  // g(E) ∝ m*^{3/2} sqrt(E − Ec); with Nc ∝ m_n^{3/2}, Nc and Nv set the relative heights
  const gc = (E: number) => (E > Eg ? Nc * Math.sqrt(E - Eg) : 0);
  const gv = (E: number) => (E < 0 ? Nv * Math.sqrt(-E) : 0);
  const gMax = Nc * Math.sqrt(E_HI - Eg);
  const nE = Es.map((E) => gc(E) * fermiDirac(E, EF, T));
  const pE = Es.map((E) => gv(E) * (1 - fermiDirac(E, EF, T)));
  const nPeak = Math.max(...nE, 1e-300), pPeak = Math.max(...pE, 1e-300);
  const mag = (peak: number) => gMax / peak;

  const gPath = (fn: (E: number) => number, xs: number) => path(Es.filter((E) => fn(E) > 0 || Math.abs(E - Eg) < 1e-3 || Math.abs(E) < 1e-3).map((E) => [xs + (fn(E) / gMax) * pw, y(E)]));
  const fPath = path(Es.map((E) => [x1 + fermiDirac(E, EF, T) * pw, y(E)]));
  const nPath = path(Es.map((E, i) => [x2 + (nE[i] / nPeak) * pw * 0.92, y(E)]));
  const pPath = path(Es.map((E, i) => [x2 + (pE[i] / pPeak) * pw * 0.92, y(E)]));

  const band = (xs: number) => (
    <g>
      <rect x={xs} y={y(Eg)} width={pw} height={y(0) - y(Eg)} fill="var(--accent-tint)" />
      <line x1={xs} x2={xs + pw} y1={y(Eg)} y2={y(Eg)} stroke="var(--ink)" strokeWidth={1.2} />
      <line x1={xs} x2={xs + pw} y1={y(0)} y2={y(0)} stroke="var(--ink)" strokeWidth={1.2} />
      <line x1={xs} x2={xs} y1={top} y2={bot} stroke="var(--line-strong)" />
    </g>
  );
  const title = (xs: number, t: string, sub: string) => (
    <text x={xs} y={12} className="plot-label" style={{ fill: 'var(--ink)', fontWeight: 600, fontSize: 11.5 }}>{t}<tspan style={{ fill: 'var(--muted)', fontWeight: 400 }}>{sub}</tspan></text>
  );
  const op = (pw > 120 ? ' ' : '');

  return (
    <FigureFrame label="Figure 1.4" title="Theatre seats filled from the front">
      <div ref={ref} className="px-2 pt-2">
        <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} role="img" aria-label={`Density of states, Fermi function and carrier distribution. Fermi level ${EF.toFixed(2)} eV above the valence band at ${T} kelvin.`}>
          {[x0, x1, x2].map((xs) => <g key={xs}>{band(xs)}</g>)}
          {title(x0, 'g(E)', op + 'seats')}
          {title(x1, '× f(E)', op + 'chance')}
          {title(x2, '= n(E), p(E)', '')}
          {/* energy axis */}
          {[0, 0.5, Eg].map((E) => <text key={E} x={axisW - 5} y={y(E) + 3.5} textAnchor="end" className="plot-label tnum">{E === Eg ? '1.12' : E.toFixed(1)}</text>)}
          <text x={2} y={bot + 20} className="plot-label">E (eV)</text>
          <text x={x0 + pw - 2} y={y(Eg) - 4} textAnchor="end" className="plot-label">E<tspan dy="3" fontSize="8.5">c</tspan></text>
          <text x={x0 + pw - 2} y={y(0) + 12} textAnchor="end" className="plot-label">E<tspan dy="3" fontSize="8.5">v</tspan></text>
          <path d={gPath(gc, x0)} fill="none" stroke="var(--ink)" strokeWidth={1.8} />
          <path d={gPath(gv, x0)} fill="none" stroke="var(--ink)" strokeWidth={1.8} />
          <line x1={x1 + pw / 2} x2={x1 + pw / 2} y1={top} y2={bot} stroke="var(--line)" strokeDasharray="2 3" />
          <text x={x1 + pw / 2} y={bot + 13} textAnchor="middle" className="plot-label">½</text>
          <text x={x1 + pw} y={bot + 13} textAnchor="end" className="plot-label">1</text>
          <text x={x1} y={bot + 13} className="plot-label">0</text>
          <path d={fPath} fill="none" stroke="var(--accent-deep)" strokeWidth={2} />
          <path d={`${nPath}L${x2},${y(E_HI)}L${x2},${y(Eg)}Z`} fill="var(--electron)" fillOpacity={0.22} stroke="var(--electron)" strokeWidth={1.6} />
          <path d={`${pPath}L${x2},${y(E_LO)}L${x2},${y(0)}Z`} fill="var(--hole)" fillOpacity={0.18} stroke="var(--hole)" strokeWidth={1.6} />
          <text x={x2 + 4} y={y(Eg + 0.33)} className="plot-label" style={{ fill: 'var(--electron)' }}>n (drawn ×{sci(mag(nPeak), 0)})</text>
          <text x={x2 + 4} y={y(-0.36)} className="plot-label" style={{ fill: 'var(--hole)' }}>p (drawn ×{sci(mag(pPeak), 0)})</text>
          {/* Fermi level across all panels */}
          <line x1={x0} x2={x2 + pw} y1={y(EF)} y2={y(EF)} stroke="var(--accent)" strokeWidth={1.6} strokeDasharray="6 4" />
          <text x={x2 + pw} y={y(EF) - 5} textAnchor="end" className="plot-label" style={{ fill: 'var(--accent-deep)', fontWeight: 600 }}>E<tspan dy="3" fontSize="8.5">F</tspan></text>
          <line x1={x0} x2={x0 + pw} y1={y(Ei)} y2={y(Ei)} stroke="var(--muted)" strokeDasharray="1 3" />
          <text x={x0 + 3} y={y(Ei) - 4} className="plot-label">E<tspan dy="3" fontSize="8.5">i</tspan></text>
        </svg>
      </div>
      <div className="grid gap-x-6 gap-y-2 border-t border-line px-4 py-3 sm:grid-cols-2">
        <Slider label={<>Fermi level E<sub>F</sub> above E<sub>v</sub></>} value={EF} min={-0.1} max={Eg + 0.1} step={0.01} onChange={(v) => { setEF(v); touched(); }} display={`${EF.toFixed(2)} eV`} beacon={beacon} />
        <Slider label="Temperature" value={T} min={100} max={600} step={10} onChange={(v) => { setT(v); touched(); }} display={`${T} K`} />
      </div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto border-t border-line px-4 py-3">
        {[{ l: 'Intrinsic', v: Ei }, { l: 'n-type (E_c − 0.2)', v: Eg - 0.2 }, { l: 'p-type (E_v + 0.2)', v: 0.2 }].map((pr) => (
          <button key={pr.l} className="btn btn-sm shrink-0" aria-pressed={Math.abs(EF - pr.v) < 0.006} onClick={() => { setEF(Math.round(pr.v * 100) / 100); touched(); }}>{pr.l.replace('E_c', 'Ec').replace('E_v', 'Ev')}</button>
        ))}
      </div>
      <Readouts items={[
        { k: 'Electrons n', v: `${sci(n, 2)} cm${sup(-3)}` },
        { k: 'Holes p', v: `${sci(p, 2)} cm${sup(-3)}` },
        { k: 'n · p', v: `${sci(n * p, 2)} cm${sup(-6)}` },
        { k: <>N<sub>c</sub>N<sub>v</sub>e<sup>−Eg/kT</sup></>, v: `${sci(ni2, 2)} cm${sup(-6)}` },
      ]} />
      <Caption>
        {EF > Eg - 3 * kT || EF < 3 * kT
          ? <>E<sub>F</sub> is within 3kT of a band edge, so the material is degenerate. Here n·p drifts away from n<sub>i</sub>², because the Boltzmann shortcut behind that law fails.</>
          : <>Move E<sub>F</sub> and n and p swap by orders of magnitude, but n·p stays fixed at this temperature. kT = {(kT * 1000).toFixed(1)} meV. Shaded n(E) and p(E) are magnified by the factor shown so you can see their shape.</>}
      </Caption>
    </FigureFrame>
  );
}
