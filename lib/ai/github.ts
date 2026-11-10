'use client';
import { db, kvGet, kvSet, type Secret } from './db';
import { revealSecret } from './crypto';
import type { LessonDoc } from './schema';

export type GitHubCfg = { token?: Secret; owner: string; repo: string; branch: string };
export const GH_DEFAULT: GitHubCfg = { owner: 'abhiraj444', repo: 'ugc-net-electronics', branch: 'main' };
export const getGitHub = async () => ({ ...GH_DEFAULT, ...(await kvGet<GitHubCfg | null>('github', null)) });
export const setGitHub = (c: GitHubCfg) => kvSet('github', c);

function b64utf8(s: string) {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

async function gh(path: string, init: RequestInit = {}) {
  const c = await getGitHub();
  if (!c.token) throw new Error('Add a GitHub token in Settings first.');
  const token = await revealSecret(c.token);
  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: { accept: 'application/vnd.github+json', authorization: `Bearer ${token}`, 'x-github-api-version': '2022-11-28', ...(init.body ? { 'content-type': 'application/json' } : {}) },
  });
  return { res, c };
}

export async function testGitHub() {
  const c = await getGitHub();
  const { res } = await gh(`/repos/${c.owner}/${c.repo}`);
  if (!res.ok) throw new Error(`GitHub said ${res.status}: ${(await res.json().catch(() => ({}))).message ?? ''}`);
  const j = await res.json();
  if (!j.permissions?.push) throw new Error('The token can read the repo but cannot push to it. Give it Contents: Read and write.');
  return `Connected to ${j.full_name}. Default branch ${j.default_branch}.`;
}

/** Strip local bookkeeping and commit the lesson to content/published/<id>.json. */
export function toPublished(l: LessonDoc): LessonDoc {
  return {
    id: l.id, unit: l.unit, number: l.number, title: l.title, dek: l.dek, netWeight: l.netWeight, minutes: l.minutes, buildsOn: l.buildsOn,
    blocks: l.blocks.filter((b) => b.type !== 'raw').map((b) => { const { _step, ...rest } = b; void _step; return rest as typeof b; }),
    meta: { ...(l.meta ?? {}), source: 'ai', publishedAt: Date.now() },
  };
}

export async function publishLesson(id: string) {
  const l = await db().lessons.get(id);
  if (!l) throw new Error('Lesson not found on this device.');
  if (l.blocks.some((b) => b.type === 'raw')) throw new Error('Fix or delete the blocks marked as unparsed before publishing.');
  const c = await getGitHub();
  const path = `content/published/${id}.json`;
  const url = `/repos/${c.owner}/${c.repo}/contents/${path}`;
  const { res: head } = await gh(`${url}?ref=${encodeURIComponent(c.branch)}`);
  const sha = head.ok ? (await head.json()).sha : undefined;
  const doc = toPublished(l);
  const { res } = await gh(url, {
    method: 'PUT',
    body: JSON.stringify({ message: `${sha ? 'Update' : 'Publish'} lesson ${l.number}: ${l.title}`, content: b64utf8(JSON.stringify(doc, null, 2) + '\n'), branch: c.branch, ...(sha ? { sha } : {}) }),
  });
  if (!res.ok) throw new Error(`GitHub said ${res.status}: ${(await res.json().catch(() => ({}))).message ?? ''}`);
  const j = await res.json();
  await db().lessons.update(id, { meta: { ...(l.meta ?? {}), publishedAt: Date.now() } });
  return j.commit?.html_url as string | undefined;
}
