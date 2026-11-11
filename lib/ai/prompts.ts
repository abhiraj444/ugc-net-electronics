'use client';
import { kvGet, kvSet } from './db';

/** Versioned prompt templates. Settings -> Advanced can override any of them; Reset restores these. */
export const PROMPT_VERSION = 'v1.2';

export const DEFAULT_PROMPTS: Record<string, { label: string; text: string }> = {
  system: {
    label: 'House style (system prompt for every call)',
    text: `You write lessons for "Beyond Memorising", a visual course for UGC NET Electronic Science (Paper 2, Code 88), read mostly on phones by Indian students.
House style, mandatory:
- Plain words, short sentences, second person ("you"). A Class 12 student must follow every paragraph.
- Intuition, then picture, then number, then formula. Never open with a definition or an equation.
- One new term at a time: **bold** it on first use and gloss it immediately in plain words.
- One metaphor per idea; do not mix metaphors.
- Real numbers with SI units and typical values (Si band gap 1.12 eV at 300 K; kT/q = 25.85 mV at 300 K).
- Admit limits of every model or figure.
- Section titles are questions or verb phrases. Lesson titles are claims: "Concept: plain-language claim".
- KaTeX only: inline $...$, display $$...$$. No \\begin{align}, no HTML, no emojis.
- Never invent previous-year questions (PYQs), statistics, exam dates or sources. Practice questions are labelled practice.
- Indian context welcome in examples (230 V 50 Hz mains, Indian Railways, ISRO, Jio 5G bands).
Learner level: {{level}}. Language: {{language}}.`,
  },
  outline: {
    label: 'Step 1 · Outline',
    text: `TASK: outline
Plan the lesson below. Output NDJSON only (one JSON object per line, no code fences, no prose):
line 1: {"type":"meta","dek":"2-3 sentences: what it is, why it matters, how it connects","netWeight":"High|Medium|Low","minutes":12-25,"buildsOn":["lesson ids from the list below"]}
line 2: {"type":"hook","text":"1-2 paragraphs, an everyday scene in second person, no equations"}
then 4 or 5 lines: {"type":"plan","title":"section title (question or verb)","goal":"what this section teaches, one sentence","figure":"figure id from the catalogue, \"diagram\" for a Mermaid flowchart, or none"}
Exactly one section should be the interactive "Try it" section with a figure.

{{context}}`,
  },
  section: {
    label: 'Step 2 · One section',
    text: `TASK: section
Write section {{n}} of the lesson: "{{title}}". Goal: {{goal}}. Planned figure: {{figure}}.
Output NDJSON only, one block per line, no code fences. A Mermaid diagram goes in ONE "diagram" block whose "code" is a single JSON string with \\n escapes; never put Mermaid lines on their own lines. The FIRST line must be {"type":"section","title":"{{title}}"}.
Then 3-8 blocks: paragraphs (2-4 short sentences each), and where useful one of: yourGuess (before the figure that answers it), tryThis + figure (or diagram) + describe (always in that order), equationCard, example, sideNote.
Do not write the quiz, remember, NET corner or done-when here.
Already written sections: {{done}}

{{context}}`,
  },
  quizNet: {
    label: 'Step 3 · Quiz and NET corner',
    text: `TASK: quiz
Write the closing blocks of this lesson. Output NDJSON only, exactly these 5 lines in order:
{"type":"remember",...} one sentence, the thing to know a year from now
{"type":"quiz",...} 4 MCQs, 4 options each, one correct, distractors are real misconceptions, a one-line why for EVERY option
{"type":"netCorner",...} 3 exam-style questions in UGC NET Paper 2 style, at least one tagged "Numerical" with a "numeric" object whose formula, inputs and answer are consistent (the app recomputes it); 3-4 exam traps; one formula to memorise
{"type":"doneWhen",...} an observable test the learner can do
{"type":"upNext","teaser":"..."} two sentences teasing the next lesson: {{next}}

Lesson so far (for consistency):
{{lesson}}

{{context}}`,
  },
  check: {
    label: 'Step 4 · Check pass',
    text: `TASK: check
You are the reviewer. Read the lesson blocks below (numbered from 0). Find factual errors, wrong numbers, wrong units, quiz answers that are not actually correct, "why" lines that contradict the answer, broken KaTeX, and house-style violations.
Output NDJSON only, one line per real issue, at most 8 lines:
{"type":"issue","block":<index>,"severity":"high|low","problem":"short description","fix":<the complete corrected block object, or null>}
If there are no issues, output exactly: {"type":"issue","block":0,"severity":"low","problem":"No issues found.","fix":null}

{{lesson}}`,
  },
  repair: {
    label: 'Repair one line',
    text: `TASK: repair
This line was supposed to be one JSON object matching the lesson block schema, but it failed: {{error}}
Line:
{{line}}
Return ONLY the corrected single-line JSON object. No code fences, no explanation.

Schema:
{{schema}}`,
  },
  topicTree: {
    label: 'Add a topic / Go deeper',
    text: `TASK: topics
The learner wants to go deeper into: "{{query}}"{{anchor}}.
Return a topic tree as ONE JSON object (no code fences, no prose):
{"root":"short name","nodes":[{"title":"Concept: plain-language claim","why":"why it matters for UGC NET, one sentence","prerequisites":["..."],"netWeight":"High|Medium|Low","minutes":10-25,"children":[ ...same shape, at most one more level... ]}]}
3 to 7 top-level nodes. Each node must be teachable as ONE lesson. Order them in dependency order.
Do NOT repeat any of these existing lessons: {{existing}}

{{context}}`,
  },
  practice: {
    label: 'Practice set for a unit',
    text: `TASK: practice
Write {{count}} practice MCQs for Unit {{unit}} ({{unitTitle}}) in UGC NET Paper 2 style. About half numerical.
These are PRACTICE questions written for this course, never previous-year questions.
Output NDJSON only, one question per line:
{"type":"mcq","lesson":"lesson number it tests, e.g. 2.4","stem":"...","options":[4],"answer":0-3,"why":[4 reasons],"tag":"Numerical (only for numericals)","numeric":{"formula":"mathjs expression","inputs":{...},"answer":number,"unit":"..."} (numericals only)}
State any constant the question relies on (e.g. n_i, kT/q).
Lessons in this unit: {{lessons}}`,
  },
  remix: {
    label: 'Remix a section',
    text: `TASK: remix
Mode: {{mode}}.
- simpler: rewrite the section's paragraphs in simpler words and shorter sentences, same facts, same block types.
- example: add ONE new "example" block with a fresh real-world instance (Indian context welcome).
- hinglish: rewrite the section's prose in Hinglish (Hindi in Roman script mixed with English technical terms), keep maths and terms in English.
Output NDJSON only, one block per line, no code fences. For simpler and hinglish, output the full replacement blocks of the section starting with its {"type":"section"} line.
Section blocks:
{{section}}`,
  },
  doubt: {
    label: 'Ask a doubt',
    text: `You are a patient tutor inside a lesson of a UGC NET Electronic Science course. Answer the learner's doubt in short paragraphs using the house style. Use KaTeX ($...$) for maths. If the doubt is outside the lesson, answer briefly and point back. Never invent PYQs.
Lesson: {{title}}
Current section: {{section}}
Lesson text (trimmed):
{{lesson}}`,
  },
};

export async function getPrompts(): Promise<Record<string, string>> {
  const over = await kvGet<Record<string, string>>('prompts', {});
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries({ ...DEFAULT_PROMPTS, ...DEFAULT_MD_PROMPTS })) out[k] = over[k] ?? v.text;
  return out;
}
export async function setPrompt(key: string, text: string | null) {
  const over = await kvGet<Record<string, string>>('prompts', {});
  if (text === null) delete over[key]; else over[key] = text;
  await kvSet('prompts', over);
}

export function fill(t: string, vars: Record<string, string | number>) {
  return t.replace(/\{\{(\w+)\}\}/g, (_, k) => (k in vars ? String(vars[k]) : ''));
}

export type Learner = { level: 'beginner' | 'intermediate' | 'exam-ready'; language: 'English' | 'Hinglish' };
export const getLearner = () => kvGet<Learner>('learner', { level: 'beginner', language: 'English' });

/* ---------------- Markdown output format (default) ---------------- */

export type OutputFormat = 'md' | 'jsonl';
export const OUTPUT_FORMATS: { id: OutputFormat; label: string; note: string }[] = [
  { id: 'md', label: 'Markdown (recommended)', note: 'Models write natural Markdown with small YAML blocks; fewer broken blocks, diagrams stay intact.' },
  { id: 'jsonl', label: 'JSON lines (legacy)', note: 'One JSON object per line. Kept for models that follow it well.' },
];
export const getOutputFormat = () => kvGet<OutputFormat>('outputFormat', 'md');
export const setOutputFormat = (f: OutputFormat) => kvSet('outputFormat', f);

/**
 * Markdown block reference. Lines starting "@@diagram " are dropped unless figure mode is "all";
 * lines starting "@@figure " are dropped in "text" mode (see promptForMd in figureMode.ts).
 */
export const MD_SCHEMA_DOC = `Write plain Markdown. Prose uses **bold**, *italic*, "- " lists, a blank line between paragraphs, KaTeX inline $...$ and display $$...$$. No HTML, no \\begin{align}.
## Section title                    starts a section (question or verb phrase)
A paragraph                         2-4 short sentences; a blank line ends it
:::hook ... :::                     everyday scene, second person, no equations
:::example Title ... :::            real-world instance (Indian context welcome); the title goes on the opening line
:::sidenote ... :::                 corrects a common misconception
:::guess                            a prediction, placed before the figure that answers it:
question text, then a line with only ---, then the reveal, then :::
@@figure :::tryThis ... :::                 one instruction right before a figure
@@figure :::describe ... :::                after every figure or diagram: what it shows, controls, where numbers come from, limits
:::remember ... :::                 one sentence
:::doneWhen ... :::                 an observable test
:::upNext ... :::                   two sentences
Every ::: container is closed by a line with only :::. Never nest containers.
Structured blocks are fenced code blocks with a YAML body. In YAML, wrap any string containing maths, a colon, a backslash or starting with * in single quotes ('...'); inside single quotes a backslash is literal, so write \\frac, not \\\\frac.
\`\`\`equation   title, tex, symbols (list of {s, name, unit}), typical
\`\`\`quiz       a YAML list of questions: stem, options (4), answer (0-3), why (4, one reason per option)
\`\`\`net        questions (same as quiz, plus tag: Numerical and numeric: {formula, inputs, answer, unit} for numericals), traps (list), formula (TeX), formulaLabel
@@figure \`\`\`figure     id (from the catalogue), title, label, params
@@figure \`\`\`plot       title, label, x {name, min, max, label}, y {label, min, max}, curves (list of {expr, label}), sliders (list of {name, label, min, max, step, value, unit}), readouts (list of {label, expr, unit}); mathjs expressions (exp, log = ln, log10, sqrt, ^); only the x name and slider names are in scope
@@diagram \`\`\`mermaid Title   a Mermaid flowchart when no catalogue figure fits: "flowchart TD" or "flowchart LR", short labels (2-4 words, brackets inside quotes like A["Holes (majority)"]), at most 12 nodes, no style/classDef/linkStyle lines
@@figure Figure catalogue: pn-junction params {NA, ND, T} (abrupt junction builder) · diode-iv (n, Is, T) · doping · effective-mass · energy-bands · fermi-filling · thermal-lattice · plot (use the plot fence).
@@diagram For anything else draw a mermaid diagram, not a figure.`;

export const DEFAULT_MD_PROMPTS: Record<string, { label: string; text: string }> = {
  sectionMd: {
    label: 'Step 2 · One section (Markdown)',
    text: `TASK: section
Write section {{n}} of the lesson: "{{title}}". Goal: {{goal}}.
@@figure Planned figure: {{figure}}.
Output Markdown only, no preamble and no wrapping code fence. The first line must be: ## {{title}}
Then 3-8 blocks: paragraphs (2-4 short sentences each), and where useful one of: a :::guess (before the figure that answers it), an equation fence, a :::example, a :::sidenote.
@@figure For a figure: :::tryThis, then the figure or plot fence, then :::describe (always in that order).
@@diagram For a flowchart: the mermaid fence, then :::describe.
Do not write the quiz, remember, NET corner or done-when here.
Already written sections: {{done}}

{{context}}`,
  },
  quizNetMd: {
    label: 'Step 3 · Quiz and NET corner (Markdown)',
    text: `TASK: quiz
Write the closing blocks of this lesson. Output Markdown only, exactly these 5 blocks in order, nothing else:
:::remember  one sentence, the thing to know a year from now
\`\`\`quiz  4 MCQs, 4 options each, one correct, distractors are real misconceptions, a one-line why for EVERY option
\`\`\`net  3 exam-style questions in UGC NET Paper 2 style, at least one tagged Numerical with a numeric object whose formula, inputs and answer are consistent (the app recomputes it); 3-4 traps; one formula to memorise and its formulaLabel
:::doneWhen  an observable test the learner can do
:::upNext  two sentences teasing the next lesson: {{next}}

Lesson so far (for consistency):
{{lesson}}

{{context}}`,
  },
  repairMd: {
    label: 'Repair one block (Markdown)',
    text: `TASK: repair
This Markdown block from section "{{section}}" failed: {{error}}
Block:
{{block}}
Return ONLY the corrected block in the same Markdown format (a ::: container or a fenced YAML/mermaid block), nothing else.

Format:
{{schema}}`,
  },
};
