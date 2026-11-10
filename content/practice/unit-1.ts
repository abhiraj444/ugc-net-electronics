import type { MCQ } from '@/components/lesson/Interactive';

/**
 * Unit I practice set. Written for this course in UGC NET Paper 2 style.
 * These are PRACTICE questions, not previous-year questions.
 */
export type PracticeQ = MCQ & { lesson: string };

export const UNIT1_PRACTICE: PracticeQ[] = [
  {
    lesson: '1.1', tag: 'Numerical',
    stem: 'Intrinsic silicon at 300 K has n_i = 1 × 10¹⁰ cm⁻³, µ_n = 1350 and µ_p = 480 cm²/V·s. Its conductivity is about:',
    options: ['2.2 × 10⁻⁶ S/cm', '2.9 × 10⁻⁶ S/cm', '1.8 × 10³ S/cm', '3.4 × 10⁵ S/cm'],
    answer: 1,
    why: ['This uses only µ_n.', 'σ = 1.602 × 10⁻¹⁹ × 10¹⁰ × 1830 ≈ 2.93 × 10⁻⁶ S/cm.', 'Forgets the factor q.', 'That is the resistivity in Ω·cm, not the conductivity.'],
  },
  {
    lesson: '1.1',
    stem: 'Pure germanium at 0 K behaves as:',
    options: ['A conductor', 'An insulator', 'A superconductor', 'An n-type semiconductor'],
    answer: 1,
    why: ['No bonds are broken at 0 K, so there are no free carriers.', 'With every bond intact and no thermal energy, there are no carriers at all.', 'Superconductivity is a different phenomenon in metals and some compounds.', 'Pure means undoped; it has no majority carrier type.'],
  },
  {
    lesson: '1.2',
    stem: 'Which semiconductor can absorb light of wavelength 1.3 µm (photon energy ≈ 0.95 eV)?',
    options: ['Silicon (1.12 eV)', 'Gallium arsenide (1.42 eV)', 'Germanium (0.66 eV)', 'Gallium nitride (3.4 eV)'],
    answer: 2,
    why: ['0.95 eV is below silicon’s gap.', '0.95 eV is below GaAs’s gap.', 'Only Ge has a gap below 0.95 eV; its cut-off is about 1.88 µm.', 'GaN only absorbs ultraviolet.'],
  },
  {
    lesson: '1.2',
    stem: 'In a crystal of N atoms, an atomic level that holds 2 electrons per atom forms a band that can hold:',
    options: ['2 electrons', 'N electrons', '2N electrons', 'N² electrons'],
    answer: 2,
    why: ['That is one atom’s level.', 'The band has N levels, but each holds two electrons (spin).', 'N levels × 2 electrons each.', 'The count grows linearly with N.'],
  },
  {
    lesson: '1.3',
    stem: 'For the same wavevector k, an electron with m* = 0.5 m₀ has a kinetic energy that is:',
    options: ['Half that of a free electron', 'Equal to that of a free electron', 'Twice that of a free electron', 'Four times that of a free electron'],
    answer: 2,
    why: ['E = ħ²k²/2m*; a smaller mass gives more energy, not less.', 'Only if m* = m₀.', 'Halving m* doubles E at the same k.', 'E is inversely proportional to m*, not to its square.'],
  },
  {
    lesson: '1.3', tag: 'Numerical',
    stem: 'Electrons in GaAs (m* = 0.067 m₀) and Si (m* = 0.26 m₀) have the same mean time between collisions. The ratio µ_GaAs/µ_Si is about:',
    options: ['0.26', '1', '3.9', '15'],
    answer: 2,
    why: ['Inverted ratio.', 'Mobility depends on m*.', 'µ = qτ/m*, so the ratio is 0.26/0.067 ≈ 3.9.', 'That compares GaAs with a free electron.'],
  },
  {
    lesson: '1.4', tag: 'Numerical',
    stem: 'The probability that a state 2kT below the Fermi level is occupied is about:',
    options: ['0.12', '0.50', '0.88', '0.98'],
    answer: 2,
    why: ['That is the probability it is empty (or the occupancy 2kT above E_F).', 'That is at E = E_F.', 'f = 1/(1 + e⁻²) = 1/1.135 ≈ 0.88.', 'That is about 4kT below E_F.'],
  },
  {
    lesson: '1.4', tag: 'Numerical',
    stem: 'In silicon at 300 K (N_c = 2.8 × 10¹⁹ cm⁻³), E_c − E_F = 0.25 eV. The electron concentration is about:',
    options: ['1.8 × 10¹⁵ cm⁻³', '2.8 × 10¹⁹ cm⁻³', '1.8 × 10¹⁰ cm⁻³', '7.0 × 10¹⁸ cm⁻³'],
    answer: 0,
    why: ['n = 2.8 × 10¹⁹ × e^(−0.25/0.02585) = 2.8 × 10¹⁹ × 6.3 × 10⁻⁵ ≈ 1.8 × 10¹⁵.', 'That is N_c, the value when E_F = E_c.', 'Exponent too large by about 12 kT.', 'This multiplies N_c by 0.25 instead of using the exponential.'],
  },
  {
    lesson: '1.5', tag: 'Numerical',
    stem: 'Silicon is doped with 10¹⁵ cm⁻³ boron (n_i = 10¹⁰ cm⁻³). The electron concentration is:',
    options: ['10¹⁵ cm⁻³', '10¹⁰ cm⁻³', '10⁵ cm⁻³', '10⁻⁵ cm⁻³'],
    answer: 2,
    why: ['That is the hole (majority) concentration.', 'That is n_i; doping changes it.', 'n = n_i²/N_A = 10²⁰/10¹⁵ = 10⁵ cm⁻³.', 'Dividing n_i by N_A is the wrong formula.'],
  },
  {
    lesson: '1.5', tag: 'Numerical',
    stem: 'For N_D = 10¹⁷ cm⁻³ and n_i = 10¹⁰ cm⁻³ at 300 K, E_F − E_i is about:',
    options: ['0.18 eV', '0.42 eV', '0.56 eV', '1.12 eV'],
    answer: 1,
    why: ['Too small: that is about 10¹³ cm⁻³ doping.', 'kT ln(10⁷) = 0.02585 × 16.12 ≈ 0.417 eV.', 'That is half the band gap; E_F would be at E_c.', 'That is the whole band gap.'],
  },
  {
    lesson: '1.5',
    stem: 'A silicon sample has N_D = 5 × 10¹⁶ and N_A = 2 × 10¹⁶ cm⁻³ (n_i = 10¹⁰ cm⁻³). Its hole concentration is about:',
    options: ['2 × 10¹⁶ cm⁻³', '3 × 10¹⁶ cm⁻³', '3.3 × 10³ cm⁻³', '5 × 10³ cm⁻³'],
    answer: 2,
    why: ['Acceptors are compensated; they do not set p directly.', 'That is the electron concentration n = N_D − N_A.', 'p = n_i²/n = 10²⁰/(3 × 10¹⁶) ≈ 3.3 × 10³ cm⁻³.', 'That would need n = 2 × 10¹⁶; compensation leaves n = 3 × 10¹⁶.'],
  },
  {
    lesson: '1.6', tag: 'Numerical',
    stem: 'A symmetric silicon junction has N_A = N_D = 10¹⁶ cm⁻³ at 300 K. With n_i = 1.5 × 10¹⁰ cm⁻³, V_bi is about:',
    options: ['0.59 V', '0.69 V', '0.77 V', '0.95 V'],
    answer: 1,
    why: ['Too small for this doping.', '0.02585 × ln(10³²/2.25 × 10²⁰) = 0.02585 × 26.8 ≈ 0.693 V.', 'That is for 10¹⁷ and 10¹⁶ with n_i = 10¹⁰.', 'Too large; V_bi stays below E_g/q for non-degenerate doping.'],
  },
  {
    lesson: '1.6', tag: 'Numerical',
    stem: 'An abrupt junction with V_bi = 0.7 V has a depletion width of 0.5 µm at zero bias. At a reverse bias of 5.6 V the width is about:',
    options: ['0.5 µm', '1.0 µm', '1.5 µm', '4.5 µm'],
    answer: 2,
    why: ['Reverse bias widens the depletion region.', 'That would need V_bi + V_R = 2.8 V.', 'W ∝ √(V_bi + V_R): √(6.3/0.7) = √9 = 3, so W = 1.5 µm.', 'That would be linear in voltage, which applies to no junction.'],
  },
  {
    lesson: '1.7', tag: 'Numerical',
    stem: 'An ideal diode (n = 1, 300 K) has its forward voltage raised by 120 mV. Its current increases by a factor of about:',
    options: ['2', '10', '100', '1000'],
    answer: 2,
    why: ['Far too small for an exponential.', 'That is 60 mV.', 'e^(0.12/0.02585) = e^4.64 ≈ 104, i.e. two decades.', 'That would need about 180 mV.'],
  },
  {
    lesson: '1.7', tag: 'Numerical',
    stem: 'A silicon diode has a reverse saturation current of 10 nA at 25 °C. Using the rule that it doubles every 10 °C, at 75 °C it is about:',
    options: ['50 nA', '100 nA', '160 nA', '320 nA'],
    answer: 3,
    why: ['That assumes a linear rise.', 'That is 10 nA × 10, not a doubling rule.', 'That is only four doublings.', '50 °C is five doublings: 10 nA × 2⁵ = 320 nA.'],
  },
];
