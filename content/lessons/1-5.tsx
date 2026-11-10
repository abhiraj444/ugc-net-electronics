import { Describe, EquationCard, Example, M, Section, SideNote, TryThis } from '@/components/lesson/Blocks';
import { YourGuess } from '@/components/lesson/Interactive';
import Doping from '@/components/figures/Doping';
import type { LessonContent } from './types';

export const lesson: LessonContent = {
  id: '1-5',
  dek: 'Replace one silicon atom in a million with phosphorus and the crystal gains a millionfold more free electrons, while its holes nearly vanish. Doping is how we decide, atom by atom, which carrier a region will have, and every device in this course is built from it.',
  netWeight: 'High',
  buildsOn: ['1-4'],
  hook: (
    <>
      <p>Drop a single drop of ink into a bucket of water and the whole bucket turns faintly blue. One part in a hundred thousand, and you can see it from across the room.</p>
      <p>Doping silicon is the same trick, only more extreme. One foreign atom for every million or so silicon atoms, invisible to any chemical test you could do at home, and the crystal’s electrical character changes completely. A party of a million guests, transformed by a handful of new arrivals.</p>
    </>
  ),
  body: (
    <>
      <Section n={1} title="Guests with one electron too many, or one too few">
        <p>Silicon has four outer electrons. Swap one silicon atom for phosphorus, which has five, and four of them form bonds as usual. The fifth has no bond to join. It is held so loosely, by about 0.045 eV, that at room temperature it is almost certainly free. Phosphorus is a <strong>donor</strong>: it donates an electron, and becomes a fixed positive ion. Arsenic and antimony do the same.</p>
        <p>Swap in boron instead, which has three outer electrons, and one bond is left short. A neighbouring electron soon hops in to complete it, leaving a hole elsewhere. Boron is an <strong>acceptor</strong>: it accepts an electron and becomes a fixed negative ion. Aluminium, gallium and indium are acceptors too.</p>
        <p>Silicon with mostly donors is <strong>n-type</strong> (negative carriers dominate). Silicon with mostly acceptors is <strong>p-type</strong>.</p>
      </Section>

      <Section n={2} title="Majority and minority carriers">
        <p>In n-type silicon the electrons are the <strong>majority carriers</strong>: with every donor ionised, n ≈ N<sub>D</sub>. But what happens to the holes?</p>
        <YourGuess
          question="Add 10¹⁶ donors per cm³ to silicon (n_i = 10¹⁰ cm⁻³). Do the holes go up, go down, or stay at 10¹⁰?"
          answer={<>They go <strong>down, a millionfold, to about 10⁴ cm⁻³</strong>. The flood of electrons fills empty bonds, so holes recombine far faster. The law of mass action from lesson 1.4, n·p = n<sub>i</sub>², fixes the product: p = (10¹⁰)²/10¹⁶ = 10⁴.</>}
        />
        <p>The holes left over are the <strong>minority carriers</strong>. There are very few of them, but as you will see in lessons 1.6 and 1.7, they are what carries the leakage current through a reverse-biased diode.</p>
      </Section>

      <Section n={3} title="Try it: add guests and watch the Fermi level move">
        <TryThis>drag the doping slider right to add phosphorus. Watch E<sub>F</sub> rise toward E<sub>c</sub>, the n bar grow and the p bar shrink by the same amount. Then set 10¹⁴ donors and raise the temperature to 600 K.</TryThis>
        <Doping />
        <Describe>
          <p><b>What it shows.</b> Left: a small patch of the lattice where some silicon atoms are replaced by phosphorus (P, with its spare blue electron) or boron (B, with an open red hole in a bond). Right: the band diagram with E<sub>c</sub>, E<sub>v</sub>, the intrinsic level E<sub>i</sub> (dotted) and the Fermi level E<sub>F</sub> (dashed), plus the donor or acceptor level 45 meV from its band edge. Below it, n and p on a logarithmic bar scale: as one bar grows, the other shrinks by exactly the same number of decades.</p>
          <p><b>Controls.</b> Doping from 10¹⁸ acceptors (far left) through intrinsic (centre) to 10¹⁸ donors (far right); temperature from 200 to 700 K; and a switch between n<sub>i</sub> = 1.0 × 10¹⁰ and 1.5 × 10¹⁰ cm⁻³ at 300 K.</p>
          <p><b>Where the numbers come from.</b> Charge neutrality with complete ionisation, n − p = N<sub>D</sub> − N<sub>A</sub>, and the mass-action law n·p = n<sub>i</sub>², solved exactly: n = N/2 + √((N/2)² + n<sub>i</sub>²). Then E<sub>F</sub> − E<sub>i</sub> = kT ln(n/n<sub>i</sub>). n<sub>i</sub>(T) scales as T<sup>3/2</sup>exp(−E<sub>g</sub>/2kT).</p>
          <p><b>Limits.</b> The number of dopant atoms drawn is illustrative; at 10¹⁶ cm⁻³ only one site in five million is a dopant. The model assumes every dopant is ionised, which fails below about 100 K (freeze-out), and ignores band-gap narrowing above about 10¹⁸ cm⁻³. E<sub>i</sub> is drawn at midgap.</p>
        </Describe>
      </Section>

      <Section n={4} title="How far does the Fermi level move?">
        <p>Each tenfold increase in electrons pushes E<sub>F</sub> up by the same step, kT·ln10 ≈ 60 meV at room temperature. Going from intrinsic to 10¹⁶ donors is a millionfold, six steps, so E<sub>F</sub> rises about 0.36 eV above E<sub>i</sub>. That is why E<sub>F</sub> never quite reaches the band edge in normal doping: you would need around 10¹⁹ donors.</p>
        <EquationCard
          title="Mass action and the doped Fermi level"
          tex={String.raw`n\,p = n_i^{2},\qquad E_F - E_i = kT\,\ln\!\frac{n}{n_i} \approx kT\,\ln\!\frac{N_D}{n_i}`}
          symbols={[
            { s: 'n,\\,p', name: 'electron and hole concentrations', unit: 'cm⁻³' },
            { s: 'n_i', name: 'intrinsic carrier concentration', unit: '10¹⁰ cm⁻³ (Si, 300 K)' },
            { s: 'N_D', name: 'donor concentration', unit: 'cm⁻³' },
            { s: 'E_F - E_i', name: 'Fermi level above the intrinsic level', unit: 'eV' },
            { s: 'kT', name: 'thermal energy', unit: '25.85 meV at 300 K' },
          ]}
          typical={<>N<sub>D</sub> = 10¹⁶ cm⁻³ at 300 K: n = 10¹⁶, p = 10⁴ cm⁻³, E<sub>F</sub> − E<sub>i</sub> = 0.02585 × ln(10⁶) ≈ <b>0.357 eV</b>. With n<sub>i</sub> = 1.5 × 10¹⁰: p = 2.25 × 10⁴ cm⁻³ and E<sub>F</sub> − E<sub>i</sub> ≈ 0.347 eV.</>}
        />
        <p>For p-type material everything mirrors: p ≈ N<sub>A</sub>, n = n<sub>i</sub>²/N<sub>A</sub>, and E<sub>F</sub> sits below E<sub>i</sub> by <M>{String.raw`kT\ln(N_A/n_i)`}</M>.</p>
        <SideNote>
          <p>Doped silicon is still electrically neutral. Every free electron from a donor is balanced by that donor’s fixed positive charge. n-type does not mean negatively charged; it means the mobile charge is negative.</p>
        </SideNote>
      </Section>

      <Section n={5} title="When the guests stop mattering">
        <p>Dopants set the carrier count only while they outnumber the carriers heat creates. Heat the crystal enough and n<sub>i</sub> climbs past N<sub>D</sub>; then n ≈ p ≈ n<sub>i</sub> again and the material is <strong>intrinsic</strong> no matter how it was doped. For 10¹⁴ donors in silicon this happens around 450 to 500 K, which is one reason silicon chips are rated to about 150 °C.</p>
        <p>Add both kinds of dopant and they cancel. 10¹⁶ donors plus 4 × 10¹⁵ acceptors behaves like 6 × 10¹⁵ donors. This <strong>compensation</strong> is how a manufacturer can turn an n region into a p region with a second, heavier doping step, and it is how every transistor’s source, drain and well are made.</p>
        <Example title="a rooftop solar panel">
          <p>The silicon wafers in a typical solar panel on an Indian rooftop start out lightly p-type, doped with boron or gallium at around 10¹⁶ cm⁻³. A thin top layer is then flooded with phosphorus to make it heavily n-type. The boundary between the two, a PN junction, is the subject of the next lesson.</p>
        </Example>
      </Section>
    </>
  ),
  remember: 'Doping sets the majority carrier count (n ≈ N_D or p ≈ N_A), the mass-action law n·p = nᵢ² crushes the minority carriers, and the Fermi level moves about 60 meV toward the band edge for every tenfold increase in doping.',
  quiz: [
    {
      stem: 'Silicon is doped with 10¹⁷ cm⁻³ boron atoms. The majority carriers and their concentration are:',
      options: ['Electrons, 10¹⁷ cm⁻³', 'Holes, 10¹⁷ cm⁻³', 'Holes, 10³ cm⁻³', 'Electrons, 10³ cm⁻³'],
      answer: 1,
      why: [
        'Boron is an acceptor, so the material is p-type.',
        'Each boron accepts an electron and creates a hole, so p ≈ N_A = 10¹⁷ cm⁻³.',
        'That is not the majority; n = n_i²/p = 10³ cm⁻³ is the minority (electron) count.',
        'Electrons are the minority, at 10³ cm⁻³, so this is not the majority carrier.',
      ],
    },
    {
      stem: 'Which element would make silicon n-type?',
      options: ['Boron', 'Gallium', 'Arsenic', 'Indium'],
      answer: 2,
      why: [
        'Group III: an acceptor.',
        'Group III: an acceptor.',
        'Group V: a donor with a fifth electron to give.',
        'Group III: an acceptor.',
      ],
    },
    {
      stem: 'Doping n-type silicon ten times more heavily moves the Fermi level:',
      options: ['Up by about 60 meV', 'Up by about 0.6 eV', 'Down by about 60 meV', 'It does not move'],
      answer: 0,
      why: [
        'E_F − E_i = kT ln(N_D/n_i), so tenfold more N_D adds kT·ln10 ≈ 59.5 meV.',
        'That is ten times too large.',
        'More donors push E_F up toward E_c, not down.',
        'E_F depends on the doping through the logarithm.',
      ],
    },
    {
      stem: 'A silicon sample contains 10¹⁶ donors and 10¹⁶ acceptors per cm³. At 300 K it behaves:',
      options: ['As strongly n-type', 'As strongly p-type', 'Almost like intrinsic silicon in carrier count', 'As a metal'],
      answer: 2,
      why: [
        'The donors are fully compensated by acceptors.',
        'The acceptors are fully compensated by donors.',
        'Net doping is zero, so n ≈ p ≈ n_i (though mobility is lower because of all the ionised impurities).',
        'Nothing here makes it degenerate.',
      ],
    },
  ],
  net: {
    questions: [
      {
        tag: 'Numerical',
        stem: 'Silicon at 300 K is doped with N_D = 10¹⁶ cm⁻³. Taking n_i = 1.5 × 10¹⁰ cm⁻³, the hole concentration is:',
        options: ['1.5 × 10¹⁰ cm⁻³', '2.25 × 10⁴ cm⁻³', '1.5 × 10⁶ cm⁻³', '10¹⁶ cm⁻³'],
        answer: 1,
        why: [
          'That is n_i; doping changes p.',
          'p = n_i²/N_D = (2.25 × 10²⁰)/10¹⁶ = 2.25 × 10⁴ cm⁻³.',
          'This divides n_i by 10⁴ instead of using n_i²/n.',
          'That is the electron (majority) concentration.',
        ],
      },
      {
        stem: 'In an extrinsic n-type semiconductor at room temperature, the minority carrier concentration is:',
        options: ['Directly proportional to N_D', 'Inversely proportional to N_D', 'Independent of N_D', 'Equal to n_i'],
        answer: 1,
        why: [
          'More donors means fewer holes.',
          'p = n_i²/N_D.',
          'The mass-action law ties p to N_D.',
          'Only in intrinsic material.',
        ],
      },
      {
        stem: 'As temperature is raised far above room temperature, an extrinsic semiconductor:',
        options: ['Becomes more strongly extrinsic', 'Becomes intrinsic as n_i exceeds the doping', 'Loses all its carriers', 'Turns from n-type to p-type'],
        answer: 1,
        why: [
          'Dopants are already fully ionised; extra carriers come from bonds breaking.',
          'Once n_i ≫ N_D, n ≈ p ≈ n_i.',
          'Carriers increase with temperature.',
          'Both n and p head toward n_i; no type inversion.',
        ],
      },
    ],
    traps: [
      <>n<sub>i</sub> depends only on the <b>material and temperature</b>, never on doping.</>,
      <>Minority carrier count is n<sub>i</sub>²/N, so it falls as doping rises. Many options make it n<sub>i</sub>/N.</>,
      <>Group III (B, Al, Ga, In) = acceptor, p-type. Group V (P, As, Sb) = donor, n-type.</>,
      <>Compensated material: use the <b>net</b> doping |N<sub>D</sub> − N<sub>A</sub>| for carrier counts.</>,
    ],
    formula: String.raw`np=n_i^2,\quad n\approx N_D,\quad p=\frac{n_i^2}{N_D},\quad E_F-E_i=kT\ln\frac{N_D}{n_i}`,
    formulaLabel: 'Carriers in doped silicon',
  },
  doneWhen: <>Given a doping level and n<sub>i</sub>, you can write down the majority and minority carrier concentrations and the Fermi level position in under a minute, and explain why adding donors <em>reduces</em> holes.</>,
  upNextTeaser: 'Put a p-type region next to an n-type one and carriers rush across the border, leave charged ions behind, and build a wall that stops the rush. That wall is why a diode works.',
};
