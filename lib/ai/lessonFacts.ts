// Remember lines and key equations of the hand-written lessons, sent as context when AI writes lessons that build on them.
export const LESSON_FACTS: Record<string, { remember: string; equations: string[] }> = {
 "1-1": {
  "remember": "A semiconductor conducts because heat, light or impurities free a few electrons from their bonds, and each freed electron leaves a hole that also carries current.",
  "equations": [
   "n_i \\propto T^{3/2}\\,e^{-E_g/2kT},\\qquad \\sigma_i = q\\,n_i(\\mu_n+\\mu_p)",
   "\\sigma = q\\,(n\\,\\mu_n + p\\,\\mu_p) \\;\\xrightarrow{\\;n = p = n_i\\;}\\; \\sigma_i = q\\,n_i\\,(\\mu_n+\\mu_p)"
  ]
 },
 "1-2": {
  "remember": "In a crystal each atomic level spreads into a band of N closely spaced levels, and the forbidden gap between the full valence band and the empty conduction band, 1.12 eV in silicon, sets how a solid conducts.",
  "equations": [
   "\\lambda_c\\,[\\mu\\text{m}] = \\frac{1.24}{E_g\\,[\\text{eV}]}",
   "\\lambda_c = \\frac{hc}{E_g} \\approx \\frac{1.24}{E_g\\,[\\text{eV}]}\\ \\mu\\text{m}"
  ]
 },
 "1-3": {
  "remember": "Effective mass is set by the curvature of the band, m* = ħ²/(d²E/dk²): a sharply curved band means a light, fast carrier, which is why GaAs electrons (0.067 m₀) are so quick.",
  "equations": [
   "m^{*} = \\frac{\\hbar^2}{d^2E/dk^2},\\qquad v_g = \\frac{1}{\\hbar}\\frac{dE}{dk},\\qquad \\mu = \\frac{q\\tau}{m^{*}}",
   "m^{*} = \\frac{\\hbar^{2}}{\\;d^{2}E/dk^{2}\\;}"
  ]
 },
 "1-4": {
  "remember": "Carriers are seats times chance: add up g(E)·f(E), and wherever the Fermi level sits, the product n·p stays equal to nᵢ².",
  "equations": [
   "f(E)=\\frac{1}{1+e^{(E-E_F)/kT}},\\quad n=N_c e^{-(E_c-E_F)/kT},\\quad np=n_i^2",
   "f(E) = \\frac{1}{1 + e^{(E - E_F)/kT}}",
   "n = N_c\\,e^{-(E_c - E_F)/kT},\\qquad p = N_v\\,e^{-(E_F - E_v)/kT}"
  ]
 },
 "1-5": {
  "remember": "Doping sets the majority carrier count (n ≈ N_D or p ≈ N_A), the mass-action law n·p = nᵢ² crushes the minority carriers, and the Fermi level moves about 60 meV toward the band edge for every tenfold increase in doping.",
  "equations": [
   "np=n_i^2,\\quad n\\approx N_D,\\quad p=\\frac{n_i^2}{N_D},\\quad E_F-E_i=kT\\ln\\frac{N_D}{n_i}",
   "n\\,p = n_i^{2},\\qquad E_F - E_i = kT\\,\\ln\\!\\frac{n}{n_i} \\approx kT\\,\\ln\\!\\frac{N_D}{n_i}"
  ]
 },
 "1-6": {
  "remember": "At a PN junction, diffusion builds a field until drift cancels it, leaving a depletion region and a built-in potential of roughly 0.6 to 0.8 V in silicon.",
  "equations": [
   "W=\\sqrt{\\frac{2\\varepsilon_s}{q}\\,(V_{bi}-V)\\left(\\frac{1}{N_A}+\\frac{1}{N_D}\\right)},\\quad N_A x_p = N_D x_n",
   "V_{bi} = \\frac{kT}{q}\\,\\ln\\!\\left(\\frac{N_A N_D}{n_i^{2}}\\right)"
  ]
 },
 "1-7": {
  "remember": "A diode’s current is I = I_s(e^(V/nV_T) − 1): it rises tenfold for every 60 mV of forward bias at room temperature, settles at −I_s in reverse, and its “0.7 V” is just where the current becomes noticeable.",
  "equations": [
   "I = I_s\\!\\left(e^{V/nV_T}-1\\right),\\quad r_d=\\frac{nV_T}{I},\\quad \\Delta V_{\\text{decade}} = nV_T\\ln 10",
   "I = I_s\\left(e^{V/nV_T} - 1\\right),\\qquad V_T = \\frac{kT}{q}"
  ]
 }
};
