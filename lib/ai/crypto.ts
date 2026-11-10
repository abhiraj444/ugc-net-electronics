'use client';
import { db, kvGet, kvSet, type Secret } from './db';

/**
 * Optional passphrase lock for API keys and the GitHub token.
 * PBKDF2 (SHA-256, 250k iterations) derives an AES-GCM key; the key lives in memory only for this tab.
 */

type CryptoMeta = { salt: string; check: string } | null;
let sessionKey: CryptoKey | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());
export const onLockChange = (cb: () => void) => { listeners.add(cb); return () => { listeners.delete(cb); }; };

const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function derive(pass: string, salt: Uint8Array) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: salt as BufferSource, iterations: 250_000, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function enc(key: CryptoKey, text: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(text)));
  const all = new Uint8Array(iv.length + ct.length);
  all.set(iv); all.set(ct, iv.length);
  return b64(all);
}
async function dec(key: CryptoKey, data: string) {
  const all = unb64(data);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: all.slice(0, 12) }, key, all.slice(12));
  return new TextDecoder().decode(pt);
}

export const cryptoMeta = () => kvGet<CryptoMeta>('crypto', null);
export const isUnlocked = () => !!sessionKey;

export class LockedError extends Error { constructor() { super('Your keys are locked. Enter your passphrase in Settings to unlock them.'); } }

export async function unlock(pass: string) {
  const m = await cryptoMeta();
  if (!m) return true;
  const k = await derive(pass, unb64(m.salt));
  try { await dec(k, m.check); } catch { return false; }
  sessionKey = k; notify();
  return true;
}
export function lock() { sessionKey = null; notify(); }

/** Turn on encryption: re-encrypt every stored secret. */
export async function enableEncryption(pass: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const k = await derive(pass, salt);
  const d = db();
  const provs = await d.providers.toArray();
  for (const p of provs) p.apiKey = { enc: await enc(k, await plainOf(p.apiKey)) };
  const gh = await kvGet<{ token?: Secret } | null>('github', null);
  if (gh?.token) gh.token = { enc: await enc(k, await plainOf(gh.token)) };
  await d.providers.bulkPut(provs);
  if (gh) await kvSet('github', gh);
  await kvSet('crypto', { salt: b64(salt), check: await enc(k, 'ok') });
  sessionKey = k; notify();
}
/** Turn off encryption (must be unlocked). */
export async function disableEncryption() {
  if (!sessionKey) throw new LockedError();
  const d = db();
  const provs = await d.providers.toArray();
  for (const p of provs) p.apiKey = await plainOf(p.apiKey);
  const gh = await kvGet<{ token?: Secret } | null>('github', null);
  if (gh?.token) gh.token = await plainOf(gh.token);
  await d.providers.bulkPut(provs);
  if (gh) await kvSet('github', gh);
  await kvSet('crypto', null);
  sessionKey = null; notify();
}

async function plainOf(s: Secret): Promise<string> {
  if (typeof s === 'string') return s;
  if (!sessionKey) throw new LockedError();
  return dec(sessionKey, s.enc);
}
export const revealSecret = plainOf;

/** Store a secret the right way for the current lock state. */
export async function sealSecret(plain: string): Promise<Secret> {
  const m = await cryptoMeta();
  if (!m || !plain) return plain;
  if (!sessionKey) throw new LockedError();
  return { enc: await enc(sessionKey, plain) };
}
