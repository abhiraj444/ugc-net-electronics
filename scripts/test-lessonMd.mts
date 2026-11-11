// Unit tests for lib/ai/lessonMd.ts. Run: node --experimental-strip-types scripts/test-lessonMd.mts
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { MdBlockStream, mdUnitToBlock, parseMd, blocksToMd, previewOfMd, type MdUnit } from '../lib/ai/lessonMd.ts';

let pass = 0, fail = 0;
function t(name: string, fn: () => void) {
  try { fn(); pass++; console.log('PASS', name); } catch (e) { fail++; console.log('FAIL', name, '·', (e as Error).message.split('\n').slice(0, 6).join(' | ')); }
}
const conv = (us: MdUnit[]) => us.map((u) => { const c = mdUnitToBlock(u); return c.ok ? c.block : { type: 'ERR', error: c.error, text: u.text }; });

const SAMPLE = `## Why does a junction form a wall?

Electrons near the junction **diffuse** into the p side. Each one leaves a fixed $+$ ion behind.

- holes go one way
- electrons go the other

$$
V_0 = \\frac{kT}{q}\\ln\\frac{N_A N_D}{n_i^2}

$$

:::guess
What happens to the wall if you dope both sides ten times harder?
---
It gets **thinner**: $W \\propto 1/\\sqrt{N}$.
:::

:::example Jio 5G handset
The RF switch in your phone is a PIN diode.

\`\`\`text
:::
\`\`\`
Still inside the example.
:::

\`\`\`mermaid Charge flow
flowchart LR
  A["n side"] --> B["depletion region"]

  B --> C["p side"]
\`\`\`

\`\`\`equation
title: Built-in potential
tex: "V_0 = \\frac{kT}{q}\\ln\\frac{N_A N_D}{n_i^2}"
symbols:
  - {s: 'N_A', name: acceptor density, unit: cm^-3}
typical: '$V_0 \\approx 0.7$ V for silicon'
\`\`\`

\`\`\`quiz
- stem: 'Which side is positive?'
  options: [n side, p side, both, neither]
  answer: A
  why: [Donor ions are positive., No., No., No.]
\`\`\`

:::remember
The wall is made of ions that cannot move.
:::
`;

t('whole-document parse: block types in order', () => {
  const bs = conv(parseMd(SAMPLE));
  assert.deepEqual(bs.map((b) => b.type), ['section', 'paragraph', 'paragraph', 'paragraph', 'yourGuess', 'example', 'diagram', 'equationCard', 'quiz', 'remember']);
});

t('fields: guess split, example title, mermaid title+blank line, quiz letter answer', () => {
  const bs = conv(parseMd(SAMPLE)) as Record<string, any>[];
  assert.match(bs[4].question, /ten times harder/); assert.match(bs[4].answer, /thinner/);
  assert.equal(bs[5].title, 'Jio 5G handset'); assert.match(bs[5].text, /Still inside/); assert.match(bs[5].text, /```text\n:::\n```/);
  assert.equal(bs[6].title, 'Charge flow'); assert.match(bs[6].code, /\n\n  B --> C/);
  assert.equal(bs[8].questions[0].answer, 0);
  assert.equal(bs[3].text.includes('n_i^2'), true); // display maths with a blank line stays one paragraph
});

t('LaTeX inside YAML double quotes survives (\\frac, \\ln)', () => {
  const eq = conv(parseMd(SAMPLE)).find((b) => b.type === 'equationCard') as any;
  assert.equal(eq.tex, 'V_0 = \\frac{kT}{q}\\ln\\frac{N_A N_D}{n_i^2}');
});

t('every chunk size 1..40 gives the same blocks as one push', () => {
  const ref = JSON.stringify(conv(parseMd(SAMPLE)));
  for (let n = 1; n <= 40; n++) {
    const s = new MdBlockStream(); const us: MdUnit[] = [];
    for (let i = 0; i < SAMPLE.length; i += n) us.push(...s.push(SAMPLE.slice(i, i + n)));
    us.push(...s.flush());
    assert.equal(JSON.stringify(conv(us)), ref, `chunk ${n}`);
  }
});

t('split mid-fence: nothing emitted until the fence closes, then emitted at once', () => {
  const s = new MdBlockStream();
  assert.equal(s.push('## A\n\nPara one.\n\n```quiz\n- stem: x\n').map((u) => u.kind).join(), 'section,paragraph');
  assert.equal(s.push('  options: [a, b, c, d]\n\n  answer: 1\n## not a heading\n:::hook\n').length, 0, 'boundaries ignored inside fence');
  assert.equal(s.openKind, 'fence');
  assert.equal(previewOfMd(s.partial), 'Writing the quiz…');
  const us = s.push('  why: [a, b, c, d]\n```\n');
  assert.equal(us.length, 1); assert.equal(us[0].kind, 'fence');
});

t('split mid-container: ## and ``` lines inside a container are content', () => {
  const s = new MdBlockStream();
  assert.equal(s.push(':::sidenote\nA note\n\n## not a section\n').length, 0);
  assert.match(previewOfMd(s.partial), /^A note/);
  const us = s.push(':::\n');
  assert.equal(us.length, 1);
  const b = mdUnitToBlock(us[0]) as any;
  assert.equal(b.block.type, 'sideNote'); assert.match(b.block.text, /## not a section/);
});

t('paragraph emitted at the blank line, tail is live preview', () => {
  const s = new MdBlockStream();
  assert.equal(s.push('First para').length, 0);
  assert.equal(previewOfMd(s.partial), 'First para');
  assert.equal(s.push(' ends.\n\nSecond').length, 1);
  assert.equal(previewOfMd(s.partial), 'Second');
});

t('```markdown wrapper is ignored', () => {
  const bs = conv(parseMd('```markdown\n## T\n\nHello.\n```\n'));
  assert.deepEqual(bs.map((b) => b.type), ['section', 'paragraph']);
});

t('broken YAML quiz fence -> error, not a throw', () => {
  const bs = conv(parseMd("```quiz\n- stem: 'Which: one\n  options: [a, b\n```\n"));
  assert.equal(bs[0].type, 'ERR'); assert.match(String(bs[0].error), /YAML/);
});

t('unclosed fence / container / guess without --- -> errors', () => {
  assert.match(String(conv(parseMd('```net\nquestions: []\n'))[0].error), /never closed/);
  assert.match(String(conv(parseMd(':::hook\nhello\n'))[0].error), /never closed/);
  assert.match(String(conv(parseMd(':::guess\nq only\n:::\n'))[0].error), /---/);
  assert.match(String(conv(parseMd(':::warning\nx\n:::\n'))[0].error), /Unknown container/);
});

t('plot and figure fences map to figure blocks', () => {
  const bs = conv(parseMd('```figure\nid: pn-junction\ntitle: Build a junction\nparams: {NA: 1e17, ND: 1e16}\n```\n\n```plot\ntitle: P\nx: {name: V, min: 0, max: 1, label: V}\ny: {label: I}\ncurves:\n  - expr: exp(V)\n```\n')) as any[];
  assert.equal(bs[0].figure, 'pn-junction'); assert.equal(bs[0].params.NA, 1e17);
  assert.equal(bs[1].figure, 'plot'); assert.equal(bs[1].title, 'P'); assert.equal(bs[1].plot.curves[0].expr, 'exp(V)');
});

t('golden 1.6 round-trips: blocks -> Markdown -> blocks', () => {
  const g = JSON.parse(readFileSync(new URL('../content/golden/1-6.json', import.meta.url), 'utf8'));
  const blocks = g.blocks.map((b: any) => Object.fromEntries(Object.entries(b).filter(([k]) => !k.startsWith('_'))));
  const md = blocksToMd(blocks);
  const back = conv(parseMd(md));
  const norm = (x: unknown) => JSON.stringify(x, (k, v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.entries(v).sort()) : v));
  // paragraphs whose text contains blank lines become several paragraphs; compare the joined text instead
  const flat = (bs: any[]) => { const o: any[] = []; for (const b of bs) { if (b.type === 'paragraph' && o.at(-1)?.type === 'paragraph') o.at(-1).text += '\n\n' + b.text; else o.push({ ...b }); } return o; };
  const a = flat(blocks), b = flat(back);
  assert.equal(b.length, a.length, `count ${b.length} vs ${a.length}`);
  a.forEach((x, i) => assert.equal(norm(b[i]), norm(x), `block ${i} (${x.type})`));
});

console.log(`\n${pass}/${pass + fail} passed`);
process.exit(fail ? 1 : 0);
