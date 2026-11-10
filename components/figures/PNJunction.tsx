'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { junctionProfile, pnJunction, sci, sup, kT_eV, SI } from '@/lib/physics';
import { FigureFrame } from '../lesson/Blocks';
import { Caption, Readouts, Slider, cssVar, fillAlpha, uiFont, rng, useBeacon, useCanvas, useInView, useRaf, useReducedMotion, useThemeTick, useWidth } from '../ui/controls';
import { Axes, linear, path } from '../ui/plot';

type Dot = { hx: number; hy: number; side: 'p' | 'n'; ph: number };

const PRESETS = [
  { label: 'Textbook 10¹⁷ / 10¹⁵', a: 17, d: 15 },
  { label: 'Symmetric 10¹⁶', a: 16, d: 16 },
  { label: 'n⁺p 10¹⁵ / 10¹⁸', a: 15, d: 18 },
];

export default function PNJunction({ NA: NA0, ND: ND0, T: T0 }: { NA?: number; ND?: number; T?: number } = {}) {
  const clampLog = (v: number | undefined, d: number) => (v && v > 0 ? Math.min(18, Math.max(14, Math.round(Math.log10(v) * 10) / 10)) : d);
  const [la, setLa] = useState(() => clampLog(NA0, 17)); // log10 NA
  const [ld, setLd] = useState(() => clampLog(ND0, 15)); // log10 ND
  const [T, setT] = useState(T0 && T0 >= 250 && T0 <= 400 ? T0 : 300);
  const [t, setTt] = useState(0); // 0 = apart, 1 = equilibrium
  const [joining, setJoining] = useState(false);
  const reduced = useReducedMotion();
  const { beacon, touched } = useBeacon();
  const theme = useThemeTick();
  const { ref: viewRef, inView } = useInView<HTMLDivElement>();
  const NA = Math.pow(10, la);
  const ND = Math.pow(10, ld);
  const j = useMemo(() => pnJunction(NA, ND, T), [NA, ND, T]);
  const xpUm = j.xp * 1e4;
  const xnUm = j.xn * 1e4;
  const L = Math.max(xpUm, xnUm) * 1.7; // half window in µm

  // carriers & ions, generated per side with a count that grows with log doping
  const dots = useMemo(() => {
    const r = rng(7);
    const out: Dot[] = [];
    const count = (lg: number) => Math.round(18 + 9 * (lg - 14));
    const make = (side: 'p' | 'n', n: number) => {
      for (let i = 0; i < n; i++) {
        const u = (i + r() * 0.9) / n; // stratified so the region is evenly filled
        out.push({ hx: side === 'p' ? -u : u, hy: 0.12 + r() * 0.76, side, ph: r() * Math.PI * 2 });
      }
    };
    make('p', count(la));
    make('n', count(ld));
    return out;
  }, [la, ld]);

  const clock = useRef(0);
  useRaf(inView && (joining || !reduced), (dt) => {
    clock.current += dt * (T / 300);
    if (joining) {
      setTt((v) => {
        const nv = Math.min(1, v + dt / 1.8);
        if (nv >= 1) setJoining(false);
        return nv;
      });
    } else draw();
  });

  const { ref: canvasRef, redraw: draw } = useCanvas(2.3, (ctx, w, h) => {
    const el = canvasRef.current!;
    const ink = cssVar('--ink', el), muted = cssVar('--muted', el), line = cssVar('--line', el);
    const eC = cssVar('--electron', el), hC = cssVar('--hole', el), card = cssVar('--card', el);
    const pad = 10;
    const gap = (1 - t) * 26; // gap between blocks before joining
    const cx = w / 2;
    const half = (w - 2 * pad - gap) / 2;
    const X = (xUm: number) => (xUm < 0 ? cx - gap / 2 + (xUm / L) * half : cx + gap / 2 + (xUm / L) * half);
    const top = 22, bot = h - 8, H = bot - top;
    // blocks
    ctx.fillStyle = card;
    ctx.strokeStyle = line;
    ctx.lineWidth = 1;
    const rr = (x: number, y: number, ww: number, hh: number) => { ctx.beginPath(); ctx.roundRect(x, y, ww, hh, 8); ctx.fill(); ctx.stroke(); };
    rr(pad, top, half, H);
    rr(cx + gap / 2, top, half, H);
    fillAlpha(ctx, hC, 0.06, () => { ctx.beginPath(); ctx.roundRect(pad, top, half, H, 8); ctx.fill(); });
    fillAlpha(ctx, eC, 0.06, () => { ctx.beginPath(); ctx.roundRect(cx + gap / 2, top, half, H, 8); ctx.fill(); });
    // depletion band
    const xpN = -xpUm * t, xnN = xnUm * t;
    if (t > 0.02) {
      fillAlpha(ctx, muted, 0.16, () => ctx.fillRect(X(xpN), top + 1, X(xnN) - X(xpN), H - 2));
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = muted;
      ctx.beginPath(); ctx.moveTo(X(xpN), top); ctx.lineTo(X(xpN), bot); ctx.moveTo(X(xnN), top); ctx.lineTo(X(xnN), bot); ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.font = uiFont(600, 11);
    ctx.fillStyle = muted;
    ctx.textAlign = 'left';
    ctx.fillText(`p-type · acceptors ${sci(NA, 1)}`, pad, 14);
    ctx.textAlign = 'right';
    ctx.fillText(`n-type · donors ${sci(ND, 1)}`, w - pad, 14);
    const amp = reduced ? 0 : 2.2 * (T / 300);
    const ck = clock.current;
    for (const d of dots) {
      const xUm = d.hx * L * 0.98;
      const inDep = d.side === 'p' ? xUm > -xpUm * t : xUm < xnUm * t;
      const ix = X(xUm), iy = top + d.hy * H;
      // fixed ion: always present, emphasised once uncovered
      ctx.font = inDep ? uiFont(700, 14) : uiFont(500, 11);
      ctx.textAlign = 'center';
      ctx.fillStyle = inDep ? (d.side === 'p' ? eC : hC) : muted;
      ctx.globalAlpha = inDep ? 1 : 0.5;
      ctx.fillText(d.side === 'p' ? '−' : '+', ix + (d.side === 'p' ? -6 : 6), iy + 4);
      ctx.globalAlpha = 1;
      if (inDep) continue;
      // mobile carrier near its ion, jiggling
      const jx = amp * Math.sin(ck * 3 + d.ph) * 1.6, jy = amp * Math.cos(ck * 2.3 + d.ph * 1.7);
      const px = ix + (d.side === 'p' ? 4 : -4) + jx, py = iy + jy;
      ctx.beginPath();
      ctx.arc(px, py, 3.6, 0, Math.PI * 2);
      if (d.side === 'n') { ctx.fillStyle = eC; ctx.fill(); }
      else { ctx.strokeStyle = hC; ctx.lineWidth = 1.6; ctx.stroke(); }
    }
    // carriers in flight while joining: a few crossing the boundary
    if (t > 0 && t < 1) {
      for (let i = 0; i < 6; i++) {
        const f = (t * 3 + i / 6) % 1;
        const y = top + H * (0.15 + 0.7 * ((i * 0.37) % 1));
        ctx.globalAlpha = 1 - f;
        ctx.beginPath(); ctx.arc(cx + 18 - f * 36, y, 3.4, 0, Math.PI * 2); ctx.fillStyle = eC; ctx.fill();
        ctx.beginPath(); ctx.arc(cx - 18 + f * 36, y + 9, 3.4, 0, Math.PI * 2); ctx.strokeStyle = hC; ctx.lineWidth = 1.6; ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
    if (t >= 0.999) {
      ctx.fillStyle = ink;
      ctx.font = uiFont(600, 11);
      ctx.textAlign = 'center';
      const mid = (X(xpN) + X(xnN)) / 2;
      ctx.fillText('W', Math.min(Math.max(mid, 16), w - 16), bot - 6);
    }
  }, 190);

  useEffect(() => { draw(); }, [draw, t, la, ld, T, dots, theme, reduced]);

  const join = () => { touched(); if (reduced) setTt(1); else { setTt(0); setJoining(true); } };
  const step = () => { touched(); setTt((v) => Math.min(1, Math.round((v + 0.25) * 4) / 4)); };
  const reset = () => { setJoining(false); setTt(0); };

  // ---- plots
  const { ref: plotRef, w } = useWidth<HTMLDivElement>();
  const cols = w >= 620 ? 2 : 1;
  const pw = cols === 2 ? (w - 16) / 2 : w;
  const ph = 132;
  const m = { l: 46, r: 12, t: 20, b: 26 };
  const xs = linear([-L, L], [m.l, pw - m.r]);
  const frac = t; // depletion grows linearly in the animation
  const jj = { ...j, xp: j.xp * frac, xn: j.xn * frac };
  const N = 220;
  const samples = Array.from({ length: N + 1 }, (_, i) => -L + (2 * L * i) / N);
  const prof = samples.map((xu) => ({ xu, ...(frac > 0 ? junctionProfile(xu * 1e-4, NA, ND, jj) : { rho: 0, E: 0, V: 0 }) }));
  const Emax = Math.max(j.Emax, 1);
  const Vbi = j.Vbi;
  const kT = kT_eV(T);
  const EiP = kT * Math.log(NA / j.ni); // Ei - EF deep in p side, eV
  const Eg = SI.Eg;
  const bandLo = -(Eg / 2) - Vbi - 0.15 + EiP, bandHi = EiP + Eg / 2 + 0.15;
  const VbiNow = Vbi * frac * frac;

  const slog = (r: number) => { const n = Math.abs(r) / 1.602176634e-19; return n < 1e13 ? 0 : Math.sign(r) * (Math.log10(n) - 13); };
  const minus = (v: string) => v.replace('-', '−');
  const plots = [
    { key: 'rho', title: 'Charge density ρ(x)/q', unit: 'cm⁻³, log scale', y: linear([-5.4, 5.4], [ph - m.b, m.t]), data: prof.map((p) => slog(p.rho)), color: 'var(--ink)', fill: true, yTicks: [-5, -3, 3, 5], yFmt: (v: number) => (v > 0 ? '+' : '−') + '10' + sup(Math.abs(v) + 13) },
    { key: 'E', title: 'Electric field E(x)', unit: 'kV/cm', y: linear([-Emax * 1.15, Emax * 0.25], [ph - m.b, m.t]), data: prof.map((p) => p.E), color: 'var(--ink)', fill: true, yTicks: undefined, yFmt: (v: number) => minus(String(Number((v / 1000).toPrecision(2)))) },
    { key: 'V', title: 'Potential V(x)', unit: 'V', y: linear([-0.05 * Vbi, Vbi * 1.15], [ph - m.b, m.t]), data: prof.map((p) => p.V), color: 'var(--accent-deep)', fill: false, yTicks: undefined, yFmt: (v: number) => minus(v.toFixed(1)) },
  ];

  return (
    <FigureFrame label="Figure 1.6" title="Two villages that trade until a wall rises">
      <div ref={viewRef} className="px-3 pt-2">
        <canvas ref={canvasRef} className="fig-canvas" role="img" aria-label={`PN junction lattice. ${t === 0 ? 'p and n blocks are apart.' : `Depletion region ${(j.W * 1e4 * frac).toFixed(3)} micrometres wide.`}`} />
      </div>
      <div className="flex flex-wrap items-center gap-2 px-4 pb-3 pt-2">
        <button className={`btn btn-accent ${beacon ? 'beacon' : ''}`} onClick={join} disabled={t > 0 || joining}>Join</button>
        {reduced && <button className="btn" onClick={step} disabled={t >= 1}>Step</button>}
        <button className="btn" onClick={reset} disabled={t === 0 && !joining}>Reset</button>
        <span className="ml-auto text-[12.5px] text-muted">{t === 0 ? 'Apart: no field yet' : t < 1 ? 'Carriers crossing…' : 'Equilibrium'}</span>
      </div>
      <div ref={plotRef} className="grid gap-4 border-t border-line px-2 py-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}>
        {plots.map((p) => {
          const pts = prof.map((s, i) => [xs(s.xu), p.y(p.data[i])] as [number, number]);
          const d = path(pts);
          return (
            <svg key={p.key} viewBox={`0 0 ${pw} ${ph}`} width="100%" height={ph} role="img" aria-label={p.title}>
              <text x={m.l} y={12} className="plot-label" style={{ fontSize: 12, fill: 'var(--ink)', fontWeight: 600 }}>{p.title} <tspan style={{ fill: 'var(--muted)', fontWeight: 400 }}>· {p.unit}</tspan></text>
              <Axes x={xs} y={p.y} yTicks={p.yTicks} yFmt={p.yFmt} xFmt={fmtX} xLabel="x (µm)" zeroY />
              {p.fill && <path d={`${d}L${xs(L)},${p.y(0)}L${xs(-L)},${p.y(0)}Z`} fill={p.key === 'rho' ? 'var(--accent-soft)' : 'var(--accent-tint)'} opacity={0.9} />}
              <path d={d} fill="none" stroke={p.color} strokeWidth={1.8} />
              {p.key === 'rho' && frac > 0 && (<>
                <text x={xs(-j.xp * 1e4 * frac) - 4} y={p.y(slog(-q0(NA))) + 12} textAnchor="end" className="plot-label">−N<tspan dy="3" fontSize="8">A</tspan></text>
                <text x={xs(j.xn * 1e4 * frac) + 4} y={p.y(slog(q0(ND))) - 2} className="plot-label">+N<tspan dy="3" fontSize="8">D</tspan></text>
              </>)}
              {p.key === 'V' && frac > 0 && <text x={pw - m.r} y={p.y(VbiNow) - 6} textAnchor="end" className="plot-label tnum" style={{ fill: 'var(--accent-deep)' }}>{VbiNow.toFixed(3)} V</text>}
            </svg>
          );
        })}
        <BandPlot pw={pw} ph={ph + 20} m={m} xs={xs} prof={prof} EiP={EiP} Eg={Eg} Vbi={Vbi} frac={frac} lo={bandLo} hi={bandHi} />
      </div>
      <div className="grid gap-x-6 gap-y-1 border-t border-line px-4 py-3 sm:grid-cols-3">
        <Slider label={<>Acceptors N<sub>A</sub> (p side)</>} value={la} min={14} max={18} step={0.1} onChange={setLa} display={`${sci(NA, 1)} cm${sup(-3)}`} onTouched={touched} />
        <Slider label={<>Donors N<sub>D</sub> (n side)</>} value={ld} min={14} max={18} step={0.1} onChange={setLd} display={`${sci(ND, 1)} cm${sup(-3)}`} onTouched={touched} />
        <Slider label="Temperature" value={T} min={250} max={400} step={5} onChange={setT} display={`${T} K`} onTouched={touched} />
      </div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto border-t border-line px-4 py-3">
        <span className="shrink-0 self-center text-[12.5px] text-muted">Presets</span>
        {PRESETS.map((p) => (
          <button key={p.label} className="btn btn-sm shrink-0" aria-pressed={la === p.a && ld === p.d} onClick={() => { setLa(p.a); setLd(p.d); touched(); }}>{p.label}</button>
        ))}
      </div>
      <Readouts cols={5} items={[
        { k: <>Built-in V<sub>bi</sub></>, v: `${j.Vbi.toFixed(3)} V` },
        { k: 'Width W', v: `${(j.W * 1e4).toFixed(3)} µm` },
        { k: <>x<sub>p</sub> (into p)</>, v: `${(j.xp * 1e4).toPrecision(3)} µm` },
        { k: <>x<sub>n</sub> (into n)</>, v: `${(j.xn * 1e4).toPrecision(3)} µm` },
        { k: <>Peak field E<sub>max</sub></>, v: `${(j.Emax / 1000).toFixed(1)} kV/cm` },
      ]} />
      <Caption>
        {t < 1 ? 'Readouts show the equilibrium the junction is heading for. ' : ''}
        {ND < NA ? `The n side is lighter, so ${((j.xn / j.W) * 100).toFixed(0)}% of the depletion region sits on the n side.` : ND > NA ? `The p side is lighter, so ${((j.xp / j.W) * 100).toFixed(0)}% of the depletion region sits on the p side.` : 'Equal doping: the depletion region splits evenly.'}
        {' '}n<sub>i</sub> at {T} K = {sci(j.ni, 2)} cm{sup(-3)}.
      </Caption>
    </FigureFrame>
  );
}

const fmtX = (v: number) => String(Number(v.toPrecision(2))).replace('-', '−');
const Sub = ({ c }: { c: string }) => <tspan dy="3" fontSize="8.5">{c}</tspan>;

function q0(N: number) { return 1.602176634e-19 * N; }

function BandPlot({ pw, ph, m, xs, prof, EiP, Eg, Vbi, frac, lo, hi }: {
  pw: number; ph: number; m: { l: number; r: number; t: number; b: number }; xs: ReturnType<typeof linear>;
  prof: { xu: number; V: number }[]; EiP: number; Eg: number; Vbi: number; frac: number; lo: number; hi: number;
}) {
  const y = linear([lo, hi], [ph - m.b, m.t]);
  const Ei = prof.map((p) => EiP - p.V);
  const ec = path(prof.map((p, i) => [xs(p.xu), y(Ei[i] + Eg / 2)]));
  const ev = path(prof.map((p, i) => [xs(p.xu), y(Ei[i] - Eg / 2)]));
  const ei = path(prof.map((p, i) => [xs(p.xu), y(Ei[i])]));
  const EFn = Vbi * (1 - frac * frac); // n-side Fermi level relative to p-side EF (eV): flat at equilibrium
  const x0 = xs.range[0], x1 = xs.range[1], xm = xs(0);
  return (
    <svg viewBox={`0 0 ${pw} ${ph}`} width="100%" height={ph} role="img" aria-label="Energy band diagram">
      <text x={m.l} y={12} className="plot-label" style={{ fontSize: 12, fill: 'var(--ink)', fontWeight: 600 }}>Band diagram <tspan style={{ fill: 'var(--muted)', fontWeight: 400 }}>· energy (eV)</tspan></text>
      <Axes x={xs} y={y} xFmt={fmtX} yFmt={(v) => v.toFixed(1).replace('-', '−')} xLabel="x (µm)" grid={false} />
      <path d={ec} fill="none" stroke="var(--ink)" strokeWidth={2} />
      <path d={ev} fill="none" stroke="var(--ink)" strokeWidth={2} />
      <path d={ei} fill="none" stroke="var(--muted)" strokeWidth={1} strokeDasharray="2 4" />
      <line x1={x0} x2={xm} y1={y(0)} y2={y(0)} stroke="var(--accent-deep)" strokeWidth={1.6} strokeDasharray="6 4" />
      <line x1={xm} x2={x1} y1={y(EFn)} y2={y(EFn)} stroke="var(--accent-deep)" strokeWidth={1.6} strokeDasharray="6 4" />
      <text x={x1 - 2} y={y(Ei[Ei.length - 1] + Eg / 2) - 5} textAnchor="end" className="plot-label">E<Sub c="c" /></text>
      <text x={x1 - 2} y={y(Ei[Ei.length - 1] - Eg / 2) - 5} textAnchor="end" className="plot-label">E<Sub c="v" /></text>
      <text x={x0 + 4} y={y(0) - 5} className="plot-label" style={{ fill: 'var(--accent-deep)' }}>E<Sub c="F" /><tspan dy="-3">{frac >= 1 ? ' flat' : ''}</tspan></text>
      {frac >= 1 && (
        <g>
          <line x1={xs(xs.domain[0] * 0.55)} x2={xs(xs.domain[0] * 0.55)} y1={y(EiP + Eg / 2)} y2={y(EiP + Eg / 2 - Vbi)} stroke="var(--accent)" strokeWidth={1.4} markerEnd="" />
          <text x={xs(xs.domain[0] * 0.55) + 5} y={y(EiP + Eg / 2 - Vbi / 2)} className="plot-label tnum" style={{ fill: 'var(--accent-deep)' }}>qV<Sub c="bi" /><tspan dy="-3"> = {Vbi.toFixed(2)} eV</tspan></text>
        </g>
      )}
    </svg>
  );
}
