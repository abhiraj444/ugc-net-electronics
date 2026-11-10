import { Describe, EquationCard, Example, Section, SideNote, TryThis } from '@/components/lesson/Blocks';
import { YourGuess } from '@/components/lesson/Interactive';
import EnergyBands from '@/components/figures/EnergyBands';
import type { LessonContent } from './types';

export const lesson: LessonContent = {
  id: '1-2',
  dek: 'A lone atom has sharp energy levels. Pack 10²² of them into a crystal and each level spreads into a band of allowed energies, with forbidden gaps in between. The size of the gap decides whether a solid is a metal, a semiconductor or an insulator.',
  netWeight: 'High',
  buildsOn: ['1-1'],
  hook: (
    <>
      <p>Ask one singer to hold a note and you hear one clean pitch. Ask a hundred singers to hold the same note and something interesting happens: no two voices are perfectly identical, so the sound is a thick smear of slightly different pitches around that note. A choir does not sing a note; it sings a band.</p>
      <p>Atoms do the same thing with their energy levels. Alone, each one sings a single sharp level. Pushed close together in a crystal, they hear each other, and every level smears into a band.</p>
    </>
  ),
  body: (
    <>
      <Section n={1} title="One atom, a ladder of sharp levels">
        <p>An electron bound to a single atom can only have certain energies, like the rungs of a ladder. Between the rungs there is nothing: an electron cannot sit halfway. These are the atomic <strong>energy levels</strong>, and each one can hold two electrons (one spin up, one spin down).</p>
        <p>In silicon the rungs that matter are the outer ones, the 3s and 3p levels that hold its four valence electrons. Everything about how silicon conducts comes from what happens to these outer rungs when atoms get close.</p>
      </Section>

      <Section n={2} title="Bring two atoms together">
        <p>Far apart, two silicon atoms have identical ladders. Bring them close enough that their outer electron clouds overlap and the electrons can no longer tell which atom they belong to. Quantum mechanics then forbids both atoms from keeping the exact same level. Each level splits into two: one slightly lower (the electrons spend more time between the atoms, bonding them) and one slightly higher.</p>
        <p>The closer the atoms, the bigger the overlap, and the wider the split.</p>
        <YourGuess
          question="Now bring N atoms together instead of two. Into how many levels does each atomic level split?"
          answer={<>Into <strong>N</strong> levels, which together can hold 2N electrons. For a crystal with about 5 × 10²² atoms per cm³ the levels are so close together, around 10⁻²² eV apart, that they form a practically continuous <strong>band</strong>.</>}
        />
      </Section>

      <Section n={3} title="Try it: squeeze a chain of atoms">
        <TryThis>start with the atoms far apart and slowly drag the spacing toward the right. Watch each sharp level fan out into N lines. Then press 2, 4, 8 and 32 to see the lines fill in a band, and stop at the dashed line, silicon’s real bond length.</TryThis>
        <EnergyBands />
        <Describe>
          <p><b>What it shows.</b> Top: a row of atoms whose spacing you control. Bottom: allowed energies (vertical) against atomic spacing (horizontal, getting closer to the right). Each atomic level fans out into N lines as the atoms approach. The shaded strip is the band gap between the top of the lower band and the bottom of the upper band. The dashed vertical line marks the crystal’s real nearest-neighbour distance.</p>
          <p><b>Controls.</b> A spacing slider from 0.6 nm to 0.18 nm, the number of atoms N (2, 4, 8, 32), and presets for Si, Ge and GaAs that jump to that crystal’s bond length.</p>
          <p><b>Where the numbers come from.</b> A one-dimensional tight-binding chain: each of two atomic levels (0 eV and 6 eV) splits into N levels E = E₀ ± 2t·cos(jπ/(N+1)), with an overlap t that grows exponentially as the atoms approach (decay length 0.08 nm). The overlap is calibrated so that, for a very long chain, the gap at the real bond length equals the real band gap: 1.12 eV for Si, 0.66 eV for Ge, 1.42 eV for GaAs.</p>
          <p><b>Limits.</b> This is a teaching model, not a band-structure calculation. In real silicon the 3s and 3p levels mix (sp³ hybridisation) and the gap that forms at the bond length opens between bonding and antibonding states; the toy chain reproduces the idea of levels spreading into bands and the gap value at the bond length, not the full diagram. The overlap region at very small spacing is where the toy model stops resembling silicon.</p>
        </Describe>
      </Section>

      <Section n={4} title="Valence band, conduction band, and the gap between">
        <p>In silicon the lower band, the <strong>valence band</strong>, holds exactly as many states as there are bonding electrons, so at 0 K it is completely full. The upper band, the <strong>conduction band</strong>, is completely empty. A full band cannot carry current (every electron moving one way is matched by one moving the other), and an empty band has nobody to carry it.</p>
        <p>Between them lies the <strong>band gap</strong>, E<sub>g</sub>: a range of energies no electron in the crystal can have. Freeing an electron from a bond, as in lesson 1.1, means lifting it across this gap. That is why it costs 1.12 eV in silicon and not any amount you like.</p>
        <p>The gap sorts solids into three families. Metals have partly filled bands or overlapping bands, so there is no gap to cross. Insulators have huge gaps: diamond about 5.5 eV, silicon dioxide about 9 eV. Semiconductors have gaps of roughly 0.5 to 3 eV, small enough for heat and light to bridge.</p>
        <EquationCard
          title="Band gap and cut-off wavelength"
          tex={String.raw`\lambda_c = \frac{hc}{E_g} \approx \frac{1.24}{E_g\,[\text{eV}]}\ \mu\text{m}`}
          symbols={[
            { s: '\\lambda_c', name: 'longest wavelength the material can absorb', unit: 'µm' },
            { s: 'h', name: 'Planck constant', unit: '6.626 × 10⁻³⁴ J·s' },
            { s: 'c', name: 'speed of light', unit: '3 × 10⁸ m/s' },
            { s: 'E_g', name: 'band gap', unit: 'eV' },
          ]}
          typical={<>Si: 1.24/1.12 ≈ <b>1.11 µm</b> (near infrared). GaAs: 1.24/1.42 ≈ 0.87 µm. Ge: 1.24/0.66 ≈ 1.88 µm.</>}
        />
        <Example title="why fibre receivers are not silicon">
          <p>Long-distance optical fibre links, including the backbone that carries broadband across India, run at 1310 nm and 1550 nm, where glass fibre loses the least light. Silicon cannot absorb those photons at all: they carry less than 1.12 eV. So fibre receivers use InGaAs or germanium photodiodes, whose smaller gaps reach past 1.6 µm.</p>
        </Example>
      </Section>

      <Section n={5} title="Direct and indirect gaps, in one sentence each">
        <p>In GaAs, the bottom of the conduction band sits right above the top of the valence band in momentum, so an electron can drop across the gap and emit a photon directly. That is a <strong>direct gap</strong>, and it is why LEDs and laser diodes are made from GaAs and its cousins.</p>
        <p>In silicon and germanium, the two band edges sit at different momenta, an <strong>indirect gap</strong>. Crossing it needs a lattice vibration to supply the missing momentum, so silicon is a poor light emitter but an excellent material for transistors and solar cells.</p>
        <SideNote>
          <p>The band gap is a gap in <em>energy</em>, not in space. Electrons are not barred from some region of the crystal; they are barred from having certain energies anywhere in it.</p>
        </SideNote>
      </Section>
    </>
  ),
  remember: 'In a crystal each atomic level spreads into a band of N closely spaced levels, and the forbidden gap between the full valence band and the empty conduction band, 1.12 eV in silicon, sets how a solid conducts.',
  quiz: [
    {
      stem: 'A crystal is made of N atoms. Each atomic energy level splits into:',
      options: ['2 levels', 'N levels', 'N² levels', 'A continuous band with infinitely many levels'],
      answer: 1,
      why: [
        'Two levels is the two-atom case.',
        'N atoms give N levels per atomic level, holding 2N electrons with spin.',
        'The count grows linearly with the number of atoms, not as its square.',
        'The levels are extremely close, but there are exactly N of them.',
      ],
    },
    {
      stem: 'Why can a completely full valence band not carry a current?',
      options: ['Its electrons are too heavy', 'For every electron moving one way there is one moving the opposite way, and no empty states to shift into', 'The band gap blocks all electron motion', 'Valence electrons are not charged'],
      answer: 1,
      why: [
        'Mass is not the issue; even light electrons cannot carry net current in a full band.',
        'A field cannot change the total momentum of a full band because there are no empty states to move into.',
        'The gap separates bands; it does not stop motion inside a band.',
        'They carry exactly the electron charge.',
      ],
    },
    {
      stem: 'Silicon cannot be used to detect 1550 nm light because:',
      options: ['Its band gap photon wavelength cut-off is about 1.1 µm', 'Silicon reflects all infrared light', 'Silicon is a direct-gap material', '1550 nm photons have too much energy and pass through'],
      answer: 0,
      why: [
        'A 1550 nm photon carries 0.8 eV, less than the 1.12 eV gap, so it cannot free an electron.',
        'Silicon is fairly transparent, not reflective, at these wavelengths.',
        'Silicon has an indirect gap; that affects emission, not this cut-off.',
        'Longer wavelengths carry less energy, not more.',
      ],
    },
    {
      stem: 'What mostly distinguishes a semiconductor from an insulator in band terms?',
      options: ['Semiconductors have no band gap', 'Insulators have a partly filled conduction band', 'The size of the band gap: roughly under 3 eV for semiconductors, much larger for insulators', 'Semiconductors have more valence electrons'],
      answer: 2,
      why: [
        'No gap (or overlapping bands) describes a metal.',
        'A partly filled band means metallic conduction.',
        'Same band structure idea; the gap size decides whether room temperature can bridge it.',
        'Diamond (an insulator) and silicon (a semiconductor) both have four valence electrons.',
      ],
    },
  ],
  net: {
    questions: [
      {
        tag: 'Numerical',
        stem: 'The longest wavelength of light that germanium (E_g = 0.66 eV) can absorb is about:',
        options: ['0.66 µm', '1.11 µm', '1.88 µm', '8.2 µm'],
        answer: 2,
        why: [
          'This confuses the energy in eV with the wavelength in µm.',
          'That is the silicon cut-off (1.12 eV).',
          'λ_c = 1.24/0.66 ≈ 1.88 µm.',
          'Too long by a factor of about 4; check the 1.24 eV·µm constant.',
        ],
      },
      {
        stem: 'Which of these is a direct band-gap semiconductor?',
        options: ['Silicon', 'Germanium', 'Gallium arsenide', 'Diamond'],
        answer: 2,
        why: [
          'Si is indirect, which is why it is a poor light emitter.',
          'Ge is indirect.',
          'GaAs is direct, hence its use in LEDs and lasers.',
          'Diamond is an indirect-gap insulator.',
        ],
      },
      {
        stem: 'As temperature increases, the band gap of silicon:',
        options: ['Increases slightly', 'Decreases slightly', 'Stays exactly constant', 'Becomes zero above 400 K'],
        answer: 1,
        why: [
          'Thermal expansion and lattice vibrations shrink the gap, not grow it.',
          'From about 1.17 eV at 0 K to 1.12 eV at 300 K (Varshni relation).',
          'The change is small but real; questions on this test exactly that.',
          'Silicon stays a semiconductor well beyond 400 K.',
        ],
      },
    ],
    traps: [
      <>1 eV ↔ 1.24 µm. Larger gap means <b>shorter</b> cut-off wavelength.</>,
      <>Si and Ge are <b>indirect</b>; GaAs, InP and GaN are <b>direct</b>. LEDs and lasers need direct gaps.</>,
      <>E<sub>g</sub> <b>falls</b> slightly with temperature: Si 1.17 eV at 0 K, 1.12 eV at 300 K.</>,
      <>N atoms give N levels per band (2N electrons). Not 2N levels.</>,
    ],
    formula: String.raw`\lambda_c\,[\mu\text{m}] = \frac{1.24}{E_g\,[\text{eV}]}`,
    formulaLabel: 'Cut-off wavelength',
  },
  doneWhen: <>You can draw, from memory, how one atomic level becomes a band as atoms approach, and use the band gap to explain why silicon cannot detect 1550 nm fibre light.</>,
  upNextTeaser: 'An electron inside a crystal does not respond to a push the way a free electron does. Sometimes it acts lighter, sometimes heavier. Effective mass is how we keep Newton’s laws working anyway.',
};
