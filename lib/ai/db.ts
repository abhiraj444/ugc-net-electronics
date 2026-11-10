'use client';
import Dexie, { type Table } from 'dexie';
import type { LessonDoc, StoredBlock } from './schema';

/** Everything AI-related lives in this browser only (IndexedDB). Nothing here is sent anywhere except to the provider you call. */

export type AdapterType = 'openai' | 'gemini' | 'anthropic';
export type Secret = string | { enc: string }; // plain text, or AES-GCM ciphertext (base64 of iv + ct)

export type Provider = {
  id: string;
  name: string;
  preset: string;
  adapter: AdapterType;
  baseUrl: string;
  apiKey: Secret;
  models: string[];
  defaultModel: string;
  params: Record<string, number | string>; // temperature, top_p, max_tokens, ...
  extraParams: string; // JSON merged into the request body
  extraHeaders: string; // JSON
  createdAt: number;
};

export const TASKS = ['topicExpansion', 'lessonWriting', 'quiz', 'remix', 'doubt'] as const;
export type Task = (typeof TASKS)[number];
export const TASK_LABEL: Record<Task, string> = {
  topicExpansion: 'Topic expansion',
  lessonWriting: 'Lesson writing',
  quiz: 'Quiz and practice',
  remix: 'Remix',
  doubt: 'Doubts',
};
export type Profile = { task: Task; providerId: string; model: string; params: Record<string, number | string>; extraParams: string };

export type StepState = 'pending' | 'partial' | 'done' | 'error';
export type Version = { at: number; note: string; blocks: StoredBlock[] };
export type Issue = { block: number; severity: 'high' | 'low'; problem: string; fix?: unknown; applied?: boolean };

export type AiLesson = LessonDoc & {
  status: 'empty' | 'draft' | 'complete';
  plan?: { title: string; goal: string; figure?: string }[];
  steps: Record<string, StepState>;
  issues?: Issue[];
  versions: Version[];
  reviewed?: boolean;
  updatedAt: number;
};

export type TopicNode = { key: string; title: string; why: string; prerequisites: string[]; netWeight: 'High' | 'Medium' | 'Low'; minutes: number; children: TopicNode[] };
export type Topic = { id: string; unit: string; anchor?: string; anchorTitle?: string; query: string; root: string; nodes: TopicNode[]; lessonIds: string[]; createdAt: number };

export type Generation = { id?: number; at: number; task: string; lessonId?: string; step?: string; promptVersion: string; provider: string; model: string; params: string; output: string; ok: boolean; error?: string };
export type Usage = { id?: number; at: number; task: string; provider: string; model: string; inTokens?: number; outTokens?: number; ms: number; ok: boolean };
export type PracticeSet = { id: string; unit: string; questions: (import('./schema').Mcq & { lesson?: string; _flags?: string[] })[]; model?: string; updatedAt: number; complete: boolean };
export type KV = { key: string; value: unknown };

class AiDB extends Dexie {
  providers!: Table<Provider, string>;
  profiles!: Table<Profile, string>;
  lessons!: Table<AiLesson, string>;
  topics!: Table<Topic, string>;
  generations!: Table<Generation, number>;
  usage!: Table<Usage, number>;
  practice!: Table<PracticeSet, string>;
  kv!: Table<KV, string>;
  constructor() {
    super('bm-ai');
    this.version(1).stores({
      providers: 'id, name',
      profiles: 'task',
      lessons: 'id, unit, updatedAt, meta.topicId',
      topics: 'id, unit, createdAt',
      generations: '++id, at, lessonId',
      usage: '++id, at',
      practice: 'id, unit',
      kv: 'key',
    });
  }
}

let _db: AiDB | null = null;
export function db() {
  if (!_db) _db = new AiDB();
  return _db;
}

export async function kvGet<T>(key: string, fallback: T): Promise<T> {
  const r = await db().kv.get(key);
  return (r?.value as T) ?? fallback;
}
export async function kvSet(key: string, value: unknown) {
  await db().kv.put({ key, value });
}

export const uid = (p = '') => p + Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);

/** Full local backup: every table in one JSON. */
export async function exportAll() {
  const d = db();
  const out: Record<string, unknown> = { app: 'beyond-memorising-ai', version: 1, at: new Date().toISOString() };
  for (const t of d.tables) out[t.name] = await t.toArray();
  return out;
}
export async function importAll(data: Record<string, unknown>, mode: 'merge' | 'replace' = 'merge') {
  if (data.app !== 'beyond-memorising-ai') throw new Error('This file is not a Beyond Memorising backup.');
  const d = db();
  await d.transaction('rw', d.tables, async () => {
    for (const t of d.tables) {
      const rows = data[t.name];
      if (!Array.isArray(rows)) continue;
      if (mode === 'replace') await t.clear();
      await t.bulkPut(rows as never[]);
    }
  });
}
