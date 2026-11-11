import { z } from 'zod';

/**
 * The lesson block schema. AI writes JSON that matches this; the same components that draw the
 * hand-written lessons draw it. Text fields are a Markdown subset with KaTeX ($..$ and $$..$$).
 */

const md = z.string().min(1);

export const McqSchema = z.object({
  stem: md,
  options: z.array(z.string().min(1)).length(4),
  answer: z.number().int().min(0).max(3),
  why: z.array(z.string().min(1)).length(4),
  tag: z.string().optional(),
});

export const NumericSchema = z.object({
  formula: z.string().min(1), // mathjs expression using the input names
  inputs: z.record(z.string(), z.number()),
  answer: z.number(),
  unit: z.string().optional(),
});

export const NetQuestionSchema = McqSchema.extend({ numeric: NumericSchema.optional() });

export const SliderSchema = z.object({
  name: z.string().regex(/^[A-Za-z][A-Za-z0-9_]*$/),
  label: z.string(),
  min: z.number(),
  max: z.number(),
  step: z.number().positive().optional(),
  value: z.number(),
  unit: z.string().optional(),
});

export const PlotSpecSchema = z.object({
  x: z.object({ name: z.string().regex(/^[A-Za-z][A-Za-z0-9_]*$/), min: z.number(), max: z.number(), label: z.string() }),
  y: z.object({ label: z.string(), min: z.number().optional(), max: z.number().optional() }),
  curves: z.array(z.object({ expr: z.string().min(1), label: z.string().optional() })).min(1).max(4),
  sliders: z.array(SliderSchema).max(4).default([]),
  readouts: z.array(z.object({ label: z.string(), expr: z.string(), unit: z.string().optional() })).max(4).optional(),
  caption: z.string().optional(),
});

export const FIGURE_IDS = ['pn-junction', 'diode-iv', 'doping', 'effective-mass', 'energy-bands', 'fermi-filling', 'thermal-lattice', 'plot', 'diagram'] as const;

export const FigureSchema = z.object({
  type: z.literal('figure'),
  figure: z.enum(FIGURE_IDS),
  title: z.string().optional(),
  label: z.string().optional(),
  params: z.record(z.string(), z.union([z.number(), z.string()])).optional(),
  plot: PlotSpecSchema.optional(),
  diagram: z.string().optional(), // static labelled description when nothing in the catalogue fits
}).superRefine((f, ctx) => {
  if (f.figure === 'plot' && !f.plot) ctx.addIssue({ code: 'custom', message: 'figure "plot" needs a "plot" spec' });
  if (f.figure === 'diagram' && !f.diagram) ctx.addIssue({ code: 'custom', message: 'figure "diagram" needs a "diagram" text' });
});

export const BlockSchema = z.union([
  z.object({ type: z.literal('hook'), text: md }),
  z.object({ type: z.literal('section'), title: md }),
  z.object({ type: z.literal('paragraph'), text: md }),
  z.object({
    type: z.literal('equationCard'), title: md, tex: md,
    symbols: z.array(z.object({ s: z.string(), name: z.string(), unit: z.string().optional() })).min(1),
    typical: md,
  }),
  z.object({ type: z.literal('example'), title: md, text: md }),
  z.object({ type: z.literal('sideNote'), text: md }),
  z.object({ type: z.literal('yourGuess'), question: md, answer: md }),
  z.object({ type: z.literal('tryThis'), text: md }),
  FigureSchema,
  z.object({ type: z.literal('diagram'), code: z.string().min(1), title: z.string().optional(), label: z.string().optional() }), // Mermaid flowchart
  z.object({ type: z.literal('describe'), text: md }),
  z.object({ type: z.literal('remember'), text: md }),
  z.object({ type: z.literal('quiz'), questions: z.array(McqSchema).min(1).max(8) }),
  z.object({
    type: z.literal('netCorner'),
    questions: z.array(NetQuestionSchema).min(1).max(6),
    traps: z.array(md).min(1),
    formula: md,
    formulaLabel: md,
  }),
  z.object({ type: z.literal('doneWhen'), text: md }),
  z.object({ type: z.literal('upNext'), teaser: md }),
]);

export type Block = z.infer<typeof BlockSchema>;
export type Mcq = z.infer<typeof McqSchema>;
export type NetQuestion = z.infer<typeof NetQuestionSchema>;
export type PlotSpec = z.infer<typeof PlotSpecSchema>;
export type FigureBlock = z.infer<typeof FigureSchema>;

/** A block as stored: the validated block plus bookkeeping. `raw` blocks are lines that failed validation and repair. */
export type StoredBlock = (Block | { type: 'raw'; text: string; error: string }) & {
  _id: string;
  _step?: string; // which pipeline step produced it
  _ai?: string; // model that wrote it
  _flags?: string[]; // warnings (numeric mismatch etc.)
};

/** Outline step lines. */
export const MetaLineSchema = z.object({
  type: z.literal('meta'),
  dek: md,
  netWeight: z.enum(['High', 'Medium', 'Low']),
  minutes: z.number().int().min(5).max(40),
  buildsOn: z.array(z.string()).default([]),
});
export const PlanLineSchema = z.object({
  type: z.literal('plan'),
  title: md,
  goal: md,
  figure: z.string().optional(),
});
export const OutlineLineSchema = z.union([MetaLineSchema, PlanLineSchema, z.object({ type: z.literal('hook'), text: md })]);

export const CheckLineSchema = z.object({
  type: z.literal('issue'),
  block: z.number().int().min(0),
  severity: z.enum(['high', 'low']),
  problem: md,
  fix: z.unknown().optional(),
});
export const PracticeLineSchema = McqSchema.extend({ type: z.literal('mcq'), lesson: z.string().optional(), numeric: NumericSchema.optional() });

/** A full lesson document: what /study renders, what gets published to content/published/<id>.json. */
export type LessonDoc = {
  id: string;
  unit: string; // unit slug, or "" for "My topics"
  number: string;
  title: string;
  dek: string;
  netWeight: 'High' | 'Medium' | 'Low';
  minutes: number;
  buildsOn: string[];
  blocks: StoredBlock[];
  meta?: { model?: string; source?: 'ai' | 'human'; generatedAt?: number; publishedAt?: number; custom?: boolean; topicId?: string };
};

export function zodMessage(e: unknown) {
  if (e instanceof z.ZodError) return e.issues.slice(0, 4).map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ');
  return e instanceof Error ? e.message : String(e);
}

/** Short schema description used inside prompts. Kept in sync with the zod schema above. */
export const SCHEMA_DOC = `Each line is ONE JSON object with a "type". Text fields use Markdown (**bold**, *italic*, "- " lists, blank line between paragraphs) and KaTeX: inline $...$, display $$...$$. No HTML. Never use \\begin{align}.
{"type":"hook","text":md}                       everyday scene, second person, no equations
{"type":"section","title":str}                  starts a numbered section; title is a question or a verb phrase
{"type":"paragraph","text":md}                  2-4 short sentences
{"type":"equationCard","title":str,"tex":tex,"symbols":[{"s":tex,"name":str,"unit":str}],"typical":md}
{"type":"example","title":str,"text":md}        real-world instance (Indian context welcome)
{"type":"sideNote","text":md}                   corrects a common misconception
{"type":"yourGuess","question":md,"answer":md}  a prediction, placed before the figure that answers it
{"type":"tryThis","text":md}                    instruction right before a figure
{"type":"figure","figure":id,"title":str,"label":str,"params":{...}}  id from the figure catalogue
{"type":"figure","figure":"plot","title":str,"label":str,"plot":{"x":{"name":"V","min":0,"max":1,"label":"V (volts)"},"y":{"label":"I (mA)"},"curves":[{"expr":"Is*(exp(V/Vt)-1)*1e3","label":"I"}],"sliders":[{"name":"Vt","label":"Thermal voltage","min":0.02,"max":0.04,"step":0.001,"value":0.02585,"unit":"V"}],"readouts":[{"label":"I at 0.7 V","expr":"Is*(exp(0.7/Vt)-1)*1e3","unit":"mA"}]}}
{"type":"diagram","title":str,"code":mermaid}   a Mermaid flowchart when no catalogue figure fits: "flowchart TD" or "flowchart LR" only, short labels (2-4 words, put any brackets inside quotes like A["Holes (majority)"]), at most 12 nodes, no style/classDef/linkStyle lines. The whole diagram is ONE JSON string on ONE line, newlines written as \n.
{"type":"describe","text":md}                   after every figure or diagram: what it shows, controls, where numbers come from, limits
{"type":"remember","text":str}                  one sentence
{"type":"quiz","questions":[{"stem":str,"options":[4 str],"answer":0-3,"why":[4 str, one reason per option]}]}
{"type":"netCorner","questions":[{...mcq, "tag":"Numerical", "numeric":{"formula":"kT*log(NA*ND/ni^2)","inputs":{"kT":0.02585,"NA":1e17,"ND":1e16,"ni":1e10},"answer":0.774,"unit":"V"}}],"traps":[md],"formula":tex,"formulaLabel":str}
{"type":"doneWhen","text":md}                   an observable test
{"type":"upNext","teaser":str}                  two sentences
Plot expressions use mathjs syntax (exp, log = natural log, log10, sqrt, sin, cos, pi, ^). Only the x name and slider names are in scope.
Figure catalogue: ${'pn-junction'} params {NA,ND,T} (abrupt junction builder with charge/field/potential/bands) · diode-iv (diode I-V with n, Is, T) · doping (donor/acceptor lattice) · effective-mass (E-k curvature) · energy-bands (levels splitting into bands) · fermi-filling (Fermi-Dirac filling) · thermal-lattice (bonds breaking with temperature) · plot (generic, see above). For anything else use a "diagram" block (Mermaid), not a figure.`;
