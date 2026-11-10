import { Describe, EquationCard, Example, M, Section, SideNote, TryThis } from '@/components/lesson/Blocks';
import { YourGuess } from '@/components/lesson/Interactive';
import EffectiveMass from '@/components/figures/EffectiveMass';
import type { LessonContent } from './types';

export const lesson: LessonContent = {
  id: '1-3',
  dek: 'Inside a crystal an electron is pushed by your field and by the lattice at the same time. Rather than track the lattice, we fold its effect into a single number, the effective mass, and Newton’s second law works again. In GaAs that mass is only 7% of a free electron’s.',
  netWeight: 'Medium',
  buildsOn: ['1-2'],
  hook: (
    <>
      <p>Try running in a swimming pool. Your legs push just as hard as on land, but the water pushes back, and you move as if you were much heavier. Now picture the opposite: a moving walkway at an airport. The same stride carries you further, as if you had become lighter.</p>
      <p>An electron inside a crystal is in one of these situations all the time. The lattice of atoms around it is always pushing too. Physicists refuse to give up on <em>F = ma</em>, so they ask a practical question: what mass would make the electron’s motion come out right if we ignored the lattice?</p>
    </>
  ),
  body: (
    <>
      <Section n={1} title="Energy against wavevector: the electron's own graph">
        <p>A free electron is a wave with a <strong>wavevector</strong> k, which is its momentum divided by ħ. Its energy is pure kinetic energy, E = ħ²k²/2m₀. Plot E against k and you get a parabola.</p>
        <p>The shape of that parabola encodes the mass. A heavy particle gains little energy for each step in k: a wide, flat parabola. A light particle gains a lot: a narrow, steep one.</p>
      </Section>

      <Section n={2} title="Inside the crystal, the parabola changes shape">
        <p>The bands from lesson 1.2 have their own E–k curves. Near the bottom of the conduction band, the curve is still very nearly a parabola, but with a different curvature from the free-electron one. Whatever mass would produce that curvature is the <strong>effective mass</strong>, m*.</p>
        <p>In other words: measure how sharply the band bends at its bottom, and you have measured how the electron will accelerate in a field. Sharper bend, lighter electron.</p>
        <EquationCard
          title="Effective mass from band curvature"
          tex={String.raw`m^{*} = \frac{\hbar^{2}}{\;d^{2}E/dk^{2}\;}`}
          symbols={[
            { s: 'm^{*}', name: 'effective mass of the carrier', unit: 'kg, usually quoted as a multiple of m₀' },
            { s: '\\hbar', name: 'reduced Planck constant', unit: '1.055 × 10⁻³⁴ J·s' },
            { s: 'E', name: 'electron energy in the band', unit: 'J (or eV)' },
            { s: 'k', name: 'wavevector', unit: 'm⁻¹' },
            { s: 'm_0', name: 'free-electron mass', unit: '9.109 × 10⁻³¹ kg' },
          ]}
          typical={<>Free electron: d²E/dk² = ħ²/m₀ ≈ 0.076 eV·nm². Conduction-band m*/m₀: GaAs 0.067, Ge 0.12 (conductivity), Si 0.26 (conductivity mass). Holes: Si about 0.39 (conductivity).</>}
        />
      </Section>

      <Section n={3} title="Try it: race a crystal electron against a free one">
        <YourGuess
          question="Push a free electron and a GaAs electron with the same electric field for the same time. Which one gains more wavevector k?"
          answer={<>Neither: <strong>they gain exactly the same k</strong>, because ħ·dk/dt = qE does not involve the mass at all. The difference shows up in the speed. The GaAs electron turns that k into v = ħk/m*, about 15 times faster than the free electron.</>}
        />
        <TryThis>pick GaAs, press <b>Push with the field</b>, and watch both dots climb their parabolas and race down the lanes. Then pick Free electron and run it again. Finally drag m* above 1 to see an electron that is heavier than free.</TryThis>
        <EffectiveMass />
        <Describe>
          <p><b>What it shows.</b> Top: energy against wavevector. The dashed parabola is a free electron; the solid one is a crystal electron with the effective mass you set. During a run, both dots move to the same k, on their own curves. Below: a race over 1 picosecond in the field you set, showing the distance each covers.</p>
          <p><b>Controls.</b> Effective mass m*/m₀ from 0.045 to 2 (log slider), field strength from 0.1 to 5 kV/cm, presets for free electron, Si, Ge and GaAs, and Push / Reset. With reduced motion, Push advances the race in 0.25 ps steps.</p>
          <p><b>Where the numbers come from.</b> E = ħ²k²/(2m*), k(t) = qEt/ħ, a = qE/m*, x = ½at², v = ħk/m*, with CODATA constants.</p>
          <p><b>Limits.</b> Real electrons collide with lattice vibrations and impurities about every 0.1 to 0.3 ps, so they never accelerate freely for a whole picosecond: they settle into an average drift velocity instead (that is what mobility, in section 04, describes). The parabola also only holds near the band edge, and silicon’s conduction band has different masses in different directions (0.98 and 0.19 m₀); the 0.26 here is the conductivity average.</p>
        </Describe>
      </Section>

      <Section n={4} title="Why a lighter electron makes a faster chip">
        <p>Between collisions an electron accelerates as qE/m*. So for the same time between collisions τ, a lighter electron picks up more speed. That is captured by the <strong>mobility</strong>, the drift speed per unit field:</p>
        <p className="text-center"><M>{String.raw`\mu = \frac{q\,\tau}{m^{*}}`}</M></p>
        <p>GaAs electrons have mobility around 8500 cm²/V·s against silicon’s 1350, largely because of that 0.067 effective mass. Higher mobility means faster transistors and less loss at high frequency.</p>
        <Example title="the radio chip in a 5G phone">
          <p>The power amplifier that pushes your phone’s signal to a Jio or Airtel tower is very often a GaAs or GaN transistor, not silicon. At gigahertz frequencies, light electrons that respond quickly are worth the extra cost of the material.</p>
        </Example>
        <SideNote>
          <p>Nothing about the electron itself changes inside a crystal. Its true mass is still 9.11 × 10⁻³¹ kg. The effective mass is bookkeeping: it hides the force of the lattice inside the mass so you only have to write the force of your field.</p>
        </SideNote>
      </Section>

      <Section n={5} title="Near the top of a band, the mass turns negative">
        <p>At the top of the valence band the E–k curve bends downward, so d²E/dk² is negative and so is m*. An electron there accelerates <em>against</em> the push of the field. Rather than juggle negative masses, we describe the missing electron at the top of the band as a <strong>hole</strong> with positive charge and positive mass. Same physics, friendlier numbers.</p>
        <p>That is why holes in silicon have their own effective masses, and why holes are slower: their bands are flatter, so they are heavier.</p>
      </Section>
    </>
  ),
  remember: 'Effective mass is set by the curvature of the band, m* = ħ²/(d²E/dk²): a sharply curved band means a light, fast carrier, which is why GaAs electrons (0.067 m₀) are so quick.',
  quiz: [
    {
      stem: 'Band A has twice the curvature d²E/dk² of band B at its minimum. Compared with band B, electrons in band A have:',
      options: ['Twice the effective mass', 'Half the effective mass', 'The same effective mass', 'Four times the effective mass'],
      answer: 1,
      why: [
        'More curvature means lighter, not heavier.',
        'm* = ħ²/(d²E/dk²): doubling the curvature halves m*.',
        'Effective mass depends directly on the curvature.',
        'The relation is inverse and linear, not squared.',
      ],
    },
    {
      stem: 'In the same field, a free electron and a GaAs conduction electron start from rest. After the same short time:',
      options: ['The GaAs electron has a larger k', 'Both have the same k, but the GaAs electron is moving faster', 'Both have the same speed', 'The free electron is faster because it has no lattice to fight'],
      answer: 1,
      why: [
        'ħ·dk/dt = qE is independent of mass.',
        'Same k, but v = ħk/m* and m* = 0.067 m₀, so the GaAs electron is about 15× faster.',
        'Speed depends on m*.',
        'The lattice actually helps here: the effective mass is smaller than m₀.',
      ],
    },
    {
      stem: 'Why is the effective mass of an electron near the top of the valence band negative?',
      options: ['The electron has negative charge', 'The E–k curve bends downward there, so d²E/dk² < 0', 'Holes have negative mass', 'Its true mass becomes negative in the lattice'],
      answer: 1,
      why: [
        'Charge sign and mass sign are separate things.',
        'A downward-curving band gives negative curvature, so m* = ħ²/(d²E/dk²) is negative.',
        'Holes are defined precisely to have positive mass.',
        'The true mass never changes; m* is bookkeeping.',
      ],
    },
    {
      stem: 'Mobility µ = qτ/m*. Which change would most increase electron mobility?',
      options: ['A material with a larger effective mass', 'A material with a smaller effective mass and longer time between collisions', 'Heavier doping', 'A higher temperature'],
      answer: 1,
      why: [
        'Larger m* lowers mobility.',
        'Both a smaller m* and a longer τ raise µ.',
        'More dopant ions scatter carriers more, shortening τ.',
        'More lattice vibration shortens τ, so mobility usually falls with temperature.',
      ],
    },
  ],
  net: {
    questions: [
      {
        tag: 'Numerical',
        stem: 'Near a band minimum E = Ak² with A = 0.38 eV·nm² (five times the free-electron value ħ²/2m₀ ≈ 0.076 eV·nm²). The effective mass is about:',
        options: ['5 m₀', '0.2 m₀', '0.38 m₀', '2.6 m₀'],
        answer: 1,
        why: [
          'More curvature means less mass, not more.',
          'm* = ħ²/(2A); A is five times the free value, so m* = m₀/5 = 0.2 m₀.',
          'That treats A itself as the mass ratio.',
          'This mixes up the numbers; the ratio of curvatures is all you need.',
        ],
      },
      {
        stem: 'The effective mass of a carrier is inversely proportional to:',
        options: ['The slope dE/dk of the E–k curve', 'The curvature d²E/dk² of the E–k curve', 'The band gap', 'The lattice constant'],
        answer: 1,
        why: [
          'The slope gives the group velocity, v = (1/ħ)dE/dk.',
          'm* = ħ²/(d²E/dk²).',
          'Band gap and mass are related in some materials (k·p theory) but not by definition.',
          'Not by definition.',
        ],
      },
      {
        stem: 'Electrons in GaAs have higher mobility than in Si mainly because:',
        options: ['GaAs has a larger band gap', 'Electron effective mass in GaAs is much smaller', 'GaAs has more free electrons', 'GaAs is a direct-gap material'],
        answer: 1,
        why: [
          'The gap affects carrier count and optics, not mobility directly.',
          'm* ≈ 0.067 m₀ in GaAs vs about 0.26 m₀ in Si; µ = qτ/m*.',
          'Carrier count affects conductivity, not mobility.',
          'Direct gap matters for light emission, not mobility.',
        ],
      },
    ],
    traps: [
      <>Slope dE/dk gives <b>velocity</b>; curvature d²E/dk² gives <b>mass</b>. Questions swap them.</>,
      <>Silicon’s electron mass is anisotropic: longitudinal 0.98 m₀, transverse 0.19 m₀. Conductivity mass ≈ 0.26 m₀; density-of-states mass ≈ 1.08 m₀. Read which one is asked.</>,
      <>Group velocity v = (1/ħ)(dE/dk) is <b>zero</b> at the band minimum and maximum.</>,
    ],
    formula: String.raw`m^{*} = \frac{\hbar^2}{d^2E/dk^2},\qquad v_g = \frac{1}{\hbar}\frac{dE}{dk},\qquad \mu = \frac{q\tau}{m^{*}}`,
    formulaLabel: 'Effective mass, group velocity, mobility',
  },
  doneWhen: <>Shown two E–k parabolas, you can say which carrier is lighter and faster, and explain why a field gives both the same k but different speeds.</>,
  upNextTeaser: 'Bands give electrons seats; temperature decides who sits where. Multiply the two and you can count carriers exactly, with one level, the Fermi level, doing all the bookkeeping.',
};
