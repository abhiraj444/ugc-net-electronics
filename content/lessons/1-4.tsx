import { Describe, EquationCard, Example, M, Section, SideNote, TryThis } from '@/components/lesson/Blocks';
import { YourGuess } from '@/components/lesson/Interactive';
import FermiFilling from '@/components/figures/FermiFilling';
import type { LessonContent } from './types';

export const lesson: LessonContent = {
  id: '1-4',
  dek: 'To count carriers you need two things: how many seats each energy offers (the density of states) and the chance each seat is taken (the Fermi–Dirac function). Multiply them and add up. One number, the Fermi level, controls the whole answer.',
  netWeight: 'High',
  buildsOn: ['1-2', '1-3'],
  hook: (
    <>
      <p>Picture a theatre that fills from the front. Near the stage the rows are short; further back they get longer. People arrive and take the best free seats first, so the front fills completely and the back stays mostly empty. Somewhere in the middle is a row where you are as likely to find a person as an empty seat.</p>
      <p>A conduction band is that theatre, with energies instead of rows. The question this lesson answers is the one every exam numerical comes back to: how many electrons are actually sitting in it?</p>
    </>
  ),
  body: (
    <>
      <Section n={1} title="How many seats at each energy?">
        <p>The <strong>density of states</strong>, g(E), counts how many allowed electron states there are per unit energy, per unit volume. Just above the bottom of the conduction band E<sub>c</sub>, it grows like a square root:</p>
        <p className="text-center"><M>{String.raw`g_c(E) \propto (m_n^{*})^{3/2}\sqrt{E - E_c}`}</M></p>
        <p>So right at the band edge there are almost no seats, and the rows get longer as you go up. The valence band is the same picture turned upside down, starting at E<sub>v</sub>. A heavier effective mass (lesson 1.3) means more seats per row.</p>
      </Section>

      <Section n={2} title="Who sits where: the Fermi–Dirac function">
        <p>The probability that a state at energy E is occupied is given by the <strong>Fermi–Dirac function</strong>. It depends on the temperature and on one reference energy, the <strong>Fermi level</strong> E<sub>F</sub>.</p>
        <EquationCard
          title="Fermi–Dirac occupation"
          tex={String.raw`f(E) = \frac{1}{1 + e^{(E - E_F)/kT}}`}
          symbols={[
            { s: 'f(E)', name: 'probability a state at energy E holds an electron', unit: '0 to 1' },
            { s: 'E', name: 'energy of the state', unit: 'eV' },
            { s: 'E_F', name: 'Fermi level', unit: 'eV' },
            { s: 'k', name: 'Boltzmann constant', unit: '8.617 × 10⁻⁵ eV/K' },
            { s: 'T', name: 'absolute temperature', unit: 'K' },
          ]}
          typical={<>kT = 25.85 meV at 300 K. One kT above E<sub>F</sub>: f = 0.27. Three kT above: f = 0.047. Ten kT above: f ≈ 4.5 × 10⁻⁵.</>}
        />
        <YourGuess
          question="At E = E_F exactly, what fraction of states is occupied? Does the answer change if you heat the crystal?"
          answer={<><strong>Exactly one half, at every temperature.</strong> Put E = E<sub>F</sub> in the formula: the exponent is zero, so f = 1/(1 + 1). Heating only makes the step from 1 to 0 more gradual around that halfway point.</>}
        />
      </Section>

      <Section n={3} title="Try it: multiply seats by chance">
        <TryThis>start at <b>Intrinsic</b>. Drag E<sub>F</sub> toward E<sub>c</sub> and watch the blue electron curve swell while the red hole curve shrinks. Keep an eye on n·p. Then change the temperature and see what moves it.</TryThis>
        <FermiFilling />
        <Describe>
          <p><b>What it shows.</b> Three panels share one vertical energy axis, with the valence band edge E<sub>v</sub> at 0 eV and the conduction band edge E<sub>c</sub> at 1.12 eV. Left: the density of states g(E), zero in the gap. Middle: the Fermi–Dirac function f(E), stepping from 1 to 0 around E<sub>F</sub>. Right: their product n(E) = g(E)f(E) (blue) and the hole distribution p(E) = g(E)[1 − f(E)] (red), each magnified by the factor shown so their shape is visible. The dashed line is E<sub>F</sub>; the dotted one is the intrinsic level E<sub>i</sub>.</p>
          <p><b>Controls.</b> E<sub>F</sub> from 0.1 eV below E<sub>v</sub> to 0.1 eV above E<sub>c</sub>, temperature from 100 to 600 K, and presets for intrinsic, n-type and p-type positions.</p>
          <p><b>Where the numbers come from.</b> n = N<sub>c</sub>·F<sub>1/2</sub>((E<sub>F</sub> − E<sub>c</sub>)/kT) and p = N<sub>v</sub>·F<sub>1/2</sub>((E<sub>v</sub> − E<sub>F</sub>)/kT), where F<sub>1/2</sub> is the Fermi–Dirac integral computed numerically, so the readouts stay correct even when E<sub>F</sub> enters a band. N<sub>c</sub> = 2.8 × 10¹⁹ and N<sub>v</sub> = 1.04 × 10¹⁹ cm⁻³ at 300 K, scaled as T<sup>3/2</sup>.</p>
          <p><b>Limits.</b> With these textbook N<sub>c</sub>, N<sub>v</sub> and E<sub>g</sub> = 1.12 eV, the formula gives n<sub>i</sub> ≈ 6.7 × 10⁹ cm⁻³ at 300 K, a little below the measured 1 × 10¹⁰; the published constants are not perfectly self-consistent, and the figure shows the formula’s result honestly. The band gap is held fixed with temperature.</p>
        </Describe>
      </Section>

      <Section n={4} title="Counting carriers without the integral">
        <p>When E<sub>F</sub> is more than about 3kT below E<sub>c</sub>, f(E) in the conduction band is tiny and looks like a plain exponential. Then the whole integral collapses into one neat result. The effective density of states N<sub>c</sub> acts as if every conduction seat were stacked right at E<sub>c</sub>:</p>
        <EquationCard
          title="Electron and hole concentrations (non-degenerate)"
          tex={String.raw`n = N_c\,e^{-(E_c - E_F)/kT},\qquad p = N_v\,e^{-(E_F - E_v)/kT}`}
          symbols={[
            { s: 'n,\\,p', name: 'electron and hole concentrations', unit: 'cm⁻³' },
            { s: 'N_c', name: 'effective density of states, conduction band', unit: '2.8 × 10¹⁹ cm⁻³ (Si, 300 K)' },
            { s: 'N_v', name: 'effective density of states, valence band', unit: '1.04 × 10¹⁹ cm⁻³ (Si, 300 K)' },
            { s: 'E_c,\\,E_v', name: 'conduction and valence band edges', unit: 'eV' },
            { s: 'E_F', name: 'Fermi level', unit: 'eV' },
          ]}
          typical={<>E<sub>F</sub> 0.20 eV below E<sub>c</sub> at 300 K: n = 2.8 × 10¹⁹ × e<sup>−7.74</sup> ≈ <b>1.2 × 10¹⁶ cm⁻³</b>.</>}
        />
        <p>Multiply n by p and E<sub>F</sub> cancels out: <M>{String.raw`np = N_cN_v\,e^{-E_g/kT} = n_i^2`}</M>. Push E<sub>F</sub> up and n rises exactly as fast as p falls. This <strong>law of mass action</strong> is the most used equation in NET semiconductor questions, and lesson 1.5 puts it to work.</p>
      </Section>

      <Section n={5} title="Where does the Fermi level sit in pure silicon?">
        <p>In an intrinsic crystal n = p, which puts E<sub>F</sub> almost exactly in the middle of the gap, at the <strong>intrinsic level</strong> E<sub>i</sub>. It is pulled slightly toward the band with fewer states: <M>{String.raw`E_i = \tfrac{E_c + E_v}{2} + \tfrac{kT}{2}\ln\tfrac{N_v}{N_c}`}</M>, about 13 meV below midgap in silicon at 300 K.</p>
        <SideNote>
          <p>The Fermi level is not a level electrons sit on. In a semiconductor it usually lies in the gap, where there are no states at all. It is better thought of as a water level: it tells you how full everything is, and in equilibrium it is the same everywhere in a connected device.</p>
        </SideNote>
        <Example title="why a hot phone leaks">
          <p>A phone processor running at 85 °C instead of 25 °C has roughly 50 times more intrinsic carriers at its junctions: the Fermi–Dirac tail reaches across the gap far more easily. Junction leakage rises with it, which is one reason phones throttle performance when they heat up during a long video call.</p>
        </Example>
      </Section>
    </>
  ),
  remember: 'Carriers are seats times chance: add up g(E)·f(E), and wherever the Fermi level sits, the product n·p stays equal to nᵢ².',
  quiz: [
    {
      stem: 'At absolute zero, the Fermi–Dirac function is:',
      options: ['A straight line from 1 to 0', 'A sharp step: 1 below E_F, 0 above', 'Equal to ½ everywhere', 'Zero everywhere'],
      answer: 1,
      why: [
        'No temperature gives a straight line.',
        'With kT → 0, every state below E_F is full and every one above is empty.',
        'f = ½ only at E = E_F.',
        'States below E_F are full at 0 K.',
      ],
    },
    {
      stem: 'The density of states just above the conduction band edge grows as:',
      options: ['(E − E_c)²', '√(E − E_c)', 'e^(E − E_c)', 'It is constant'],
      answer: 1,
      why: [
        'Too steep; that is not the 3D result.',
        'For a 3D parabolic band, g(E) ∝ √(E − E_c).',
        'Exponentials come from the occupation, not the seats.',
        'Constant DOS is the 2D (quantum well) case.',
      ],
    },
    {
      stem: 'Moving E_F 0.1 eV closer to E_c at 300 K multiplies n by about:',
      options: ['1.1', '4', '48', '10⁴'],
      answer: 2,
      why: [
        'Far too small for an exponential with kT = 26 meV.',
        'e^1.4 would be 4; check the exponent.',
        'e^(0.1/0.02585) = e^3.87 ≈ 48.',
        'That would need about 0.24 eV.',
      ],
    },
    {
      stem: 'In a non-degenerate semiconductor, raising E_F toward E_c changes the product n·p how?',
      options: ['It rises', 'It falls', 'It stays equal to n_i²', 'It becomes zero'],
      answer: 2,
      why: [
        'n rises but p falls by exactly the same factor.',
        'Same reason.',
        'E_F cancels in N_c N_v e^(−E_g/kT).',
        'Both n and p are positive at any finite temperature.',
      ],
    },
  ],
  net: {
    questions: [
      {
        tag: 'Numerical',
        stem: 'The probability that a state 3kT above the Fermi level is occupied is about:',
        options: ['0.5', '0.27', '0.047', '0.0025'],
        answer: 2,
        why: [
          'That is at E = E_F.',
          'That is at 1kT above E_F.',
          'f = 1/(1 + e³) = 1/21.1 ≈ 0.047.',
          'That is roughly 6kT above E_F.',
        ],
      },
      {
        stem: 'The effective density of states N_c varies with temperature as:',
        options: ['T', 'T^(1/2)', 'T^(3/2)', 'T³'],
        answer: 2,
        why: [
          'Not linear.',
          'Not the square root.',
          'N_c = 2(2πm*kT/h²)^(3/2), so it scales as T^(3/2).',
          'T³ appears in n_i², not in N_c.',
        ],
      },
      {
        stem: 'In intrinsic silicon, the Fermi level lies:',
        options: ['Exactly at midgap', 'Slightly below midgap, because N_v < N_c', 'Slightly above midgap, because N_v < N_c', 'At the conduction band edge'],
        answer: 1,
        why: [
          'Only if N_c = N_v.',
          'E_i = midgap + (kT/2)ln(N_v/N_c); with N_v < N_c the log is negative, so E_i sits about 13 meV below midgap.',
          'The sign is the other way.',
          'That would be a degenerate n-type material.',
        ],
      },
    ],
    traps: [
      <>f(E<sub>F</sub>) = ½ at <b>all</b> temperatures, not just at 0 K.</>,
      <>Probability a state is <b>empty</b> (a hole) is 1 − f(E), not f(E).</>,
      <>The neat formulas n = N<sub>c</sub>e<sup>−(E<sub>c</sub>−E<sub>F</sub>)/kT</sup> fail when E<sub>F</sub> is within about 3kT of a band edge (degenerate doping).</>,
      <>n<sub>i</sub>² ∝ T³e<sup>−E<sub>g</sub>/kT</sup>, so n<sub>i</sub> ∝ T<sup>3/2</sup>e<sup>−E<sub>g</sub>/2kT</sup>. The ½ in the exponent is often dropped in wrong options.</>,
    ],
    formula: String.raw`f(E)=\frac{1}{1+e^{(E-E_F)/kT}},\quad n=N_c e^{-(E_c-E_F)/kT},\quad np=n_i^2`,
    formulaLabel: 'Occupation and carrier counting',
  },
  doneWhen: <>Given E<sub>c</sub> − E<sub>F</sub> and N<sub>c</sub>, you can work out n in under a minute, and explain with the theatre picture why n·p does not depend on where E<sub>F</sub> is.</>,
  upNextTeaser: 'One phosphorus atom per million silicon atoms raises the electron count a millionfold and crushes the holes. Watch the Fermi level slide toward the band edge as you add dopants.',
};
