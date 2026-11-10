'use client';
import { useEffect, useId, useState, type ReactNode } from 'react';
import { cryptoMeta, isUnlocked, onLockChange, unlock } from '@/lib/ai/crypto';

export function SectionHead({ n, title, children }: { n: number; title: string; children?: ReactNode }) {
  return (
    <div className="border-t border-line pt-5">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-[22px] font-semibold leading-tight tracking-tight">{title}</h2>
        <span className="font-mono text-[26px] leading-none text-[var(--line-strong)]" aria-hidden>{String(n).padStart(2, '0')}</span>
      </div>
      {children && <p className="mt-2 text-[15px] leading-relaxed text-muted">{children}</p>}
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: (id: string) => ReactNode; hint?: ReactNode }) {
  const id = useId();
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="flabel">{label}</label>
      {children(id)}
      {hint && <p className="mt-1.5 text-[13px] leading-snug text-muted">{hint}</p>}
    </div>
  );
}

export function SecretInput({ id, value, onChange, placeholder }: { id?: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="flex gap-2">
      <input id={id} className="field min-w-0 flex-1 font-mono !text-[15px]" type={show ? 'text' : 'password'} autoComplete="off" spellCheck={false} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      <button type="button" className="btn btn-sm !min-h-[44px] shrink-0" onClick={() => setShow((s) => !s)} aria-pressed={show}>{show ? 'Hide' : 'Show'}</button>
    </div>
  );
}

export function ErrorNote({ msg, hint, children }: { msg: string; hint?: string; children?: ReactNode }) {
  return (
    <div className="note-bad" role="alert">
      <div className="font-medium">{msg}</div>
      {hint && <div className="mt-1 text-muted">{hint}</div>}
      {children}
    </div>
  );
}

export function download(name: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

export function pickJsonFile(): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'application/json,.json';
    inp.onchange = async () => {
      const f = inp.files?.[0];
      if (!f) return reject(new Error('No file chosen.'));
      try { resolve(JSON.parse(await f.text())); } catch (e) { reject(new Error('That file is not valid JSON: ' + (e as Error).message)); }
    };
    inp.click();
  });
}

/** Lock state that re-renders when it changes. */
export function useLock() {
  const [state, setState] = useState<{ encrypted: boolean; unlocked: boolean } | null>(null);
  useEffect(() => {
    const read = async () => setState({ encrypted: !!(await cryptoMeta()), unlocked: isUnlocked() });
    read();
    return onLockChange(read);
  }, []);
  return state;
}

/** Shown wherever keys are needed while they are locked. */
export function UnlockBar() {
  const lock = useLock();
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  if (!lock || !lock.encrypted || lock.unlocked) return null;
  return (
    <form className="note-bad flex flex-wrap items-end gap-2" onSubmit={async (e) => { e.preventDefault(); setErr((await unlock(pass)) ? '' : 'Wrong passphrase.'); }}>
      <div className="min-w-[180px] flex-1">
        <label className="flabel !text-ink" htmlFor="unlock-pass">Your keys are locked. Passphrase</label>
        <input id="unlock-pass" className="field" type="password" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="current-password" />
      </div>
      <button className="btn btn-primary">Unlock</button>
      {err && <div className="w-full text-[14px] text-[var(--bad)]">{err}</div>}
    </form>
  );
}

export function Sheet({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = prev; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className={`sheet mx-auto ${wide ? 'md:max-w-[760px]' : 'md:max-w-[640px]'} md:bottom-4 md:rounded-[20px]`} role="dialog" aria-modal="true" aria-label={title}>
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2">
          <div className="min-w-0 truncate font-semibold">{title}</div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">{children}</div>
      </div>
    </>
  );
}
