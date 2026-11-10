'use client';
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';

export function Slider({
  label, value, min, max, step = 1, onChange, display, beacon = false, onTouched,
}: {
  label: ReactNode; value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void; display: string; beacon?: boolean; onTouched?: () => void;
}) {
  const id = useId();
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <div className={`min-w-0 rounded-xl ${beacon ? 'beacon' : ''}`}>
      <div className="flex items-baseline justify-between gap-3 px-0.5">
        <label htmlFor={id} className="min-w-0 text-[13.5px] leading-snug text-muted">{label}</label>
        <output htmlFor={id} className="readout shrink-0 whitespace-nowrap text-[15px] font-semibold">{display}</output>
      </div>
      <input
        id={id}
        type="range"
        className="slider"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{ ['--fill' as string]: `${fill}%` }}
        aria-valuetext={display}
        onChange={(e) => { onChange(parseFloat(e.target.value)); onTouched?.(); }}
      />
    </div>
  );
}

export function Segmented<T extends string>({ options, value, onChange, label }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  return (
    <div className="flex min-w-0 flex-wrap gap-1.5" role="group" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} className="btn btn-sm" aria-pressed={value === o.value} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

export function Readouts({ items, cols = 4 }: { items: { k: ReactNode; v: ReactNode }[]; cols?: number }) {
  return (
    <div className="readout-grid" style={{ ['--cols' as string]: cols }} aria-live="polite">
      {items.map((it, i) => (
        <div key={i} className="readout-cell"><span className="k">{it.k}</span><span className="v">{it.v}</span></div>
      ))}
    </div>
  );
}

export function Controls({ children }: { children: ReactNode }) {
  return <div className="grid gap-x-6 gap-y-2 border-t border-line px-4 py-3 sm:grid-cols-2">{children}</div>;
}

export function Caption({ children }: { children: ReactNode }) {
  return <p className="border-t border-line px-4 py-2.5 text-[13.5px] leading-snug text-muted" aria-live="polite">{children}</p>;
}

export function useReducedMotion() {
  const [r, setR] = useState(false);
  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    setR(m.matches);
    const on = () => setR(m.matches);
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, []);
  return r;
}

/** Beacon stays on until the learner touches the control. */
export function useBeacon() {
  const [on, setOn] = useState(true);
  return { beacon: on, touched: useCallback(() => setOn(false), []) };
}

/** Canvas sized to its container width and the device pixel ratio. Calls draw on every resize. */
export function useCanvas(aspect: number, draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void, maxH = 9999) {
  const ref = useRef<HTMLCanvasElement>(null);
  const size = useRef({ w: 0, h: 0 });
  const drawRef = useRef(draw);
  drawRef.current = draw;
  const redraw = useCallback(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const { w, h } = size.current;
    if (w < 60 || h < 30) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);
    drawRef.current(ctx, w, h);
  }, []);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ro = new ResizeObserver(() => {
      const w = cv.parentElement!.clientWidth;
      const h = Math.min(Math.round(w / aspect), maxH);
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      cv.width = Math.round(w * dpr);
      cv.height = Math.round(h * dpr);
      cv.style.height = `${h}px`;
      size.current = { w, h };
      redraw();
    });
    ro.observe(cv.parentElement!);
    return () => ro.disconnect();
  }, [aspect, maxH, redraw]);
  return { ref, redraw, size };
}

/** Read CSS custom properties (so canvas colours follow the theme). */
export function cssVar(name: string, el: Element = document.documentElement) {
  return getComputedStyle(el).getPropertyValue(name).trim() || '#888';
}

/** Re-render when the theme attribute changes. */
export function useThemeTick() {
  const [t, setT] = useState(0);
  useEffect(() => {
    const mo = new MutationObserver(() => setT((x) => x + 1));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  }, []);
  return t;
}

/** Width of an element, for SVG figures whose viewBox should match real pixels (so labels never scale up or down). */
export function useWidth<T extends HTMLElement>(fallback = 360) {
  const ref = useRef<T>(null);
  const [w, setW] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(Math.max(280, Math.round(el.clientWidth))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, w };
}

/** Small deterministic RNG so particle layouts are stable between renders. */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** requestAnimationFrame loop that runs only while `running` is true. */
export function useRaf(running: boolean, tick: (dt: number) => void) {
  const tickRef = useRef(tick);
  tickRef.current = tick;
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      tickRef.current(dt);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running]);
}

/** True while the element is on screen (pause animations off-screen to save battery). */
export function useInView<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return { ref, inView };
}

let fontFamilyCache = '';
/** Canvas can't read CSS variables in `font`, so resolve the body font once. */
export function uiFont(weight: number, size: number) {
  if (!fontFamilyCache && typeof document !== 'undefined') fontFamilyCache = getComputedStyle(document.body).fontFamily || 'system-ui, sans-serif';
  return `${weight} ${size}px ${fontFamilyCache}`;
}

/** Fill with a colour at an opacity, without relying on color-mix() inside canvas. */
export function fillAlpha(ctx: CanvasRenderingContext2D, color: string, alpha: number, fn: () => void) {
  const a = ctx.globalAlpha;
  ctx.globalAlpha = a * alpha;
  ctx.fillStyle = color;
  fn();
  ctx.globalAlpha = a;
}
