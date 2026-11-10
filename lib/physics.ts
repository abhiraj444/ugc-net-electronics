/**
 * Physical constants and semiconductor models used by every figure.
 * Units are stated on every constant. Lengths in device formulas are in cm
 * (the semiconductor convention), unless a name says otherwise.
 */

// ---- Fundamental constants (CODATA 2018 exact / recommended values)
export const q = 1.602176634e-19; // C, elementary charge
export const k = 1.380649e-23; // J/K, Boltzmann constant
export const kEv = 8.617333262e-5; // eV/K, Boltzmann constant in eV
export const h = 6.62607015e-34; // J s, Planck constant
export const hbar = h / (2 * Math.PI); // J s
export const m0 = 9.1093837015e-31; // kg, free-electron mass
export const eps0 = 8.8541878128e-12; // F/m, permittivity of free space
export const eps0cm = eps0 / 100; // F/cm
export const mu0 = 4 * Math.PI * 1e-7; // H/m
export const c = 2.99792458e8; // m/s
export const eta0 = 376.73; // ohm, free-space impedance

// ---- Thermal voltage
/** kT/q in volts. At 300 K this is 25.85 mV (often rounded to 25.9 or 26 mV). */
export const thermalVoltage = (T: number) => (k * T) / q;
/** kT in eV. */
export const kT_eV = (T: number) => kEv * T;

// ---- Silicon (300 K)
export const SI = {
  Eg: 1.12, // eV, band gap at 300 K
  ni300: 1e10, // cm^-3, modern value (Sze 3rd ed. ~9.65e9). Many Indian textbooks use 1.5e10.
  ni300Textbook: 1.5e10, // cm^-3, older textbook value (Streetman / many NET question setters)
  epsR: 11.7, // relative permittivity
  Nc300: 2.8e19, // cm^-3, effective density of states, conduction band
  Nv300: 1.04e19, // cm^-3, effective density of states, valence band
  muN: 1350, // cm^2/V s, electron mobility (lightly doped)
  muP: 480, // cm^2/V s, hole mobility (lightly doped)
  atoms: 5e22, // cm^-3, atomic density
  latticeA: 0.543, // nm, lattice constant
  bond: 0.235, // nm, nearest-neighbour distance
};
export const epsSi = SI.epsR * eps0cm; // F/cm

export type Material = {
  name: string;
  Eg: number; // eV at 300 K
  ni300: number; // cm^-3
  muN: number;
  muP: number;
  bond: number; // nm nearest-neighbour distance
  mEff: number; // electron effective mass / m0 (conductivity / band-edge value)
};

export const MATERIALS: Record<'Si' | 'Ge' | 'GaAs', Material> = {
  Si: { name: 'Silicon', Eg: 1.12, ni300: 1e10, muN: 1350, muP: 480, bond: 0.235, mEff: 0.26 },
  Ge: { name: 'Germanium', Eg: 0.66, ni300: 2.4e13, muN: 3900, muP: 1900, bond: 0.245, mEff: 0.12 },
  GaAs: { name: 'Gallium arsenide', Eg: 1.42, ni300: 2.1e6, muN: 8500, muP: 400, bond: 0.245, mEff: 0.067 },
};

/**
 * Intrinsic carrier concentration vs temperature, scaled from its 300 K value:
 * n_i(T) = n_i(300) (T/300)^{3/2} exp[-(Eg / 2k)(1/T - 1/300)].
 * Holds Eg fixed (ignores the small Varshni shrinkage), which is the usual textbook approximation.
 */
export function niAt(T: number, ni300 = SI.ni300, Eg = SI.Eg) {
  if (T <= 0) return 0;
  return ni300 * Math.pow(T / 300, 1.5) * Math.exp((-Eg / (2 * kEv)) * (1 / T - 1 / 300));
}

/** Effective densities of states scale as T^{3/2}. */
export const NcAt = (T: number) => SI.Nc300 * Math.pow(T / 300, 1.5);
export const NvAt = (T: number) => SI.Nv300 * Math.pow(T / 300, 1.5);

/** Fermi–Dirac occupation probability. E and EF in eV. */
export function fermiDirac(E: number, EF: number, T: number) {
  const x = (E - EF) / kT_eV(T);
  if (x > 700) return 0;
  if (x < -700) return 1;
  return 1 / (1 + Math.exp(x));
}

/**
 * Fermi–Dirac integral of order 1/2, normalised so F(η) → exp(η) for η ≪ 0:
 * F(η) = (2/√π) ∫0^∞ √x / (1 + e^{x-η}) dx.  Numerical (Simpson) integration.
 */
export function fd12(eta: number) {
  if (eta < -30) return Math.exp(eta);
  // substitute x = u^2 to remove the sqrt singularity: integrand becomes 2u^2 / (1 + e^{u^2 - eta})
  const upper = Math.sqrt(Math.max(eta, 0) + 40);
  const N = 400;
  const hStep = upper / N;
  let s = 0;
  for (let i = 0; i <= N; i++) {
    const u = i * hStep;
    const fx = (2 * u * u) / (1 + Math.exp(u * u - eta));
    s += fx * (i === 0 || i === N ? 1 : i % 2 ? 4 : 2);
  }
  return ((s * hStep) / 3) * (2 / Math.sqrt(Math.PI));
}

/** Equilibrium carrier concentrations for net doping (ND - NA), complete ionisation. */
export function carriers(netDoping: number, ni: number) {
  // n - p = Nnet, n p = ni^2  →  n = Nnet/2 + sqrt((Nnet/2)^2 + ni^2)
  const half = netDoping / 2;
  if (netDoping >= 0) {
    const n = half + Math.sqrt(half * half + ni * ni);
    return { n, p: (ni * ni) / n };
  }
  const p = -half + Math.sqrt(half * half + ni * ni);
  return { n: (ni * ni) / p, p };
}

// ---- PN junction (abrupt, depletion approximation). Concentrations in cm^-3.
export type Junction = {
  ni: number;
  Vt: number;
  Vbi: number; // V
  W: number; // cm
  xp: number; // cm, depletion depth into p side
  xn: number; // cm, depletion depth into n side
  Emax: number; // V/cm (magnitude)
};

export function pnJunction(NA: number, ND: number, T = 300, Vapplied = 0, ni300 = SI.ni300): Junction {
  const ni = niAt(T, ni300);
  const Vt = thermalVoltage(T);
  const Vbi = Vt * Math.log((NA * ND) / (ni * ni));
  const Vj = Math.max(Vbi - Vapplied, 1e-6);
  const W = Math.sqrt(((2 * epsSi * Vj) / q) * (1 / NA + 1 / ND));
  const xn = (W * NA) / (NA + ND);
  const xp = (W * ND) / (NA + ND);
  const Emax = (q * ND * xn) / epsSi;
  return { ni, Vt, Vbi, W, xp, xn, Emax };
}

/**
 * Field and potential inside an abrupt junction, x in cm, junction at x = 0, p side x < 0.
 * Potential is referenced to 0 deep in the p side; it rises to Vbi on the n side.
 */
export function junctionProfile(x: number, NA: number, ND: number, j: Junction) {
  const { xp, xn } = j;
  let rho = 0; // C/cm^3
  let E = 0; // V/cm, field points from n to p, i.e. negative x direction; we return magnitude-signed (negative)
  let V = 0;
  const Vtot = (q / (2 * epsSi)) * (NA * xp * xp + ND * xn * xn);
  if (x <= -xp) {
    rho = 0; E = 0; V = 0;
  } else if (x <= 0) {
    rho = -q * NA;
    E = (-q * NA * (x + xp)) / epsSi;
    V = ((q * NA) / (2 * epsSi)) * (x + xp) * (x + xp);
  } else if (x < xn) {
    rho = q * ND;
    E = (-q * ND * (xn - x)) / epsSi;
    V = Vtot - ((q * ND) / (2 * epsSi)) * (xn - x) * (xn - x);
  } else {
    rho = 0; E = 0; V = Vtot;
  }
  return { rho, E, V };
}

// ---- Diode
/** Shockley diode equation. Returns amps. */
export function diodeCurrent(V: number, Is: number, n: number, T: number) {
  return Is * (Math.exp(V / (n * thermalVoltage(T))) - 1);
}

/**
 * Saturation current scaled from its 300 K value: Is ∝ T^3 exp(-Eg / (k T)).
 * This is the standard approximation that gives the familiar ≈ −2 mV/°C drift of a silicon diode's forward voltage.
 */
export function IsAt(T: number, Is300: number, Eg = SI.Eg) {
  return Is300 * Math.pow(T / 300, 3) * Math.exp((-Eg / kEv) * (1 / T - 1 / 300));
}

// ---- Effective mass
/** E in eV for wavevector k in 1/nm, given effective mass ratio. E = ħ²k²/(2 m* m0). */
export function parabolicE(kPerNm: number, mRatio: number) {
  const kSI = kPerNm * 1e9;
  return (hbar * hbar * kSI * kSI) / (2 * mRatio * m0) / q;
}

// ---- Formatting helpers
const SUP: Record<string, string> = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
export function sup(n: number | string) {
  return String(n).split('').map((ch) => SUP[ch] ?? ch).join('');
}
/** 1.23 × 10¹⁷ style. */
export function sci(x: number, digits = 2) {
  if (!isFinite(x)) return '∞';
  if (x === 0) return '0';
  const sign = x < 0 ? '−' : '';
  const ax = Math.abs(x);
  const e = Math.floor(Math.log10(ax));
  if (e >= -2 && e <= 2) return sign + String(Number(ax.toPrecision(digits + 1)));
  const m = ax / Math.pow(10, e);
  const ms = m.toFixed(digits).replace(/\.?0+$/, '');
  return `${sign}${ms === '1' ? '' : ms + ' × '}10${sup(e)}`;
}
/** Engineering format with SI prefix. */
export function eng(x: number, unit: string, digits = 3) {
  if (!isFinite(x)) return '∞ ' + unit;
  if (x === 0) return '0 ' + unit;
  const prefixes: [number, string][] = [
    [1e9, 'G'], [1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'], [1e-6, 'µ'], [1e-9, 'n'], [1e-12, 'p'], [1e-15, 'f'], [1e-18, 'a'],
  ];
  const ax = Math.abs(x);
  for (const [v, p] of prefixes) {
    if (ax >= v * 0.9995) {
      return `${x < 0 ? '−' : ''}${Number((ax / v).toPrecision(digits))} ${p}${unit}`;
    }
  }
  return `${sci(x)} ${unit}`;
}
