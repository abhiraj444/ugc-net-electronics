import { Describe, EquationCard, Example, M, Section, SideNote, TryThis } from '@/components/lesson/Blocks';
import { YourGuess } from '@/components/lesson/Interactive';
import PNJunction from '@/components/figures/PNJunction';
import type { LessonContent } from './types';

export const lesson: LessonContent = {
  id: '1-6',
  dek: 'Join p-type and n-type silicon and carriers rush across, leave charged ions behind, and build a wall that stops the rush. That wall is the reason a diode lets current through one way and not the other.',
  netWeight: 'High',
  buildsOn: ['1-5'],
  hook: (
    <>
      <p>Picture two villages next to each other. One is crowded with people who want more space. The other is full of empty houses. Open the border and people rush across to fill them.</p>
      <p>But every person who leaves takes away something their own village needed to stay balanced, and soon the border is lined with angry, charged houses on both sides. They push back. The rush slows, then stops. That standoff, frozen in a sliver of silicon a micrometre wide, is a PN junction.</p>
    </>
  ),
  body: (
    <>
      <Section n={1} title="What happens the moment you join them?">
        <p>On the n side there are lots of free electrons. On the p side there are lots of holes. Put the two pieces in contact and each kind of carrier spreads into the side where it is rare, exactly like ink spreading in water. This spreading is called <strong>diffusion</strong>: motion from crowded to empty, driven only by the difference in crowding.</p>
        <p>Electrons that cross into the p side meet holes and <strong>recombine</strong>: the electron drops into the empty bond and both carriers disappear. The same happens to holes that cross into the n side.</p>
        <p>What stays behind is the important part. Each donor atom on the n side gave away its electron, so it is now a fixed <strong>positive ion</strong> locked in the crystal. Each acceptor on the p side is a fixed <strong>negative ion</strong>. Near the boundary, those ions are no longer covered by mobile carriers. This strip, emptied of free carriers, is the <strong>depletion region</strong>.</p>
        <YourGuess
          question="As more carriers cross, does the electric field at the junction get stronger, weaker, or stay the same?"
          answer={<><strong>Stronger.</strong> Every carrier that crosses uncovers one more ion on each side. More positive charge on the right and more negative charge on the left means a stronger field pointing from n to p, and that field pushes back on the very carriers that are crossing.</>}
        />
      </Section>

      <Section n={2} title="Try it: build a junction">
        <p>The figure below starts with the two pieces apart. Press Join and watch carriers cross, ions appear and the depletion region open up. Under the lattice are four linked plots: the charge left behind, the electric field it makes, the potential, and the energy bands.</p>
        <TryThis>press <b>Join</b> with the textbook preset. Notice how thin the depletion region is on the p side. Then drag <b>N<sub>D</sub></b> up tenfold, from 10¹⁵ to 10¹⁶, and see which side the region shrinks on.</TryThis>
        <PNJunction />
        <Describe>
          <p><b>What it shows.</b> Top: a p-type block (open red circles are holes, small “−” marks are fixed acceptor ions) and an n-type block (blue dots are electrons, “+” marks are fixed donor ions). After Join, carriers near the boundary vanish and the uncovered ions are drawn bold. The shaded strip is the depletion region, drawn to the same horizontal scale as the plots below. Below: charge density ρ(x) (two rectangles), field E(x) (a triangle, negative because it points from n to p), potential V(x) (an S-curve rising by V<sub>bi</sub>), and the band diagram, where E<sub>c</sub> and E<sub>v</sub> bend and the Fermi level E<sub>F</sub> becomes flat.</p>
          <p><b>Controls.</b> N<sub>A</sub> and N<sub>D</sub> sliders from 10¹⁴ to 10¹⁸ cm⁻³, temperature from 250 to 400 K, Join and Reset, and three presets. With reduced motion turned on, Join jumps straight to equilibrium and a Step button walks through it in quarters.</p>
          <p><b>Where the numbers come from.</b> The abrupt-junction depletion approximation: V<sub>bi</sub> = (kT/q) ln(N<sub>A</sub>N<sub>D</sub>/n<sub>i</sub>²), W = √[(2ε<sub>s</sub>/q) V<sub>bi</sub> (1/N<sub>A</sub> + 1/N<sub>D</sub>)], N<sub>A</sub>x<sub>p</sub> = N<sub>D</sub>x<sub>n</sub>, E<sub>max</sub> = qN<sub>D</sub>x<sub>n</sub>/ε<sub>s</sub>. It uses ε<sub>s</sub> = 11.7 ε₀, n<sub>i</sub> = 1 × 10¹⁰ cm⁻³ at 300 K scaled with temperature as T<sup>3/2</sup> exp(−E<sub>g</sub>/2kT), and complete ionisation of dopants.</p>
          <p><b>Limits.</b> The number of dots is illustrative (it grows with the logarithm of doping, since 10¹⁷ real dots would not fit). The depletion edges are treated as sharp; real carrier densities fade out over a Debye length. During the Join animation the plots grow the depletion width linearly in time for clarity; only the final equilibrium values are physical.</p>
        </Describe>
      </Section>

      <Section n={3} title="Why does the rush stop?">
        <p>The uncovered ions create an electric field across the depletion region, pointing from the positive n side to the negative p side. That field pushes electrons back toward n and holes back toward p. Motion caused by a field is called <strong>drift</strong>.</p>
        <p>So two currents now fight each other. Diffusion pushes carriers across; drift pushes them back. The field keeps growing until the two exactly cancel. At that point no net current flows, and the junction is in <strong>equilibrium</strong>. You can see the sign of equilibrium in the band diagram: the Fermi level is a single flat line through the whole device.</p>
        <p>The potential step that builds up across the depletion region is the <strong>built-in potential</strong>, V<sub>bi</sub>. For the textbook silicon junction it is a little over 0.7 V. It depends on doping only through a logarithm, which is why almost every silicon junction ends up between about 0.6 and 0.9 V.</p>
        <EquationCard
          title="Built-in potential"
          tex={String.raw`V_{bi} = \frac{kT}{q}\,\ln\!\left(\frac{N_A N_D}{n_i^{2}}\right)`}
          symbols={[
            { s: 'V_{bi}', name: 'built-in potential across the junction', unit: 'V' },
            { s: 'kT/q', name: 'thermal voltage', unit: '25.85 mV at 300 K' },
            { s: 'N_A', name: 'acceptor concentration, p side', unit: 'cm⁻³' },
            { s: 'N_D', name: 'donor concentration, n side', unit: 'cm⁻³' },
            { s: 'n_i', name: 'intrinsic carrier concentration', unit: 'cm⁻³' },
          ]}
          typical={<>N<sub>A</sub> = 10¹⁷, N<sub>D</sub> = 10¹⁵ cm⁻³, n<sub>i</sub> = 10¹⁰ cm⁻³, 300 K: ln(10¹²) = 27.63, so V<sub>bi</sub> = 0.02585 × 27.63 ≈ <b>0.714 V</b> (0.716 V if you round kT/q to 25.9 mV). W ≈ 0.97 µm, almost all of it on the lightly doped n side.</>}
        />
        <SideNote>
          <p>You cannot measure V<sub>bi</sub> by touching a voltmeter across a diode. The contact potentials where the metal leads meet the silicon cancel it exactly. If they did not, every diode sitting in a drawer would be a battery, and you could run a clock on it forever.</p>
        </SideNote>
      </Section>

      <Section n={4} title="Which side does the wall grow into?">
        <p>Charge must balance: the negative charge uncovered on the p side equals the positive charge uncovered on the n side. In symbols, <M>{String.raw`N_A x_p = N_D x_n`}</M>. If the p side is doped 100 times more heavily, it only needs to give up a strip 100 times thinner to match the charge.</p>
        <p>So the depletion region reaches mostly into the <em>lightly</em> doped side. A p⁺n junction is depleted almost entirely on its n side. That is the result the “Try this” asked you to find: raising N<sub>D</sub> shrinks the region on the n side, because the n side now needs less width to supply the same charge.</p>
        <Example title="your phone charger">
          <p>The charger on your desk turns 230 V, 50 Hz mains into DC with a bridge of four PN junctions. Each one blocks for half of every cycle, 100 times a second between them, because of exactly this depletion region.</p>
        </Example>
      </Section>

      <Section n={5} title="Forward and reverse bias, in one picture">
        <p>Connect a battery with its positive end on the p side and you <strong>forward bias</strong> the junction. The applied voltage opposes the built-in one, so the wall drops to V<sub>bi</sub> − V. The depletion region narrows and carriers flood over the lower wall. Current flows.</p>
        <p>Flip the battery and you <strong>reverse bias</strong> it. Now the wall rises to V<sub>bi</sub> + V<sub>R</sub>, the depletion region widens as <M>{String.raw`\sqrt{V_{bi}+V_R}`}</M>, and only a trickle of minority carriers, the few electrons that happen to be on the p side and holes on the n side, drift through. That trickle is the reverse saturation current, typically picoamps to nanoamps for a small silicon diode.</p>
        <p>Lesson 1.7 turns this picture into one equation, and shows why the forward current multiplies tenfold for roughly every 60 mV.</p>
      </Section>
    </>
  ),
  remember: 'At a PN junction, diffusion builds a field until drift cancels it, leaving a depletion region and a built-in potential of roughly 0.6 to 0.8 V in silicon.',
  quiz: [
    {
      stem: 'In a p⁺n junction (N_A ≫ N_D), which side does the depletion region extend into more?',
      options: ['The heavily doped p⁺ side', 'The lightly doped n side', 'Equally into both sides', 'Neither: it sits exactly at the boundary plane'],
      answer: 1,
      why: [
        'Heavy doping packs a lot of ion charge into a thin strip, so the p⁺ side needs only a sliver.',
        'Charge balance N_A·x_p = N_D·x_n means the lighter side must give up a wider strip to match the charge.',
        'Only true when N_A = N_D.',
        'The region has finite width W, set by the doping and V_bi.',
      ],
    },
    {
      stem: 'What happens to the depletion width W when the reverse bias V_R is increased?',
      options: ['It shrinks, as 1/V_R', 'It stays fixed, because doping fixes W', 'It widens, roughly as √(V_bi + V_R)', 'It widens linearly with V_R'],
      answer: 2,
      why: [
        'Shrinking happens under forward bias, not reverse.',
        'Doping sets W at zero bias only; bias changes the potential the region must hold.',
        'W = √[(2ε_s/q)(V_bi + V_R)(1/N_A + 1/N_D)] for an abrupt junction.',
        'Linear would need a constant field; in an abrupt junction the field is triangular and W goes as a square root.',
      ],
    },
    {
      stem: 'Why does an unconnected silicon diode not light an LED, even though it has a built-in potential of about 0.7 V?',
      options: ['V_bi only exists while current flows', 'The contact potentials at the metal leads cancel V_bi exactly', 'V_bi is too small to light anything', 'The depletion region is an insulator, so it stores no energy'],
      answer: 1,
      why: [
        'V_bi exists at equilibrium with zero current; that is when it is defined.',
        'In equilibrium the Fermi level is flat through the whole loop, so the net voltage around it is zero.',
        'Even a big V_bi would not help: no net EMF is available at the terminals.',
        'The depletion region does store charge (that is junction capacitance), but this is not why no EMF appears.',
      ],
    },
    {
      stem: 'For a one-sided junction with N_A ≫ N_D, N_D is doubled. The depletion width becomes about:',
      options: ['2W', 'W/2', 'W/√2', 'Unchanged'],
      answer: 2,
      why: [
        'W rises with lighter doping, not heavier.',
        'That would need W ∝ 1/N_D; the dependence is a square root.',
        'W ≈ √(2ε_s V_bi / qN_D) for a one-sided junction, so doubling N_D gives W/√2 (V_bi changes only slightly, by kT/q·ln 2 ≈ 18 mV).',
        'N_D is the lightly doped side, which controls W.',
      ],
    },
  ],
  net: {
    questions: [
      {
        tag: 'Numerical',
        stem: 'An abrupt silicon junction has N_A = 10¹⁷ cm⁻³ and N_D = 10¹⁶ cm⁻³ at 300 K (take n_i = 10¹⁰ cm⁻³). The built-in potential is closest to:',
        options: ['0.25 V', '0.53 V', '0.77 V', '1.12 V'],
        answer: 2,
        why: [
          'This is roughly kT/q × 10; it forgets the logarithm of the doping product.',
          'This would correspond to much lighter doping (around 10¹⁴ on each side).',
          'V_bi = 0.02585 × ln(10³³/10²⁰) = 0.02585 × 29.93 ≈ 0.774 V.',
          'That is the band gap in eV. V_bi approaches E_g/q only for degenerate doping.',
        ],
      },
      {
        stem: 'The depletion (transition) capacitance of a reverse-biased abrupt junction varies with reverse voltage V_R as:',
        options: ['C ∝ (V_bi + V_R)', 'C ∝ (V_bi + V_R)^(−1/2)', 'C ∝ (V_bi + V_R)^(−1/3)', 'C is independent of V_R'],
        answer: 1,
        why: [
          'Capacitance falls, not rises, as the plates (depletion edges) move apart.',
          'C = ε_s A / W and W ∝ (V_bi + V_R)^(1/2) for an abrupt junction. This is how a varactor tunes.',
          'The −1/3 power is for a linearly graded junction.',
          'Varactor diodes exist precisely because C changes with V_R.',
        ],
      },
      {
        stem: 'In thermal equilibrium, which statement about a PN junction is true?',
        options: ['Diffusion current is zero on both sides', 'The Fermi level is constant across the junction', 'The intrinsic level E_i is flat across the junction', 'Electric field is zero everywhere'],
        answer: 1,
        why: [
          'Diffusion current is not zero; it is cancelled by an equal and opposite drift current.',
          'Zero net current means a flat Fermi level. This is the defining feature of equilibrium.',
          'E_i bends by qV_bi across the depletion region.',
          'The field is zero only outside the depletion region.',
        ],
      },
    ],
    traps: [
      <>Depletion capacitance goes as 1/W, so it <b>falls</b> with reverse bias. Abrupt junction: C ∝ V<sup>−1/2</sup>. Linearly graded: C ∝ V<sup>−1/3</sup>, and W ∝ V<sup>1/3</sup>.</>,
      <>Read which n<sub>i</sub> the question gives. With 1.5 × 10¹⁰ cm⁻³ the textbook junction gives 0.693 V instead of 0.714 V. Both are “correct” for their n<sub>i</sub>.</>,
      <>V<sub>bi</sub> <b>falls</b> as temperature rises, because n<sub>i</sub>² grows faster than kT/q.</>,
      <>The depletion region lies mostly in the <b>lightly</b> doped side. Many options swap this.</>,
    ],
    formula: String.raw`W=\sqrt{\frac{2\varepsilon_s}{q}\,(V_{bi}-V)\left(\frac{1}{N_A}+\frac{1}{N_D}\right)},\quad N_A x_p = N_D x_n`,
    formulaLabel: 'Depletion width and charge balance',
  },
  doneWhen: <>You can explain to a friend, using the words <em>depletion region</em> and <em>built-in potential</em>, why almost no current flows when the junction is reverse biased, and say which side the depletion region grows into.</>,
  upNextTeaser: 'Lower the wall a little and current rises a little. Lower it a bit more and it multiplies tenfold every 60 mV. Here is the equation behind that.',
};
