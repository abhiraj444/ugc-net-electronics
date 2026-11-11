'use client';
import { useEffect, useId, useState } from 'react';
import { FigureFrame } from '@/components/lesson/Blocks';
import { sanitizeMermaid } from '@/lib/ai/mermaid';

function useTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const read = () => setDark(document.documentElement.dataset.theme === 'dark');
    read();
    const mo = new MutationObserver(read);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  }, []);
  return dark;
}

let queue: Promise<unknown> = Promise.resolve(); // mermaid.render is not re-entrant

/** A Mermaid flowchart, drawn lazily on the client. Never shows the source as prose. */
export default function Diagram({ code, title, label }: { code: string; title?: string; label?: string }) {
  const dark = useTheme();
  const rid = 'mmd' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const [svg, setSvg] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [src, setSrc] = useState(false);
  const clean = sanitizeMermaid(code);

  useEffect(() => {
    let live = true;
    setFailed(false);
    const job = queue.then(async () => {
      const mermaid = (await import('mermaid')).default;
      mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: dark ? 'dark' : 'default', fontFamily: 'inherit', flowchart: { useMaxWidth: false, htmlLabels: false } });
      await mermaid.parse(clean);
      const { svg } = await mermaid.render(`${rid}${dark ? 'd' : 'l'}`, clean);
      if (live) setSvg(svg);
    }).catch(() => {
      document.getElementById(`d${rid}${dark ? 'd' : 'l'}`)?.remove();
      if (live) setFailed(true);
    });
    queue = job;
    return () => { live = false; };
  }, [clean, dark, rid]);

  const source = <pre className="mt-2 max-h-[320px] overflow-auto rounded-lg border border-line bg-[var(--bg)] p-3 font-mono text-[12px] leading-relaxed">{code}</pre>;

  if (failed) {
    return (
      <details className="my-4 rounded-xl border border-dashed border-line px-3 py-2 font-ui text-[13px] text-muted" data-diagram="failed">
        <summary className="cursor-pointer select-none">Diagram couldn&apos;t be drawn · Show source</summary>
        {source}
      </details>
    );
  }
  return (
    <div className="reveal" data-diagram={svg ? 'ok' : 'loading'}>
      <FigureFrame label={label ?? 'Diagram'} title={title ?? 'Diagram'}>
        <div className="max-w-full overflow-x-auto border-t border-line px-3 py-4">
          {svg ? <div className="mx-auto w-max [&_svg]:h-auto [&_svg]:max-w-none" dangerouslySetInnerHTML={{ __html: svg }} />
            : <div className="grid h-[160px] place-items-center text-[14px] text-muted">Drawing diagram…</div>}
        </div>
        <div className="border-t border-line px-3 py-1.5">
          <button className="min-h-[36px] text-[12.5px] text-muted underline-offset-4 hover:underline" aria-expanded={src} onClick={() => setSrc((s) => !s)}>{src ? 'Hide source' : 'Show source'}</button>
          {src && source}
        </div>
      </FigureFrame>
    </div>
  );
}
