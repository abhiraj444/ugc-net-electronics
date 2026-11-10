import { all, create } from 'mathjs';

/**
 * A sandboxed expression evaluator for AI-written plots and numeric checks.
 * Follows the mathjs security guidance: keep compile, then disable import/parse/evaluate/etc.
 * Expressions may not assign or define functions, and only the names we pass are in scope.
 */
const math = create(all, {});
const safeCompile = math.compile;
const blocked = () => { throw new Error('Function disabled'); };
math.import(
  { import: blocked, createUnit: blocked, evaluate: blocked, parse: blocked, simplify: blocked, derivative: blocked, resolve: blocked, compile: blocked, reviver: blocked, chain: blocked },
  { override: true },
);

const ASSIGN = /(^|[^=<>!])=($|[^=])/;
const cache = new Map<string, (scope: Record<string, number>) => number>();

export function compileExpr(expr: string) {
  const hit = cache.get(expr);
  if (hit) return hit;
  if (expr.length > 400) throw new Error('Expression too long');
  if (ASSIGN.test(expr) || /[;"'`]/.test(expr)) throw new Error('Assignments and strings are not allowed');
  const c = safeCompile(expr);
  const fn = (scope: Record<string, number>) => {
    const v = c.evaluate({ ...scope });
    const n = typeof v === 'number' ? v : typeof v === 'boolean' ? Number(v) : Number(v?.valueOf?.());
    return n;
  };
  cache.set(expr, fn);
  return fn;
}

export function evalExpr(expr: string, scope: Record<string, number>) {
  return compileExpr(expr)(scope);
}

/** Pull every number out of a string like "0.77 V" or "2.5 × 10¹⁶ cm⁻³" or "1.2e-3". */
export function numbersIn(s: string): number[] {
  const sup: Record<string, string> = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': '-', '⁺': '' };
  const t = s.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺]+/g, (m) => '^' + m.split('').map((c) => sup[c]).join('')).replace(/−/g, '-').replace(/,(?=\d{3})/g, '');
  const out: number[] = [];
  const re = /(-?\d+(?:\.\d+)?)(?:\s*(?:[x×]|\\times)\s*10\s*\^?\s*\{?(-?\d+)\}?|e(-?\d+))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t))) {
    const base = parseFloat(m[1]);
    const exp = m[2] ?? m[3];
    out.push(exp !== undefined ? base * Math.pow(10, parseInt(exp, 10)) : base);
  }
  return out;
}

export type NumericCheck = { ok: boolean; computed: number; message?: string };

/** Recompute a numerical question; flag if the stated answer or the marked option disagrees by more than 3%. */
export function checkNumeric(n: { formula: string; inputs: Record<string, number>; answer: number; unit?: string }, correctOption?: string): NumericCheck {
  let computed: number;
  try { computed = evalExpr(n.formula, n.inputs); } catch (e) { return { ok: false, computed: NaN, message: `Formula could not be evaluated: ${(e as Error).message}` }; }
  if (!isFinite(computed)) return { ok: false, computed, message: 'Formula gives a non-finite result.' };
  const close = (a: number, b: number) => Math.abs(a - b) <= 0.03 * Math.max(Math.abs(a), Math.abs(b), 1e-300);
  const fmt = (v: number) => (Math.abs(v) >= 1e4 || (Math.abs(v) < 1e-2 && v !== 0) ? v.toExponential(3) : String(Number(v.toPrecision(4))));
  if (!close(computed, n.answer)) return { ok: false, computed, message: `The app computes ${fmt(computed)}${n.unit ? ' ' + n.unit : ''} from the formula, but the stated answer is ${fmt(n.answer)}.` };
  if (correctOption) {
    const nums = numbersIn(correctOption);
    if (nums.length && !nums.some((x) => close(x, computed))) return { ok: false, computed, message: `The marked option (${correctOption}) does not match the computed ${fmt(computed)}${n.unit ? ' ' + n.unit : ''}.` };
  }
  return { ok: true, computed };
}
