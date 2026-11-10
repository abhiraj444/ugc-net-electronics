import katex from 'katex';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { rich } from '@/lib/rich';
import { SectionDeeper } from '@/components/ai/Launchers';

/** Inline maths, rendered at build time. */
export function M({ children }: { children: string }) {
  const html = katex.renderToString(children, { throwOnError: false, output: 'html' });
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

/** Display maths, rendered at build time. Scrolls sideways inside itself if a phone is too narrow. */
export function MathBlock({ children, label }: { children: string; label?: string }) {
  const html = katex.renderToString(children, { throwOnError: false, displayMode: true, output: 'html' });
  return <div className="eq-display" role="math" aria-label={label ?? children} dangerouslySetInnerHTML={{ __html: html }} />;
}

export function Section({ n, title, children, deeper = true }: { n: number; title: string; children: ReactNode; deeper?: boolean }) {
  const id = `s${n}`;
  return (
    <section className="mt-14 scroll-mt-24" aria-labelledby={id}>
      <div className="reveal flex items-baseline justify-between gap-4 border-t border-line pt-5">
        <h2 id={id} className="text-[23px] font-semibold leading-tight tracking-tight sm:text-[26px]" style={{ textWrap: 'balance' }}>{title}</h2>
        <span className="font-mono text-[26px] leading-none text-[var(--line-strong)] sm:text-[32px]" aria-hidden>{String(n).padStart(2, '0')}</span>
      </div>
      <div className="prose-read mt-5">{children}</div>
      {deeper && <SectionDeeper title={title} />}
    </section>
  );
}

export function Hook({ children }: { children: ReactNode }) {
  return <div className="reveal prose-read mt-10 first-letter:float-left first-letter:mr-2 first-letter:mt-1 first-letter:font-read first-letter:text-[52px] first-letter:leading-[0.85] first-letter:text-[var(--accent-deep)]">{children}</div>;
}

export function TryThis({ children }: { children: ReactNode }) {
  return (
    <p className="reveal !mb-3 mt-6 flex gap-2 font-ui text-[16px] leading-relaxed">
      <span className="shrink-0 font-semibold text-[var(--accent-deep)]">Try this:</span>
      <span>{children}</span>
    </p>
  );
}

export function Describe({ children }: { children: ReactNode }) {
  return (
    <details className="describe group mb-8 mt-3 rounded-xl border border-line bg-card font-ui text-[15px]">
      <summary className="flex min-h-[48px] items-center gap-2 px-4 font-medium text-muted hover:text-ink">
        <span className="chev inline-block transition-transform" aria-hidden>›</span> Describe the figure
      </summary>
      <div className="space-y-2 border-t border-line px-4 py-3 leading-relaxed text-ink [&_p]:m-0 [&_p+p]:mt-2">{children}</div>
    </details>
  );
}

export function Example({ title, children }: { title: string; children: ReactNode }) {
  return (
    <aside className="reveal aside my-7 font-read">
      <span className="aside-label">Example · {title}</span>
      <div className="prose-read">{children}</div>
    </aside>
  );
}

export function SideNote({ children }: { children: ReactNode }) {
  return (
    <aside className="reveal aside aside-neutral my-7">
      <span className="aside-label !text-muted">Side note</span>
      <div className="prose-read">{children}</div>
    </aside>
  );
}

export type Sym = { s: string; name: string; unit?: string };

export function EquationCard({ title, tex, symbols, typical }: { title: string; tex: string; symbols: Sym[]; typical: ReactNode }) {
  return (
    <figure className="reveal card my-8 overflow-hidden font-ui">
      <figcaption className="flex items-center justify-between border-b border-line px-4 py-2.5 font-mono text-[11.5px] text-muted">
        <span>Equation</span><span className="truncate pl-3">{title}</span>
      </figcaption>
      <div className="px-4 py-5 text-[19px]"><MathBlock>{tex}</MathBlock></div>
      <dl className="grid gap-x-4 gap-y-2 border-t border-line px-4 py-4 text-[14.5px] sm:grid-cols-2">
        {symbols.map((sy) => (
          <div key={sy.s} className="flex min-w-0 gap-3">
            <dt className="w-14 shrink-0 text-right"><M>{sy.s}</M></dt>
            <dd className="min-w-0 leading-snug">{sy.name}{sy.unit && <span className="text-muted"> · {sy.unit}</span>}</dd>
          </div>
        ))}
      </dl>
      <div className="border-t border-line bg-[var(--accent-tint)] px-4 py-3 text-[14.5px] leading-relaxed">
        <span className="mr-2 font-semibold text-[var(--accent-deep)]">Typical values</span>{typical}
      </div>
    </figure>
  );
}

export function Remember({ children }: { children: ReactNode }) {
  if (typeof children === 'string') children = rich(children);
  return (
    <section className="reveal mt-16 rounded-2xl border border-line bg-card px-5 py-6 sm:px-7" aria-label="Remember">
      <div className="eyebrow mb-2">Remember</div>
      <p className="font-read text-[21px] leading-snug sm:text-[23px]" style={{ textWrap: 'pretty' }}>{children}</p>
    </section>
  );
}

export function FigureFrame({ label, title, children }: { label: string; title: string; children: ReactNode }) {
  return (
    <figure className="figure my-3 font-ui" aria-label={title}>
      <div className="fig-head"><span>{label}</span><span className="truncate text-right">{title}</span></div>
      {children}
    </figure>
  );
}

export function UpNext({ number, title, href, teaser }: { number: string; title: string; href?: string; teaser: string }) {
  const body = (
    <>
      <div className="eyebrow">Up next · Lesson {number}</div>
      <div className="mt-1.5 text-[19px] font-semibold leading-snug tracking-tight">{title}</div>
      <p className="mt-2 font-read text-[16.5px] leading-relaxed text-muted">{teaser}</p>
      <div className="mt-4 text-sm font-semibold text-[var(--accent-deep)]">{href ? 'Start the lesson →' : 'Coming soon'}</div>
    </>
  );
  return href ? (
    <Link href={href} className="reveal card mt-8 block p-5 transition-colors hover:border-[var(--line-strong)] sm:p-6">{body}</Link>
  ) : (
    <div className="reveal card mt-8 p-5 opacity-80 sm:p-6">{body}</div>
  );
}
