import { Describe, EquationCard, Example, M, Section, SideNote, TryThis } from '@/components/lesson/Blocks';
import { YourGuess } from '@/components/lesson/Interactive';
import ThermalLattice from '@/components/figures/ThermalLattice';
import type { LessonContent } from './types';

export const lesson: LessonContent = {
  id: '1-1',
  dek: 'A semiconductor is an insulator at absolute zero and a poor conductor at room temperature, and you can change which by heating it, lighting it or adding a pinch of impurity. That adjustability is why every chip in your phone is made of one.',
  netWeight: 'Medium',
  buildsOn: [],
  hook: (
    <>
      <p>Think of a car park at night where every car is parked nose to tail and nothing can move. That is a perfect crystal at absolute zero: every electron is locked into a bond between two atoms, and no current can flow however hard you push.</p>
      <p>Now let the morning sun warm the tarmac. Every so often a driver gives up waiting and pulls out. The car that left can now drive around freely, and the empty slot it left behind lets the car next to it shuffle over, and then the next one. Two kinds of movement from one departure. Silicon at room temperature is that car park, just after sunrise.</p>
    </>
  ),
  body: (
    <>
      <Section n={1} title="Why isn't everything either a wire or an insulator?">
        <p>Copper conducts so well because every copper atom gives one electron to a shared sea that is free to move. Glass barely conducts because every electron is held tightly in place. These two ends of the scale are separated by a factor of about 10²⁰ in resistivity.</p>
        <p>A <strong>semiconductor</strong> sits in between, and, more importantly, its conductivity can be changed by enormous factors on purpose. Pure silicon at room temperature has a resistivity of a few hundred thousand Ω·cm. Add one phosphorus atom for every million silicon atoms and it drops to a fraction of an ohm-centimetre.</p>
        <p>That is the whole game of electronics: a material you can switch between “barely conducts” and “conducts well” using heat, light, impurities or an electric field.</p>
      </Section>

      <Section n={2} title="Bonds that hold electrons in place">
        <p>Silicon has four outer electrons. In a crystal, each atom shares one electron with each of its four neighbours, so every atom sees a full set of eight. Each shared pair is a <strong>covalent bond</strong>: two electrons that belong to two atoms at once.</p>
        <p>At absolute zero all of these bonds are intact. There are no free electrons, so silicon is a perfect insulator. To free an electron you have to give it at least 1.12 eV of energy, the amount needed to pull it out of its bond. That number is silicon’s <strong>band gap</strong>, and you will meet it in every lesson of this unit.</p>
      </Section>

      <Section n={3} title="Try it: heat the crystal">
        <YourGuess
          question="Heat silicon from 300 K to 400 K, from room temperature to a little hotter than boiling water. How much do its free carriers increase: by about 30%, about 3 times, or about 300 times?"
          answer={<>About <strong>350 times</strong>: from 1 × 10¹⁰ to 3.5 × 10¹² per cm³. The number of carriers depends exponentially on temperature, because each one needs a rare, large kick of thermal energy compared with the average thermal energy kT ≈ 26 meV.</>}
        />
        <TryThis>drag the temperature from 0 K up to 600 K. Watch bonds break and electron–hole pairs appear. Then switch to Ge and GaAs at 300 K and compare how many carriers each has.</TryThis>
        <ThermalLattice />
        <Describe>
          <p><b>What it shows.</b> A flattened silicon crystal: circles are atoms, double lines are covalent bonds. When a bond breaks it turns dashed, a blue electron is set free to wander, and a red open circle (the hole) is left at the broken bond. The hole hops from bond to bond more slowly than the electron moves.</p>
          <p><b>Controls.</b> A temperature slider (0 to 600 K) and three materials: silicon, germanium and gallium arsenide. With reduced motion turned on, carriers stay still and a Step button moves them.</p>
          <p><b>Where the numbers come from.</b> n<sub>i</sub>(T) = n<sub>i</sub>(300 K)·(T/300)<sup>3/2</sup>·exp[−(E<sub>g</sub>/2k)(1/T − 1/300)], with n<sub>i</sub>(300 K) = 1 × 10¹⁰ (Si), 2.4 × 10¹³ (Ge) and 2.1 × 10⁶ cm⁻³ (GaAs) and band gaps 1.12, 0.66 and 1.42 eV. Conductivity σ = q n<sub>i</sub>(µ<sub>n</sub> + µ<sub>p</sub>) with room-temperature mobilities (Si 1350 and 480 cm²/V·s).</p>
          <p><b>Limits.</b> The number of pairs drawn grows with the <em>logarithm</em> of n<sub>i</sub> (two more pairs per tenfold rise), because the real range spans more than ten orders of magnitude. Mobilities are held at their 300 K values and the band gap is held fixed; both actually fall slowly as temperature rises.</p>
        </Describe>
      </Section>

      <Section n={4} title="Two carriers for the price of one">
        <p>The freed electron is the obvious carrier. The less obvious one is the gap it left behind. That empty spot in a bond is called a <strong>hole</strong>. A neighbouring bond electron can hop into it, which moves the hole one step the other way. Under an electric field holes drift like positive charges, and it is far easier to track one hole than the billions of bond electrons shuffling around it.</p>
        <p>In pure silicon, every broken bond makes exactly one electron and one hole, so their numbers are equal. That shared number is the <strong>intrinsic carrier concentration</strong>, n<sub>i</sub>: about 1 × 10¹⁰ cm⁻³ at 300 K. There are 5 × 10²² silicon atoms in a cubic centimetre, so only one bond in every five trillion is broken.</p>
        <EquationCard
          title="Conductivity from carriers"
          tex={String.raw`\sigma = q\,(n\,\mu_n + p\,\mu_p) \;\xrightarrow{\;n = p = n_i\;}\; \sigma_i = q\,n_i\,(\mu_n+\mu_p)`}
          symbols={[
            { s: '\\sigma', name: 'conductivity', unit: 'S/cm' },
            { s: 'q', name: 'electron charge', unit: '1.602 × 10⁻¹⁹ C' },
            { s: 'n,\\,p', name: 'electron and hole concentrations', unit: 'cm⁻³' },
            { s: '\\mu_n,\\,\\mu_p', name: 'electron and hole mobilities', unit: 'cm²/V·s' },
            { s: 'n_i', name: 'intrinsic carrier concentration', unit: 'cm⁻³' },
          ]}
          typical={<>Intrinsic Si at 300 K: σ = 1.602 × 10⁻¹⁹ × 10¹⁰ × (1350 + 480) ≈ 2.9 × 10⁻⁶ S/cm, so ρ ≈ 3.4 × 10⁵ Ω·cm. With the older textbook n<sub>i</sub> = 1.5 × 10¹⁰ cm⁻³ you get ρ ≈ 2.3 × 10⁵ Ω·cm.</>}
        />
        <SideNote>
          <p>Heating a metal <em>raises</em> its resistance, because its carrier count is fixed and hotter atoms scatter electrons more. Heating a semiconductor <em>lowers</em> its resistance, because the carrier count explodes and swamps the extra scattering. Same thermometer, opposite needle.</p>
        </SideNote>
      </Section>

      <Section n={5} title="Four ways to talk it into conducting">
        <p>Heat is only one way to break bonds. <strong>Light</strong> does it too: a photon with more than 1.12 eV of energy (any wavelength shorter than about 1.1 µm) can free an electron in silicon, which is how solar cells and camera sensors work. <strong>Impurities</strong> (doping, lesson 1.5) add carriers without breaking any bonds at all. And an <strong>electric field</strong> from a nearby gate can pull carriers into a thin layer, which is how every MOSFET in a processor switches.</p>
        <p>The rest of this unit explains each of these levers properly, starting with the question this lesson skipped: why does freeing an electron cost exactly 1.12 eV, and not any amount you like?</p>
        <Example title="the thermistor guarding your phone battery">
          <p>Inside most phone batteries sits an NTC thermistor: a small piece of semiconducting ceramic whose resistance falls by roughly 4% for every degree of warming. The charger reads it, and if the pack gets too hot during fast charging it cuts the current. That one sensor is the temperature slider in the figure above, wired to a safety switch.</p>
        </Example>
        <p>The steep temperature dependence you just played with is a nuisance as often as it is useful. Leakage currents in a hot phone processor rise for the same reason, which is why a phone throttles itself when it warms up.</p>
        <p>One rule of thumb to carry forward: in silicon near room temperature, <M>{String.raw`n_i`}</M> roughly doubles for every 9 K of warming.</p>
      </Section>
    </>
  ),
  remember: 'A semiconductor conducts because heat, light or impurities free a few electrons from their bonds, and each freed electron leaves a hole that also carries current.',
  quiz: [
    {
      stem: 'What happens to the resistance of pure silicon when it is heated from 25 °C to 75 °C?',
      options: ['It rises, like copper', 'It falls sharply', 'It stays the same', 'It rises at first, then falls'],
      answer: 1,
      why: [
        'Copper rises because its carrier count is fixed. In silicon the carrier count grows exponentially.',
        'More bonds break, n_i rises by roughly 30 times over this range, and conductivity follows it.',
        'Only a material with a fixed carrier count and no scattering change would do this.',
        'Lattice scattering does rise, but the carrier growth always wins in intrinsic silicon.',
      ],
    },
    {
      stem: 'A hole in a semiconductor is best described as:',
      options: ['A positron trapped in the crystal', 'A missing atom in the lattice', 'A missing electron in a bond, which behaves like a positive carrier', 'A gap between two atoms that electrons cannot cross'],
      answer: 2,
      why: [
        'A positron is real antimatter. A hole is the absence of an electron.',
        'That is a vacancy, a crystal defect. Holes exist in perfect crystals too.',
        'Neighbouring bond electrons hop into the empty spot, so the vacancy moves like a positive charge.',
        'Electrons hop between bonds all the time; that hopping is how a hole moves.',
      ],
    },
    {
      stem: 'In pure (intrinsic) silicon at room temperature:',
      options: ['n is much larger than p', 'p is much larger than n', 'n = p = n_i', 'n = p = 0'],
      answer: 2,
      why: [
        'That needs donor doping.',
        'That needs acceptor doping.',
        'Every broken bond makes one electron and one hole, so they are equal.',
        'True only at 0 K. At 300 K, n_i ≈ 10¹⁰ cm⁻³.',
      ],
    },
    {
      stem: 'Why does germanium have far more intrinsic carriers than silicon at 300 K?',
      options: ['Germanium atoms have more valence electrons', 'Germanium has a smaller band gap (0.66 eV vs 1.12 eV)', 'Germanium is always doped during manufacture', 'Germanium has a larger lattice, so electrons move faster'],
      answer: 1,
      why: [
        'Both are group IV with four valence electrons.',
        'n_i depends on exp(−E_g/2kT); a smaller gap means far more bonds break at the same temperature.',
        'Intrinsic means undoped; the comparison is between pure crystals.',
        'Mobility affects conductivity, not the number of carriers.',
      ],
    },
  ],
  net: {
    questions: [
      {
        tag: 'Numerical',
        stem: 'Intrinsic silicon at 300 K has n_i = 1.5 × 10¹⁰ cm⁻³, µ_n = 1350 cm²/V·s and µ_p = 480 cm²/V·s. Its resistivity is closest to:',
        options: ['2.3 × 10³ Ω·cm', '2.3 × 10⁵ Ω·cm', '4.4 × 10⁻⁶ Ω·cm', '6.4 × 10⁵ Ω·cm'],
        answer: 1,
        why: [
          'Off by a factor of 100: check the power of ten in q·n_i.',
          'σ = 1.6 × 10⁻¹⁹ × 1.5 × 10¹⁰ × 1830 = 4.39 × 10⁻⁶ S/cm, so ρ = 1/σ ≈ 2.28 × 10⁵ Ω·cm.',
          'That is the conductivity σ in S/cm, not the resistivity.',
          'This uses only the hole mobility; both carriers conduct.',
        ],
      },
      {
        stem: 'The temperature coefficient of resistance of an intrinsic semiconductor is:',
        options: ['Positive', 'Negative', 'Zero', 'Positive at low T, zero at high T'],
        answer: 1,
        why: [
          'Positive is the metal behaviour.',
          'Resistance falls with temperature because n_i rises exponentially.',
          'Only special alloys like constantan approach zero.',
          'Intrinsic semiconductors become even more conductive at high T.',
        ],
      },
      {
        stem: 'Which statement about an intrinsic semiconductor at 0 K is correct?',
        options: ['It behaves as a perfect insulator', 'It behaves as a perfect conductor', 'It has n_i = 10¹⁰ cm⁻³', 'Holes exist but electrons do not'],
        answer: 0,
        why: [
          'With no thermal energy no bond breaks, so there are no free carriers.',
          'That describes a superconductor, not a semiconductor.',
          'n_i = 10¹⁰ cm⁻³ is the 300 K value.',
          'Holes and electrons are created in pairs; with no broken bonds there are neither.',
        ],
      },
    ],
    traps: [
      <>Semiconductor: <b>negative</b> temperature coefficient of resistance. Metal: positive. Options often swap them.</>,
      <>Use the n<sub>i</sub> the question gives. 1.5 × 10¹⁰ cm⁻³ is still standard in many Indian textbooks; 1 × 10¹⁰ cm⁻³ is the modern value.</>,
      <>σ uses <b>both</b> mobilities: q n<sub>i</sub>(µ<sub>n</sub> + µ<sub>p</sub>). Forgetting µ<sub>p</sub> gives an answer about 25% off, which NET options are built to catch.</>,
    ],
    formula: String.raw`n_i \propto T^{3/2}\,e^{-E_g/2kT},\qquad \sigma_i = q\,n_i(\mu_n+\mu_p)`,
    formulaLabel: 'Intrinsic carriers and conductivity',
  },
  doneWhen: <>You can explain, without notes, why heating silicon lowers its resistance while heating copper raises it, using the words <em>bond</em>, <em>electron–hole pair</em> and <em>n<sub>i</sub></em>.</>,
  upNextTeaser: 'Why does it cost exactly 1.12 eV to free an electron in silicon, and not any amount you like? Bring atoms together and watch their single energy levels spread into bands with a gap between them.',
};
