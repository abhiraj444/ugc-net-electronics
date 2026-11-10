import { PUBLISHED } from './publishedIndex';
/**
 * The full UGC NET Electronic Science (Code 88) map: 10 units, every lesson claim-title.
 * `written: true` marks lessons that have a full page today. Everything else renders as "Coming soon".
 */

export type LessonRef = {
  id: string; // "1-6"
  number: string; // "1.6" or "P1"
  title: string; // claim title
  minutes?: number;
  written?: boolean;
  project?: boolean;
  published?: boolean; // AI-written, reviewed and published to the repo
  custom?: boolean; // a topic added by the learner, not in the official map
};

export type Part = { title: string; milestone: string; lessons: LessonRef[] };

export type Unit = {
  n: number; // 1..10
  roman: string;
  slug: string; // "unit-1"
  title: string;
  short: string;
  scope: string;
  hue: number;
  milestone: string;
  builds: string[]; // what you build (3 bullets)
  parts: Part[];
};

const L = (number: string, title: string, extra: Partial<LessonRef> = {}): LessonRef => ({
  id: number.toLowerCase().replace('.', '-'),
  number,
  title,
  project: number.startsWith('P'),
  ...extra,
});

export const UNITS: Unit[] = [
  {
    n: 1, roman: 'I', slug: 'unit-1', hue: 35, milestone: 'Thinks in bands',
    title: 'Semiconductor physics and devices', short: 'Devices',
    scope: 'Bands, doping, junctions and the devices built from them, from diodes to HEMTs and solar cells.',
    builds: ['A PN junction you can build and bias by hand', 'Fitted diode, Zener and solar-cell curves', 'A one-page device characterisation report'],
    parts: [{
      title: 'Semiconductor physics and devices', milestone: 'Thinks in bands', lessons: [
        L('1.1', 'Semiconductors: materials that can be talked into conducting', { minutes: 14, written: true }),
        L('1.2', 'Energy bands: why atoms in a crystal share their levels', { minutes: 15, written: true }),
        L('1.3', 'Effective mass: an electron that feels lighter inside a crystal', { minutes: 14, written: true }),
        L('1.4', 'Density of states and the Fermi level: seats, and who fills them', { minutes: 18, written: true }),
        L('1.5', 'Doping: a few guests change the whole party', { minutes: 15, written: true }),
        L('1.6', 'PN junction: a border town where charges cross and then stop', { minutes: 18, written: true }),
        L('1.7', 'The diode equation: why current explodes after 0.7 V', { minutes: 16, written: true }),
        L('1.8', 'Diode equivalent circuits: three honest approximations'),
        L('1.9', 'Breakdown: avalanche and Zener, two ways a wall gives way'),
        L('1.10', 'Zener diode: a dam that leaks on purpose'),
        L('1.11', 'Tunnel diode: current that falls as voltage rises'),
        L('1.12', 'Metal–semiconductor junctions: Schottky and ohmic contacts'),
        L('1.13', 'JFET: a hose you pinch with a voltage'),
        L('1.14', 'MOSFET: a gate that summons its own channel'),
        L('1.15', 'Quantum wells, wires and dots: squeezing electrons into fewer dimensions'),
        L('1.16', 'HEMT: electrons on a private highway'),
        L('1.17', 'Solar cells: a PN junction run backwards'),
        L('1.18', 'LEDs, LCDs and flexible displays'),
        L('1.19', 'Materials of the future: graphene, CNT, ZnO, SiC'),
        L('P1', 'Project: characterise a diode, a Zener and a solar cell'),
      ],
    }],
  },
  {
    n: 2, roman: 'II', slug: 'unit-2', hue: 300, milestone: 'Made a chip',
    title: 'IC fabrication, MOS and VLSI', short: 'Fabrication & VLSI',
    scope: 'From sand to a CMOS gate: crystal growth, oxidation, lithography, doping, etching, scaling and layout.',
    builds: ['A cross-section built step by step', 'A CMOS inverter transfer curve', 'A lambda-rule NAND gate layout'],
    parts: [{
      title: 'IC fabrication, MOS and VLSI', milestone: 'Made a chip', lessons: [
        L('2.1', 'From sand to wafer: growing a perfect crystal'),
        L('2.2', 'Epitaxy: laying new crystal on old'),
        L('2.3', 'Oxidation: growing glass on silicon'),
        L('2.4', 'Lithography: printing with light'),
        L('2.5', 'Doping by diffusion and ion implantation'),
        L('2.6', 'Etching: wet is round, dry is straight'),
        L('2.7', 'Isolation, metallisation and bonding'),
        L('2.8', 'Thin films and how we see them: XRD, SEM, TEM, EDX'),
        L('2.9', 'Thin-film passive and active devices'),
        L('2.10', 'MOS capacitor and threshold voltage'),
        L('2.11', 'Scaling: shrink everything, and what breaks'),
        L('2.12', 'NMOS and CMOS fabrication: an n-well story'),
        L('2.13', 'Inverters: NMOS vs CMOS'),
        L('2.14', 'CCD: a bucket brigade for charge'),
        L('2.15', 'Stick diagrams and lambda design rules'),
        L('P2', 'Project: design and lay out a CMOS NAND gate'),
      ],
    }],
  },
  {
    n: 3, roman: 'III', slug: 'unit-3', hue: 230, milestone: 'Solves any network',
    title: 'Network theory, signals and systems', short: 'Networks & Signals',
    scope: 'Network theorems, transients, Laplace and two-ports, then Fourier, sampling, the Z-transform and digital filters.',
    builds: ['A Thevenin reduction of any circuit', 'Bode plots drawn with a ruler and checked', 'A denoised ECG-like signal'],
    parts: [
      {
        title: 'Network theory', milestone: 'Solves any network', lessons: [
          L('3.1', 'Network elements: R, L, C and what each remembers'),
          L('3.2', 'Network graphs: trees, links and loops'),
          L('3.3', 'Nodal and mesh analysis: two ways to write the same story'),
          L('3.4', 'Superposition: switch sources off one at a time'),
          L('3.5', 'Thevenin and Norton: any network is a battery and a resistor'),
          L('3.6', 'Maximum power transfer: matching for power, not efficiency'),
          L('3.7', 'AC analysis with phasors: spinning arrows'),
          L('3.8', 'Transients: how RL and RC circuits settle'),
          L('3.9', 'Laplace transform: turning calculus into algebra'),
          L('3.10', 'Poles, zeros and transfer functions'),
          L('3.11', 'Bode plots: a frequency response drawn with a ruler'),
          L('3.12', 'Two-port parameters: Z, Y, h and ABCD'),
          L('3.13', 'Passive filters'),
          L('3.14', 'State-variable analysis'),
        ],
      },
      {
        title: 'Signals and DSP', milestone: 'Hears in frequencies', lessons: [
          L('3.15', 'Signals: continuous, discrete, and how we describe them'),
          L('3.16', 'Fourier series: every wave is a stack of sines'),
          L('3.17', 'Fourier transform: a prism for signals'),
          L('3.18', 'Sampling theorem: how fast is fast enough'),
          L('3.19', 'Z-transform: the Laplace of the discrete world'),
          L('3.20', 'DFT and FFT: the butterfly that saves time'),
          L('3.21', 'Digital filters: FIR vs IIR'),
          L('P3', 'Project: denoise an ECG-like signal'),
        ],
      },
    ],
  },
  {
    n: 4, roman: 'IV', slug: 'unit-4', hue: 156, milestone: 'Biased it right',
    title: 'Analog electronics', short: 'Analog',
    scope: 'Rectifiers, biasing, amplifiers, feedback, oscillators, op-amps, filters, the 555 and the PLL.',
    builds: ['A 5 V regulated supply', 'A biased CE amplifier with a stable Q-point', 'An op-amp filter you tuned yourself'],
    parts: [{
      title: 'Analog electronics', milestone: 'Biased it right', lessons: [
        L('4.1', 'Rectifiers: letting current flow one way'),
        L('4.2', 'Regulated power supplies and regulator ICs (78xx/LM317)'),
        L('4.3', 'BJT biasing: finding a place to stand (the Q-point)'),
        L('4.4', 'FET biasing'),
        L('4.5', 'Amplifiers: CE, CB, CC and their personalities'),
        L('4.6', 'Classifying amplifiers: class A, B, AB, C'),
        L('4.7', 'Feedback: four ways to tame an amplifier'),
        L('4.8', 'Oscillators: feedback that sustains itself'),
        L('4.9', 'Op-amp: the ideal amplifier and its real flaws'),
        L('4.10', 'Op-amp maths: adders, integrators, differentiators'),
        L('4.11', 'Comparators and Schmitt trigger: decisions with hysteresis'),
        L('4.12', 'Instrumentation amplifier'),
        L('4.13', 'Wave-shaping: clippers and clampers'),
        L('4.14', 'Active filters (Sallen-Key, Butterworth)'),
        L('4.15', 'Multivibrators and the 555'),
        L('4.16', 'PLL: a loop that chases a frequency'),
        L('4.17', 'V/F and F/V converters'),
        L('P4', 'Project: design a 5 V regulated supply and a CE amplifier'),
      ],
    }],
  },
  {
    n: 5, roman: 'V', slug: 'unit-5', hue: 187, milestone: 'Thinks in gates',
    title: 'Digital electronics', short: 'Digital',
    scope: 'Logic families, Boolean algebra, K-maps, combinational and sequential circuits, memories, converters and FPGAs.',
    builds: ['A minimised logic circuit from a K-map', 'A synchronous counter you clocked by hand', 'A traffic-light FSM in Verilog'],
    parts: [{
      title: 'Digital electronics', milestone: 'Thinks in gates', lessons: [
        L('5.1', 'Logic families: TTL, CMOS, ECL compared'),
        L('5.2', 'Logic gates and Boolean algebra'),
        L('5.3', 'Minimisation: K-maps and Quine–McCluskey'),
        L('5.4', 'Combinational circuits: adders, comparators, encoders, MUX/DEMUX'),
        L('5.5', 'PLDs: PROM, PLA, PAL, CPLD'),
        L('5.6', 'Flip-flops: memory from feedback'),
        L('5.7', 'Counters: ripple, synchronous, ring, Johnson'),
        L('5.8', 'Shift registers'),
        L('5.9', 'Memories: ROM, SRAM, DRAM'),
        L('5.10', 'A/D and D/A converters'),
        L('5.11', 'State machines: state variables, tables and diagrams'),
        L('5.12', 'FPGA and HDL'),
        L('P5', 'Project: a traffic-light controller FSM in Verilog'),
      ],
    }],
  },
  {
    n: 6, roman: 'VI', slug: 'unit-6', hue: 270, milestone: 'Speaks assembly',
    title: '8086 microprocessor and 8051 microcontroller', short: '8086 & 8051',
    scope: 'Architecture, segmented memory, addressing modes, interrupts, timers, serial ports and real interfacing.',
    builds: ['A physical-address calculator you trust', 'A timer delay for an 11.0592 MHz crystal', 'A keypad-to-LCD program for the 8051'],
    parts: [{
      title: '8086 and 8051', milestone: 'Speaks assembly', lessons: [
        L('6.1', '8086 architecture: BIU and EU, two workers on one line'),
        L('6.2', 'Segmented memory: segment × 16 + offset'),
        L('6.3', 'Addressing modes'),
        L('6.4', 'Instruction set and programming'),
        L('6.5', 'Interrupts'),
        L('6.6', 'Memory and I/O interfacing'),
        L('6.7', '8051: a computer on one chip'),
        L('6.8', '8051 addressing modes and instruction set'),
        L('6.9', 'Stack, subroutines and interrupts'),
        L('6.10', 'Timers/counters'),
        L('6.11', 'Serial communication and RS-232'),
        L('6.12', 'Interfacing LED/LCD, keyboard, stepper motor'),
        L('P6', 'Project: 8051 program that scans a keypad and drives an LCD'),
      ],
    }],
  },
  {
    n: 7, roman: 'VII', slug: 'unit-7', hue: 350, milestone: 'Sees the field',
    title: 'Electromagnetics, lines, antennas, microwave and radar', short: 'EM & Microwave',
    scope: 'Vector calculus, Maxwell, plane waves, transmission lines, the Smith chart, waveguides, antennas and radar.',
    builds: ['A matched feed for a 2.4 GHz link', 'A link budget in dBm', 'A Smith-chart quarter-wave match'],
    parts: [{
      title: 'Electromagnetics and microwave', milestone: 'Sees the field', lessons: [
        L('7.1', 'Vector calculus you can see: gradient, divergence, curl'),
        L('7.2', "Gauss's law"),
        L('7.3', 'Laplace and Poisson equations'),
        L('7.4', 'Biot–Savart and Ampère'),
        L('7.5', "Faraday's law and induction"),
        L('7.6', "Maxwell's equations: four lines that predict light"),
        L('7.7', 'Plane waves in free space, dielectrics and conductors'),
        L('7.8', 'Poynting theorem: where the energy flows'),
        L('7.9', 'Reflection, refraction and polarization'),
        L('7.10', 'Interference, coherence and diffraction'),
        L('7.11', 'Transmission lines: when a wire becomes a waveguide for voltage'),
        L('7.12', 'Input impedance and the Smith chart'),
        L('7.13', 'Rectangular waveguides: modes and cutoff'),
        L('7.14', 'Antennas: Hertzian dipole and half-wave dipole'),
        L('7.15', 'Friis equation: how much power reaches the receiver'),
        L('7.16', 'Microwave tubes: klystron, magnetron, TWT'),
        L('7.17', 'Solid-state microwave: Gunn, IMPATT, PIN, crystal detector'),
        L('7.18', 'Radar: listening for your own echo'),
        L('P7', 'Project: design a matched feed and a link budget for a 2.4 GHz link'),
      ],
    }],
  },
  {
    n: 8, roman: 'VIII', slug: 'unit-8', hue: 202, milestone: 'Sent a signal',
    title: 'Communication systems', short: 'Communication',
    scope: 'AM, FM, noise, information theory, PCM, digital modulation, multiple access, satellites and optical fibre.',
    builds: ['A QPSK link with a measured bit-error rate', 'A noise-figure cascade', 'A fibre power budget'],
    parts: [{
      title: 'Communication systems', milestone: 'Sent a signal', lessons: [
        L('8.1', 'AM: riding on a carrier'),
        L('8.2', 'FM and PM'),
        L('8.3', 'Demodulation and the superheterodyne receiver'),
        L('8.4', 'Random signals and noise'),
        L('8.5', 'Noise figure and noise temperature'),
        L('8.6', 'Information theory: measuring surprise'),
        L('8.7', 'Error detection and correction'),
        L('8.8', 'PCM: sampling, quantising, encoding'),
        L('8.9', 'ASK, FSK, PSK, BPSK, QPSK, QAM'),
        L('8.10', 'TDM, FDM and multiple access (FDMA/TDMA/CDMA)'),
        L('8.11', 'Data communication: modems and codes'),
        L('8.12', 'Mobile communication: cells and reuse'),
        L('8.13', 'Satellite communication'),
        L('8.14', 'Optical sources: spontaneous vs stimulated emission, LED and laser'),
        L('8.15', 'Detectors: PIN and APD'),
        L('8.16', 'Optical fibres: attenuation and dispersion'),
        L('8.17', 'WDM'),
        L('8.18', 'IoT for communication'),
        L('P8', 'Project: simulate a QPSK link with noise and measure BER'),
      ],
    }],
  },
  {
    n: 9, roman: 'IX', slug: 'unit-9', hue: 95, milestone: 'Closed the loop',
    title: 'Power electronics and control systems', short: 'Power & Control',
    scope: 'Thyristors, power switches, SMPS, motors and UPS, then block diagrams, stability and PID control.',
    builds: ['A firing-angle controlled dimmer', 'A Routh table you can read at a glance', 'A tuned PID speed controller'],
    parts: [{
      title: 'Power electronics and control', milestone: 'Closed the loop', lessons: [
        L('9.1', 'SCR: a switch that stays on once pushed'),
        L('9.2', 'DIAC and TRIAC'),
        L('9.3', 'Power transistors (BJT, MOSFET, IGBT)'),
        L('9.4', 'Protecting thyristors: dv/dt, di/dt, snubbers, fuses'),
        L('9.5', 'Triggering: single pulse vs pulse train'),
        L('9.6', 'DC and AC motors: construction and speed control'),
        L('9.7', 'SMPS: switching instead of burning'),
        L('9.8', 'UPS: online vs offline'),
        L('9.9', 'Open-loop vs closed-loop control'),
        L('9.10', 'Block diagram reduction and signal flow graphs'),
        L('9.11', 'Stability: Routh–Hurwitz'),
        L('9.12', 'Nyquist plot'),
        L('9.13', 'On-off, P, PI, PD, PID controllers'),
        L('P9', 'Project: tune a PID speed controller for a DC motor'),
      ],
    }],
  },
  {
    n: 10, roman: 'X', slug: 'unit-10', hue: 15, milestone: 'Measured it right',
    title: 'Instrumentation, measurement and sensors', short: 'Instrumentation',
    scope: 'Transducers, bridges, meters, oscilloscopes, spectrum analysers, biomedical instruments and MEMS.',
    builds: ['A balanced Wheatstone bridge', 'A thermocouple vs RTD comparison', 'A temperature logger, sensor to 8051'],
    parts: [{
      title: 'Instrumentation and sensors', milestone: 'Measured it right', lessons: [
        L('10.1', 'Transducers: turning the world into volts'),
        L('10.2', 'Strain gauges and the Wheatstone bridge'),
        L('10.3', 'LVDT and capacitive sensors'),
        L('10.4', 'Piezoelectric and Hall-effect sensors'),
        L('10.5', 'Temperature: thermocouple, RTD, thermistor'),
        L('10.6', 'Measuring displacement, velocity, acceleration, force, torque, pressure, flow, humidity, thickness, pH'),
        L('10.7', 'Bridges for R, L and C (Wheatstone, Kelvin, Maxwell, Hay, Schering, Wien)'),
        L('10.8', 'Potentiometers and measuring V, I, power, energy'),
        L('10.9', 'Digital multimeter'),
        L('10.10', 'CRO and DSO'),
        L('10.11', 'Spectrum analyser'),
        L('10.12', 'Biomedical instruments: ECG, EEG, blood pressure'),
        L('10.13', 'MEMS and sensors for IoT'),
        L('P10', 'Project: design a temperature logger (sensor → amp → ADC → 8051)'),
      ],
    }],
  },
];

// Lessons published from the AI layer become live; published custom topics join their unit as an extra part.
for (const pub of PUBLISHED) {
  const u = UNITS.find((x) => x.slug === pub.unit);
  if (!u) continue;
  const existing = u.parts.flatMap((p) => p.lessons).find((l) => l.id === pub.id);
  if (existing) { existing.written = true; existing.published = true; existing.minutes = existing.minutes ?? pub.minutes; continue; }
  let part = u.parts.find((p) => p.title === 'Added topics');
  if (!part) { part = { title: 'Added topics', milestone: u.milestone, lessons: [] }; u.parts.push(part); }
  part.lessons.push({ id: pub.id, number: pub.number, title: pub.title, minutes: pub.minutes, written: true, published: true, custom: true });
}

export const allLessons = (u: Unit) => u.parts.flatMap((p) => p.lessons);
export const unitBySlug = (slug: string) => UNITS.find((u) => u.slug === slug);
export const lessonHref = (u: Unit, l: LessonRef) => `/course/${u.slug}/${l.id}/`;
export const WRITTEN = UNITS.flatMap((u) => allLessons(u).filter((l) => l.written).map((l) => ({ unit: u, lesson: l })));
export const totalLessons = UNITS.reduce((s, u) => s + allLessons(u).length, 0);

export function findLesson(id: string) {
  for (const u of UNITS) {
    const ls = allLessons(u);
    const i = ls.findIndex((l) => l.id === id);
    if (i >= 0) return { unit: u, lesson: ls[i], index: i, prev: ls[i - 1], next: ls[i + 1] };
  }
  return undefined;
}
