'use client';
import { useMemo, useState } from 'react';
import type { PlotSpec } from '@/lib/ai/schema';
import { compileExpr } from '@/lib/ai/mathsafe';
import { FigureFrame } from '@/components/lesson/Blocks';
import { Caption, Readouts, Slider, useBeacon, useWidth } from '@/components/ui/controls';
import { Axes, linear, path, niceTicks } from '@/components/ui/plot';
import { mdInline } from './Markdown';

const COLORS = ['var(--accent-deep)', 'var(--electron)', 'var(--hole)', 'var(--muted)'];
const DASH = ['', '6 4', '2 4', '10 4 2 4'];

export function fmtNum(v: number) {
  if (!isFinite(v)) return '–';
  const a = Math.abs(v);
  if (a !== 0 && (a >= 1e5 || a < 1e-3)) {
    const e = Math.floor(Math.log10(a));
    const m = v / Math.pow(10, e);
    return `${Number(m.toPrecision(3))} × 10${String(e).replace(/-/g, '⁻').replace(/\d/g, (d) => '⁰¹²³⁴⁵⁶⁷⁸⁹'[+d])}`;
  }
  return String(Number(v.toPrecision(4))).replace('-', '−');
}

/** Generic plot engine: curves from sandboxed expressions, up to four sliders, live readouts. */
export default function PlotFigure({ spec, title, label }: { spec: PlotSpec; title?: string; label?: string }) {
  const [vals, setVals] = useState<Record<string, number>>(() => Object.fromEntries(spec.sliders.map((s) => [s.name, s.value])));
  const { beacon, touched } = useBeacon();
  const { ref, w } = useWidth<HTMLDivElement>(360);
  const h = Math.min(340, Math.round(w * 0.64));
  const pad = { l: 46, r: 14, t: 18, b: 34 };

  const compiled = useMemo(() => {
    try { return { curves: spec.curves.map((c) => compileExpr(c.expr)), reads: (spec.readouts ?? []).map((r) => compileExpr(r.expr)), err: '' }; }
    catch (e) { return { curves: [], reads: [], err: (e as Error).message }; }
  }, [spec]);

  const data = useMemo(() => {
    const N = 220;
    const xs = Array.from({ length: N }, (_, i) => spec.x.min + ((spec.x.max - spec.x.min) * i) / (N - 1));
    const series = compiled.curves.map((f) => xs.map((x) => { try { return f({ ...vals, [spec.x.name]: x }); } catch { return NaN; } }));
    let lo = spec.y.min, hi = spec.y.max;
    if (lo === undefined || hi === undefined) {
      const all = series.flat().filter((v) => isFinite(v));
      const sorted = [...all].sort((a, b) => a - b);
      // clip the top and bottom 1% so a single blow-up does not flatten the curve
      const qlo = sorted[Math.floor(sorted.length * 0.01)] ?? 0, qhi = sorted[Math.ceil(sorted.length * 0.99) - 1] ?? 1;
      const span = qhi - qlo || Math.abs(qhi) || 1;
      lo = lo ?? qlo - span * 0.06;
      hi = hi ?? qhi + span * 0.06;
    }
    return { xs, series, lo: lo!, hi: hi! };
  }, [compiled, vals, spec]);

  if (compiled.err) return <FigureFrame label={label ?? 'Figure'} title={title ?? 'Plot'}><p className="px-4 py-4 text-[14px] text-[var(--bad)]">This plot has an invalid expression: {compiled.err}</p></FigureFrame>;

  const x = linear([spec.x.min, spec.x.max], [pad.l, w - pad.r]);
  const y = linear([data.lo, data.hi], [h - pad.b, pad.t]);
  const clampY = (v: number) => Math.max(pad.t - 40, Math.min(h - pad.b + 40, y(v)));
  const reads = (spec.readouts ?? []).map((r, i) => { let v = NaN; try { v = compiled.reads[i](vals); } catch { /* shown as dash */ } return { k: r.label, v: `${fmtNum(v)}${r.unit ? ' ' + r.unit : ''}` }; });

  return (
    <FigureFrame label={label ?? 'Figure'} title={title ?? 'Plot'}>
      <div ref={ref} className="px-1 pt-2">
        <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} role="img" aria-label={`${title ?? 'Plot'}: ${spec.y.label} against ${spec.x.label}`} className="block font-ui">
          <defs><clipPath id={`clip-${w}`}><rect x={pad.l} y={pad.t} width={w - pad.l - pad.r} height={h - pad.t - pad.b} /></clipPath></defs>
          <Axes x={x} y={y} xTicks={niceTicks(spec.x.min, spec.x.max, w < 420 ? 4 : 6)} yTicks={niceTicks(data.lo, data.hi, 4)} xLabel={spec.x.label} yLabel={spec.y.label} zeroY />
          <g clipPath={`url(#clip-${w})`}>
            {data.series.map((s, i) => (
              <path key={i} d={path(data.xs.map((xv, j) => [x(xv), clampY(s[j])]))} fill="none" stroke={COLORS[i % 4]} strokeWidth={2.2} strokeDasharray={DASH[i % 4]} strokeLinejoin="round" style={{ transition: 'd 0.3s ease-out' }} />
            ))}
          </g>
        </svg>
        {spec.curves.length > 1 && (
          <ul className="flex flex-wrap gap-x-4 gap-y-1 px-3 pb-2 text-[12.5px] text-muted">
            {spec.curves.map((c, i) => (
              <li key={i} className="flex items-center gap-1.5"><svg width="22" height="8" aria-hidden><line x1="0" x2="22" y1="4" y2="4" stroke={COLORS[i % 4]} strokeWidth="2.2" strokeDasharray={DASH[i % 4]} /></svg>{c.label ?? c.expr}</li>
            ))}
          </ul>
        )}
      </div>
      {reads.length > 0 && <Readouts items={reads} cols={Math.min(4, reads.length)} />}
      {spec.sliders.length > 0 && (
        <div className="grid gap-x-6 gap-y-2 border-t border-line px-4 py-3 sm:grid-cols-2">
          {spec.sliders.map((s, i) => (
            <Slider key={s.name} label={s.label} min={s.min} max={s.max} step={s.step ?? (s.max - s.min) / 100} value={vals[s.name]} beacon={beacon && i === 0}
              onTouched={touched} onChange={(v) => setVals((o) => ({ ...o, [s.name]: v }))} display={`${fmtNum(vals[s.name])}${s.unit ? ' ' + s.unit : ''}`} />
          ))}
        </div>
      )}
      {spec.caption && <Caption>{mdInline(spec.caption)}</Caption>}
    </FigureFrame>
  );
}
