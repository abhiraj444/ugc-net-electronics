import type { ReactNode } from 'react';

export type Scale = ((v: number) => number) & { domain: [number, number]; range: [number, number] };

export function linear(domain: [number, number], range: [number, number]): Scale {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const f = ((v: number) => r0 + ((v - d0) / (d1 - d0)) * (r1 - r0)) as Scale;
  f.domain = domain;
  f.range = range;
  return f;
}

export function path(points: (readonly number[])[]) {
  let d = '';
  for (let i = 0; i < points.length; i++) {
    const [x, y] = points[i];
    if (!isFinite(x) || !isFinite(y)) continue;
    d += (d ? 'L' : 'M') + x.toFixed(2) + ',' + y.toFixed(2);
  }
  return d;
}

export function niceTicks(a: number, b: number, count = 5) {
  const span = Math.abs(b - a);
  if (span === 0) return [a];
  const raw = span / count;
  const p = Math.pow(10, Math.floor(Math.log10(raw)));
  const m = raw / p;
  const step = (m >= 5 ? 10 : m >= 2 ? 5 : m >= 1 ? 2 : 1) * p;
  const lo = Math.min(a, b), hi = Math.max(a, b);
  const out: number[] = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + step * 1e-9; v += step) out.push(Math.abs(v) < step * 1e-9 ? 0 : v);
  return out;
}

export const fmtTick = (v: number) => {
  const a = Math.abs(v);
  if (a === 0) return '0';
  if (a >= 1000 || a < 0.01) return v.toExponential(0).replace('e+', 'e').replace('-', '−');
  return String(Number(v.toPrecision(3))).replace('-', '−');
};

/** Axes frame: grid lines, ticks and labels, all in SVG user units. */
export function Axes({
  x, y, xTicks, yTicks, xLabel, yLabel, xFmt = fmtTick, yFmt = fmtTick, grid = true, zeroX = false, zeroY = false,
}: {
  x: Scale; y: Scale; xTicks?: number[]; yTicks?: number[]; xLabel?: ReactNode; yLabel?: ReactNode;
  xFmt?: (v: number) => string; yFmt?: (v: number) => string; grid?: boolean; zeroX?: boolean; zeroY?: boolean;
}) {
  const [x0, x1] = x.range;
  const [y0, y1] = y.range; // y0 bottom, y1 top
  const xt = xTicks ?? niceTicks(x.domain[0], x.domain[1], 4);
  const yt = yTicks ?? niceTicks(y.domain[0], y.domain[1], 4);
  return (
    <g>
      {grid && yt.map((t) => <line key={'gy' + t} x1={x0} x2={x1} y1={y(t)} y2={y(t)} className="plot-grid" strokeWidth={1} />)}
      {grid && xt.map((t) => <line key={'gx' + t} y1={y0} y2={y1} x1={x(t)} x2={x(t)} className="plot-grid" strokeWidth={1} />)}
      <line x1={x0} x2={x1} y1={y0} y2={y0} className="plot-axis" strokeWidth={1} />
      <line x1={x0} x2={x0} y1={y0} y2={y1} className="plot-axis" strokeWidth={1} />
      {zeroY && y.domain[0] < 0 && y.domain[1] > 0 && <line x1={x0} x2={x1} y1={y(0)} y2={y(0)} stroke="var(--muted)" strokeWidth={1} strokeDasharray="3 3" />}
      {zeroX && x.domain[0] < 0 && x.domain[1] > 0 && <line y1={y0} y2={y1} x1={x(0)} x2={x(0)} stroke="var(--muted)" strokeWidth={1} strokeDasharray="3 3" />}
      {xt.map((t) => <text key={'tx' + t} x={x(t)} y={y0 + 14} textAnchor="middle" className="plot-label tnum">{xFmt(t)}</text>)}
      {yt.map((t) => <text key={'ty' + t} x={x0 - 5} y={y(t) + 3.5} textAnchor="end" className="plot-label tnum">{yFmt(t)}</text>)}
      {xLabel && <text x={x1} y={y0 + 28} textAnchor="end" className="plot-label" style={{ fontSize: 11.5 }}>{xLabel}</text>}
      {yLabel && <text x={x0 - 2} y={y1 - 8} textAnchor="start" className="plot-label" style={{ fontSize: 11.5 }}>{yLabel}</text>}
    </g>
  );
}
