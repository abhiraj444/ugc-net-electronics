export function Milestone({ name, hue, earned = false, size = 'md' }: { name: string; hue: number; earned?: boolean; size?: 'sm' | 'md' }) {
  const s = size === 'sm' ? 16 : 20;
  return (
    <span className={`inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 ${size === 'sm' ? 'h-7 text-[12.5px]' : 'h-8 text-[13.5px]'} font-medium`} style={{ ['--hue' as string]: hue, borderColor: 'color-mix(in oklab, var(--accent) 35%, var(--line))', background: 'var(--accent-tint)', color: 'var(--accent-deep)' }}>
      <svg width={s} height={s} viewBox="0 0 20 20" aria-hidden className="shrink-0">
        <path d="M10 1.5 17.4 5.75v8.5L10 18.5 2.6 14.25v-8.5Z" fill={earned ? 'var(--accent)' : 'none'} stroke="var(--accent)" strokeWidth="1.4" />
        <path d="m6.8 10.2 2.2 2.2 4.3-4.6" fill="none" stroke={earned ? 'var(--card)' : 'var(--accent)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity={earned ? 1 : 0.55} />
      </svg>
      <span className="truncate">{name}</span>
    </span>
  );
}
