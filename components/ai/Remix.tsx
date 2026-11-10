'use client';
import { useEffect, useRef, useState } from 'react';
import { db } from '@/lib/ai/db';
import { remixSection, systemMsg, type Hooks, type RemixMode } from '@/lib/ai/pipeline';
import { fill, getPrompts, PROMPT_VERSION } from '@/lib/ai/prompts';
import { errorText, runTask, type Msg } from '@/lib/ai/providers';
import { Md } from './Markdown';
import { ErrorNote, Sheet, UnlockBar } from './ui';

export function RemixMenu({ lessonId, sectionIndex, disabled, start }: { lessonId: string; sectionIndex: number; disabled?: boolean; start: (fn: (h: Hooks) => Promise<void>) => void }) {
  const go = (m: RemixMode) => start((h) => remixSection(lessonId, sectionIndex, m, h));
  return (
    <div className="contents" role="group" aria-label="Remix this section">
      <span className="self-center text-[13px] text-muted">Remix</span>
      <button className="btn btn-sm" disabled={disabled} onClick={() => go('simpler')}>Simpler</button>
      <button className="btn btn-sm" disabled={disabled} onClick={() => go('example')}>New example</button>
      <button className="btn btn-sm" disabled={disabled} onClick={() => go('hinglish')}>Hinglish</button>
    </div>
  );
}

/** Ask a doubt: a bottom sheet chat that already knows the lesson and the section on screen. */
export function DoubtSheet({ open, onClose, lessonId, title, contextText, section }: { open: boolean; onClose: () => void; lessonId?: string; title?: string; contextText?: string; section: string }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<{ msg: string; hint?: string } | null>(null);
  const ctl = useRef<AbortController | null>(null);
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [msgs]);

  const lessonContext = async () => {
    if (contextText) return { title: title ?? '', text: contextText };
    const l = lessonId ? await db().lessons.get(lessonId) : undefined;
    if (!l) return { title: title ?? '', text: '' };
    const text = l.blocks.map((b) => {
      if (b.type === 'section') return `\n## ${b.title}`;
      if ('text' in b && typeof b.text === 'string') return b.text;
      if (b.type === 'equationCard') return `Equation (${b.title}): $${b.tex}$`;
      return '';
    }).filter(Boolean).join('\n').slice(0, 9000);
    return { title: `${l.number} ${l.title}`, text };
  };

  const send = async () => {
    const q = input.trim();
    if (!q || busy) return;
    setInput(''); setErr(null); setBusy(true);
    const history: Msg[] = [...msgs, { role: 'user', content: q }];
    setMsgs([...history, { role: 'assistant', content: '' }]);
    ctl.current = new AbortController();
    try {
      const [p, ctx, sys] = await Promise.all([getPrompts(), lessonContext(), systemMsg()]);
      const system: Msg = { role: 'system', content: `${sys.content}\n\n${fill(p.doubt, { title: ctx.title, section: section || 'not sure', lesson: ctx.text })}` };
      await runTask('doubt', [system, ...history], {
        signal: ctl.current.signal, lessonId, step: 'doubt', promptVersion: PROMPT_VERSION,
        onDelta: (_, full) => setMsgs([...history, { role: 'assistant', content: full }]),
      });
    } catch (e) {
      setErr(errorText(e));
      setMsgs((m) => (m[m.length - 1]?.content ? m : m.slice(0, -1)));
    }
    setBusy(false);
  };

  return (
    <>
      <Sheet open={open} onClose={() => { ctl.current?.abort(); onClose(); }} title="Ask a doubt">
        <div className="flex min-h-[40dvh] flex-col">
          {section && <p className="mb-3 text-[13px] text-muted">About: <span className="text-ink">{section}</span></p>}
          <UnlockBar />
          <div className="flex-1 space-y-4">
            {msgs.length === 0 && <p className="text-[15px] text-muted">Ask anything about this lesson, for example “Why does the field point from n to p?” or “Explain W in simpler words.”</p>}
            {msgs.map((m, i) => (
              m.role === 'user'
                ? <div key={i} className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-[var(--accent-tint)] px-4 py-2.5 text-[15.5px]">{m.content}</div>
                : <div key={i} className="prose-read !text-[16.5px] [&_p:last-child]:mb-0">{m.content ? <Md text={m.content} /> : <p className="typing !text-[16px]"></p>}</div>
            ))}
            {err && <ErrorNote msg={err.msg} hint={err.hint} />}
            <div ref={end} />
          </div>
          <form className="sticky bottom-0 -mx-4 mt-4 flex gap-2 border-t border-line bg-card px-4 pt-3" onSubmit={(e) => { e.preventDefault(); send(); }}>
            <input className="field min-w-0 flex-1" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type your doubt" aria-label="Your doubt" enterKeyHint="send" />
            {busy ? <button type="button" className="btn" onClick={() => ctl.current?.abort()}>Stop</button> : <button className="btn btn-primary" disabled={!input.trim()}>Ask</button>}
          </form>
        </div>
      </Sheet>
    </>
  );
}
