'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { MATERIALS, niAt, q, sci, sup } from '@/lib/physics';
import { FigureFrame } from '../lesson/Blocks';
import { Caption, Readouts, Slider, cssVar, fillAlpha, rng, uiFont, useBeacon, useCanvas, useInView, useRaf, useReducedMotion, useThemeTick } from '../ui/controls';

type Mat = keyof typeof MATERIALS;
type Pair = { ex: number; ey: number; hx: number; hy: number; vx: number; vy: number; born: number; dying: number };

const COLS = 9, ROWS = 5;
const HOPS = [[0.5, 0.5], [0.5, -0.5], [-0.5, 0.5], [-0.5, -0.5], [1, 0], [-1, 0], [0, 1], [0, -1]];

/** Visible pairs grow with log10(n_i): honest about being a log picture of a huge range. */
function visiblePairs(ni: number) {
  if (ni < 1) return 0;
  return Math.max(0, Math.min(26, Math.round((Math.log10(ni) - 6) * 2)));
}

export default function ThermalLattice() {
  const [T, setT] = useState(300);
  const [mat, setMat] = useState<Mat>('Si');
  const M = MATERIALS[mat];
  const ni = niAt(T, M.ni300, M.Eg);
  const target = visiblePairs(ni);
  const reduced = useReducedMotion();
  const { beacon, touched } = useBeacon();
  const theme = useThemeTick();
  const { ref: viewRef, inView } = useInView<HTMLDivElement>();
  const pairs = useRef<Pair[]>([]);
  const R = useMemo(() => rng(11), []);
  const clock = useRef(0);

  const spawn = () => {
    // break a random bond between neighbouring lattice sites
    const c = Math.floor(R() * (COLS - 1)), r = Math.floor(R() * ROWS);
    const horiz = R() < 0.5 || r === ROWS - 1;
    const bx = horiz ? c + 0.5 : c, by = horiz ? r : r + 0.5;
    const ang = R() * Math.PI * 2;
    pairs.current.push({ ex: bx, ey: by, hx: bx, hy: by, vx: Math.cos(ang), vy: Math.sin(ang), born: clock.current, dying: -1 });
  };

  const sync = (instant: boolean) => {
    const live = pairs.current.filter((p) => p.dying < 0);
    if (live.length < target) {
      const add = instant ? target - live.length : 1;
      for (let i = 0; i < add; i++) spawn();
    } else if (live.length > target) {
      const kill = instant ? live.length - target : 1;
      for (let i = 0; i < kill; i++) live[i].dying = clock.current;
    }
    if (instant) pairs.current = pairs.current.filter((p) => p.dying < 0);
  };

  const step = (dt: number) => {
    clock.current += dt;
    const speed = 0.9 * Math.sqrt(T / 300);
    for (const p of pairs.current) {
      // electron: fast random walk through the crystal; hole: slower hops between bonds
      p.vx += (R() - 0.5) * 2.4 * dt * 6; p.vy += (R() - 0.5) * 2.4 * dt * 6;
      const n = Math.hypot(p.vx, p.vy) || 1; p.vx /= n; p.vy /= n;
      p.ex += p.vx * speed * dt; p.ey += p.vy * speed * dt;
      if (p.ex < -0.3 || p.ex > COLS - 0.7) p.vx *= -1;
      if (p.ey < -0.3 || p.ey > ROWS - 0.7) p.vy *= -1;
      p.ex = Math.min(COLS - 0.7, Math.max(-0.3, p.ex)); p.ey = Math.min(ROWS - 0.7, Math.max(-0.3, p.ey));
      if (R() < dt * 0.9 * speed) {
        const [dx, dy] = HOPS[Math.floor(R() * HOPS.length)];
        const nhx = p.hx + dx, nhy = p.hy + dy;
        if (nhx >= 0 && nhx <= COLS - 1 && nhy >= 0 && nhy <= ROWS - 1 && (Number.isInteger(nhx) !== Number.isInteger(nhy))) { p.hx = nhx; p.hy = nhy; }
      }
    }
    pairs.current = pairs.current.filter((p) => p.dying < 0 || clock.current - p.dying < 0.6);
  };

  const accRef = useRef(0);
  useRaf(inView && !reduced, (dt) => {
    step(dt);
    accRef.current += dt;
    if (accRef.current > 0.12) { accRef.current = 0; sync(false); }
    draw();
  });

  useEffect(() => { if (reduced) { sync(true); draw(); } }, [target, reduced]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { sync(true); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { ref, redraw: draw } = useCanvas(1.75, (ctx, w, h) => {
    const el = ref.current!;
    const ink = cssVar('--ink', el), muted = cssVar('--muted', el), line = cssVar('--line-strong', el);
    const eC = cssVar('--electron', el), hC = cssVar('--hole', el), card = cssVar('--card', el);
    const padX = 26, padY = 22;
    const sx = (w - 2 * padX) / (COLS - 1), sy = (h - 2 * padY) / (ROWS - 1);
    const X = (c: number) => padX + c * sx, Y = (r: number) => padY + r * sy;
    const broken = new Set(pairs.current.filter((p) => p.dying < 0).map((p) => `${p.hx},${p.hy}`));
    // bonds: two thin lines = a shared electron pair
    ctx.strokeStyle = line; ctx.lineWidth = 1.2;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      for (const [dc, dr] of [[1, 0], [0, 1]]) {
        if (c + dc >= COLS || r + dr >= ROWS) continue;
        const key = `${c + dc / 2},${r + dr / 2}`;
        const x1 = X(c), y1 = Y(r), x2 = X(c + dc), y2 = Y(r + dr);
        const ox = dr * 3, oy = dc * 3;
        if (broken.has(key)) {
          ctx.setLineDash([2, 3]);
          ctx.beginPath(); ctx.moveTo(x1 + ox, y1 + oy); ctx.lineTo(x2 + ox, y2 + oy); ctx.stroke();
          ctx.setLineDash([]);
          ctx.beginPath(); ctx.moveTo(x1 - ox, y1 - oy); ctx.lineTo(x2 - ox, y2 - oy); ctx.stroke();
        } else {
          ctx.beginPath(); ctx.moveTo(x1 + ox, y1 + oy); ctx.lineTo(x2 + ox, y2 + oy); ctx.moveTo(x1 - ox, y1 - oy); ctx.lineTo(x2 - ox, y2 - oy); ctx.stroke();
        }
      }
    }
    // atoms
    const rad = Math.max(3, Math.min(13, sx * 0.3));
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      ctx.beginPath(); ctx.arc(X(c), Y(r), rad, 0, Math.PI * 2);
      ctx.fillStyle = card; ctx.fill(); ctx.strokeStyle = muted; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = muted; ctx.font = uiFont(500, Math.max(8, rad * 0.7)); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(mat === 'GaAs' ? ((r + c) % 2 ? 'As' : 'Ga') : mat, X(c), Y(r) + 0.5);
    }
    ctx.textBaseline = 'alphabetic';
    // carriers
    for (const p of pairs.current) {
      const age = clock.current - p.born;
      const a = p.dying >= 0 ? Math.max(0, 1 - (clock.current - p.dying) / 0.6) : Math.min(1, age / 0.3 + (reduced ? 1 : 0));
      ctx.globalAlpha = a;
      ctx.beginPath(); ctx.arc(X(p.hx), Y(p.hy), 5, 0, Math.PI * 2); ctx.strokeStyle = hC; ctx.lineWidth = 1.8; ctx.stroke();
      ctx.beginPath(); ctx.arc(X(p.ex), Y(p.ey), 4.4, 0, Math.PI * 2); ctx.fillStyle = eC; ctx.fill();
      ctx.globalAlpha = 1;
    }
    // temperature tint
    fillAlpha(ctx, hC, Math.min(0.06, (T / 600) * 0.06), () => ctx.fillRect(0, 0, w, h));
    ctx.fillStyle = ink; ctx.font = uiFont(600, 11); ctx.textAlign = 'left';
    ctx.fillText(`${T} K`, 8, h - 6);
  }, 260);

  useEffect(() => { draw(); }, [draw, theme, mat, T]);

  const sigma = q * ni * (M.muN + M.muP);
  const brokenFrac = ni / 5e22;
  return (
    <FigureFrame label="Figure 1.1" title="A crowded car park on a hot day">
      <div ref={viewRef} className="px-3 pt-2">
        <canvas ref={ref} className="fig-canvas" role="img" aria-label={`${M.name} lattice at ${T} kelvin with ${target} electron-hole pairs drawn.`} />
        <div className="flex flex-wrap gap-x-4 gap-y-1 px-1 pb-1 pt-2 text-[12.5px] text-muted">
          <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--electron)]" /> free electron</span>
          <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-2.5 rounded-full border-2 border-[var(--hole)]" /> hole (missing bond electron)</span>
          <span>dashed = broken bond</span>
        </div>
      </div>
      <div className="grid gap-x-6 gap-y-2 border-t border-line px-4 py-3 sm:grid-cols-[2fr_1fr]">
        <Slider label="Temperature" value={T} min={0} max={600} step={10} onChange={setT} display={`${T} K (${T - 273} °C)`} beacon={beacon} onTouched={touched} />
        <div>
          <div className="mb-1.5 text-[13.5px] text-muted">Material</div>
          <div className="flex gap-1.5" role="group" aria-label="Material">
            {(Object.keys(MATERIALS) as Mat[]).map((k) => (
              <button key={k} className="btn btn-sm flex-1" aria-pressed={mat === k} onClick={() => { setMat(k); touched(); }}>{k}</button>
            ))}
          </div>
        </div>
      </div>
      {reduced && (
        <div className="flex gap-2 border-t border-line px-4 py-3">
          <button className="btn btn-sm" onClick={() => { for (let i = 0; i < 6; i++) step(0.1); draw(); }}>Step the carriers</button>
        </div>
      )}
      <Readouts items={[
        { k: <>Carriers n<sub>i</sub></>, v: `${sci(ni, 2)} cm${sup(-3)}` },
        { k: 'Bonds broken', v: brokenFrac > 0 ? `1 in ${sci(1 / brokenFrac, 1)}` : 'none' },
        { k: 'Conductivity σ', v: `${sci(sigma, 2)} S/cm` },
        { k: 'Resistivity ρ', v: sigma > 0 ? `${sci(1 / sigma, 2)} Ω·cm` : '∞' },
      ]} />
      <Caption>
        {T === 0 ? 'At absolute zero every bond is intact: a perfect insulator.' : <>Every 2 extra pairs on screen stand for a tenfold rise in n<sub>i</sub>. Copper, for comparison, has about 8.5 × 10²² free electrons per cm³ and ρ ≈ 1.7 × 10⁻⁶ Ω·cm.</>}
      </Caption>
    </FigureFrame>
  );
}
