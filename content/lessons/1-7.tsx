import { Describe, EquationCard, Example, M, Section, SideNote, TryThis } from '@/components/lesson/Blocks';
import { YourGuess } from '@/components/lesson/Interactive';
import DiodeIV from '@/components/figures/DiodeIV';
import type { LessonContent } from './types';

export const lesson: LessonContent = {
  id: '1-7',
  dek: 'Lower the junction’s wall by a little and current rises a little. Lower it a bit more and it multiplies tenfold for every 60 mV. One exponential, the Shockley diode equation, explains the famous 0.7 V, the tiny reverse current, and why a diode’s voltage drifts with temperature.',
  netWeight: 'High',
  buildsOn: ['1-6'],
  hook: (
    <>
      <p>Think of a heavy door on a stiff spring. Lean on it gently and nothing happens. Lean a bit harder and it opens a crack. Then, past a certain push, it suddenly swings wide and people pour through. Push from the other side and it simply stays shut.</p>
      <p>A diode behaves like that door, and you already know why from lesson 1.6: the depletion region is a wall. This lesson shows exactly how quickly the door opens, and why the answer is an exponential rather than a straight line.</p>
    </>
  ),
  body: (
    <>
      <Section n={1} title="Why the current is exponential">
        <p>On the n side, electrons are spread over a range of energies above the conduction band edge. Most have little extra energy; a few have a lot. The number with more than an energy E above the edge falls off as e<sup>−E/kT</sup>, the Boltzmann tail from lesson 1.4.</p>
        <p>To cross into the p side, an electron must climb the wall, q(V<sub>bi</sub> − V) high. Forward bias V lowers the wall. Every time you lower it by kT (about 26 mV), the number of electrons that can climb it goes up by a factor of e ≈ 2.72. That is an exponential, and holes going the other way behave identically.</p>
        <p>Under reverse bias the wall rises and almost nobody climbs it. What remains is a small, steady drift of minority carriers that wander into the depletion region and get swept across by its field. That steady trickle is the <strong>reverse saturation current</strong>, I<sub>s</sub>.</p>
      </Section>

      <Section n={2} title="The equation">
        <EquationCard
          title="Shockley diode equation"
          tex={String.raw`I = I_s\left(e^{V/nV_T} - 1\right),\qquad V_T = \frac{kT}{q}`}
          symbols={[
            { s: 'I', name: 'diode current, positive in forward bias', unit: 'A' },
            { s: 'I_s', name: 'reverse saturation current', unit: 'A (fA to nA for small Si diodes)' },
            { s: 'V', name: 'applied voltage, p side relative to n side', unit: 'V' },
            { s: 'n', name: 'ideality factor, 1 (ideal) to 2', unit: 'no unit' },
            { s: 'V_T', name: 'thermal voltage', unit: '25.85 mV at 300 K' },
          ]}
          typical={<>I<sub>s</sub> = 10⁻¹⁴ A, n = 1, 300 K: I = 1 mA at V = 0.0259 × ln(10¹¹) ≈ <b>0.655 V</b>; 10 mA at 0.714 V. Each tenfold rise in current needs nV<sub>T</sub>·ln10 ≈ <b>59.5 mV</b>.</>}
        />
        <p>The −1 matters only near zero volts. In forward bias above about 0.1 V the exponential dwarfs it; in reverse bias beyond about −0.1 V the exponential vanishes and I = −I<sub>s</sub>.</p>
        <YourGuess
          question="A diode with n = 1 carries 1 mA at 0.60 V. Roughly what does it carry at 0.66 V?"
          answer={<>About <strong>10 mA</strong>. 60 mV is one “decade” of 59.5 mV at room temperature, so the current goes up tenfold. Another 60 mV would give about 100 mA. This is why you never connect a diode straight across a battery.</>}
        />
      </Section>

      <Section n={3} title="Try it: open the door">
        <TryThis>slide the bias from 0 to +0.75 V and watch the current wake up around 0.6 V. Switch to <b>Log</b> and see the curve become a straight line. Then warm the diode from 300 K to 350 K and read how much the voltage needed for 1 mA falls.</TryThis>
        <DiodeIV />
        <Describe>
          <p><b>What it shows.</b> Top: the diode’s current against voltage, on a linear axis (mA) or a log axis (|I| from 10⁻¹⁶ to 1 A). A ring marks the operating point. Below: the energy band picture at that bias. The step in the conduction band edge is the barrier q(V<sub>bi</sub> − V); blue dots are n-side electrons placed at Boltzmann-distributed energies, drawn solid when they have enough energy to cross.</p>
          <p><b>Controls.</b> Bias from −1.0 to +0.85 V, I<sub>s</sub> at 300 K from 10⁻¹⁶ to 10⁻⁹ A, ideality factor n from 1 to 2, temperature from 250 to 400 K, and a linear/log toggle.</p>
          <p><b>Where the numbers come from.</b> I = I<sub>s</sub>(e<sup>V/nV<sub>T</sub></sup> − 1) with V<sub>T</sub> = kT/q. I<sub>s</sub> is scaled with temperature as T³e<sup>−E<sub>g</sub>/kT</sup> (E<sub>g</sub> = 1.12 eV), the ideal diffusion-current model. The band picture uses V<sub>bi</sub> ≈ 0.89 V for a junction doped N<sub>A</sub> = 10¹⁸ and N<sub>D</sub> = 10¹⁷ cm⁻³, typical of a small rectifier; the I–V curve itself depends only on I<sub>s</sub>, n and T. The electron energies in the band picture are stretched 3.2 times vertically so the tail is visible; the “share with enough energy” readout is the unstretched value e<sup>−barrier/kT</sup>.</p>
          <p><b>Limits.</b> There is no series resistance, so above roughly 100 mA a real diode’s curve bends over and this one does not. There is no reverse breakdown (lesson 1.9) and no generation current in the depletion region, which in real silicon diodes makes the reverse current larger than I<sub>s</sub> and gives n closer to 2 at low currents.</p>
        </Describe>
      </Section>

      <Section n={4} title="So where does 0.7 V come from?">
        <p>Nowhere special. The diode equation has no threshold in it: current is never exactly zero above 0 V. The “cut-in voltage” of about 0.6 to 0.7 V for silicon is simply where the current becomes big enough to notice, about 0.1 to 10 mA for a typical small diode. Plot the same diode on a µA scale and it seems to switch on near 0.4 V; on an amp scale, near 0.8 V.</p>
        <p>For germanium, I<sub>s</sub> is millions of times larger (smaller band gap), so the same currents arrive about 0.4 V earlier: the familiar 0.2 to 0.3 V cut-in.</p>
        <p>Near any operating current I the diode acts, for small wiggles, like a resistor of value <M>{String.raw`r_d = nV_T/I`}</M>: 25.9 Ω at 1 mA, 2.6 Ω at 10 mA. You will use this <strong>dynamic resistance</strong> constantly in Unit IV.</p>
        <SideNote>
          <p>The reverse current you measure on a real silicon diode is usually much larger than I<sub>s</sub>, because carriers are also generated inside the depletion region. That is why datasheets list “reverse leakage” of nanoamps, not the femtoamps the ideal equation predicts.</p>
        </SideNote>
      </Section>

      <Section n={5} title="Warm diodes need less voltage">
        <p>Heat a diode and I<sub>s</sub> rises steeply because n<sub>i</sub>² does. To keep the same current you need less forward voltage: about <strong>−2 mV per °C</strong> for silicon. Try it in the figure: from 300 K to 350 K, V for 1 mA drops by roughly 90 to 100 mV.</p>
        <Example title="the thermometer inside your laptop">
          <p>Many processors and battery-management chips measure their own temperature with a forward-biased junction fed a fixed small current. Its voltage falls about 2 mV for every degree of warming, a neat, nearly linear thermometer made from nothing more than the equation on this page.</p>
        </Example>
        <p>The same effect is a hazard in power circuits: a hotter diode passes more current, which heats it further. That is why diodes are rarely put in parallel without small balancing resistors.</p>
      </Section>
    </>
  ),
  remember: 'A diode’s current is I = I_s(e^(V/nV_T) − 1): it rises tenfold for every 60 mV of forward bias at room temperature, settles at −I_s in reverse, and its “0.7 V” is just where the current becomes noticeable.',
  quiz: [
    {
      stem: 'At 300 K, how much extra forward voltage does an ideal diode (n = 1) need to increase its current tenfold?',
      options: ['About 26 mV', 'About 60 mV', 'About 0.7 V', 'About 120 mV'],
      answer: 1,
      why: [
        'That is V_T, which gives a factor of e ≈ 2.7, not 10.',
        'V_T × ln10 = 25.85 mV × 2.303 ≈ 59.5 mV.',
        'That is the usual operating voltage, not the step per decade.',
        'That would be the step for n = 2.',
      ],
    },
    {
      stem: 'Under a large reverse bias, the ideal diode current is:',
      options: ['Zero', 'About −I_s, independent of voltage', 'Proportional to the reverse voltage', 'Growing exponentially with reverse voltage'],
      answer: 1,
      why: [
        'Not quite zero: minority carriers still drift across.',
        'e^(V/nV_T) → 0, leaving I = −I_s.',
        'That would be a resistor; the ideal reverse current saturates.',
        'Exponential growth in reverse is breakdown, which this equation does not include.',
      ],
    },
    {
      stem: 'At a fixed current, as a silicon diode warms up, its forward voltage:',
      options: ['Rises by about 2 mV/°C', 'Falls by about 2 mV/°C', 'Stays constant', 'Falls by about 26 mV/°C'],
      answer: 1,
      why: [
        'The sign is wrong: I_s rises, so less voltage is needed.',
        'I_s grows steeply with temperature, so V drops about 2 mV per °C.',
        'The temperature dependence is strong and well known.',
        'Ten times too large.',
      ],
    },
    {
      stem: 'The dynamic resistance of an ideal diode at 2 mA and 300 K is about:',
      options: ['13 Ω', '26 Ω', '350 Ω', '1.3 kΩ'],
      answer: 0,
      why: [
        'r_d = V_T/I = 25.85 mV / 2 mA ≈ 12.9 Ω.',
        'That is the value at 1 mA.',
        'That is V/I = 0.7/0.002, the static resistance, not the dynamic one.',
        'Off by a factor of 100.',
      ],
    },
  ],
  net: {
    questions: [
      {
        tag: 'Numerical',
        stem: 'An ideal silicon diode has I_s = 10⁻¹⁴ A at 300 K (V_T = 25.85 mV). The forward voltage at 1 mA is closest to:',
        options: ['0.60 V', '0.65 V', '0.70 V', '0.75 V'],
        answer: 1,
        why: [
          'This would need I_s about 10⁻¹³ A.',
          'V = V_T ln(I/I_s) = 0.02585 × ln(10¹¹) = 0.02585 × 25.33 ≈ 0.655 V.',
          'At 0.70 V this diode carries about 6 mA.',
          'At 0.75 V this diode carries about 40 mA.',
        ],
      },
      {
        stem: 'A rule often used in NET questions: the reverse saturation current of a silicon diode approximately:',
        options: ['Halves for every 10 °C rise', 'Doubles for every 10 °C rise', 'Doubles for every 1 °C rise', 'Is independent of temperature'],
        answer: 1,
        why: [
          'It rises with temperature, not falls.',
          'This is the standard textbook rule of thumb (it lumps diffusion and generation currents).',
          'Far too fast.',
          'I_s depends strongly on n_i², which depends on temperature.',
        ],
      },
      {
        stem: 'For a diode with ideality factor n = 2 at room temperature, the current rises tenfold for every:',
        options: ['30 mV', '60 mV', '120 mV', '240 mV'],
        answer: 2,
        why: [
          'That would be n = 0.5, which is unphysical.',
          'That is n = 1.',
          'n·V_T·ln10 = 2 × 59.5 mV ≈ 120 mV per decade.',
          'That would be n = 4.',
        ],
      },
    ],
    traps: [
      <>Exam rule: <b>I<sub>s</sub> doubles every 10 °C</b> and <b>V<sub>F</sub> falls ≈ 2 to 2.5 mV/°C</b>. The ideal diffusion model alone predicts a steeper I<sub>s</sub> rise; use the rule NET expects unless the question gives a formula.</>,
      <>Static resistance V/I and dynamic resistance r<sub>d</sub> = nV<sub>T</sub>/I are different. NET options include both.</>,
      <>Cut-in voltages: Si ≈ 0.6 to 0.7 V, Ge ≈ 0.2 to 0.3 V. They are conventions, not thresholds in the equation.</>,
      <>V<sub>T</sub> is 25 to 26 mV at room temperature. Check which value the question uses (25, 25.85, 26 mV) before choosing between close options.</>,
    ],
    formula: String.raw`I = I_s\!\left(e^{V/nV_T}-1\right),\quad r_d=\frac{nV_T}{I},\quad \Delta V_{\text{decade}} = nV_T\ln 10`,
    formulaLabel: 'Diode equation and its two corollaries',
  },
  doneWhen: <>You can sketch a diode’s I–V curve on linear and log axes, mark where 0.7 V comes from, and work out the current change for a 120 mV step and the dynamic resistance at 5 mA without a calculator beyond ln10 ≈ 2.3.</>,
  upNextTeaser: 'The exact equation is precise but slow to use in a circuit. Next: three simpler diode models, ideal, constant drop and piecewise linear, and how much each one gets wrong.',
};
