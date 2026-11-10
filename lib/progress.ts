'use client';
import { useSyncExternalStore } from 'react';

/** Everything the learner does is kept in this browser only (localStorage). */
export type Progress = {
  done: Record<string, number>; // lessonId -> timestamp
  quiz: Record<string, { correct: number; total: number }>; // key -> best result
  practice: Record<string, { best: number; last: number; total: number; at: number }>;
};

const KEY = 'esc-progress-v1';
const EMPTY: Progress = { done: {}, quiz: {}, practice: {} };
let cache: Progress | null = null;
const listeners = new Set<() => void>();

function read(): Progress {
  if (cache) return cache;
  if (typeof window === 'undefined') return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache!;
}

function write(next: Progress) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage full or blocked: progress just won't persist */
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      cb();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener('storage', onStorage);
  };
}

export function useProgress() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

export function setDone(id: string, value: boolean) {
  const p = read();
  const done = { ...p.done };
  if (value) done[id] = Date.now();
  else delete done[id];
  write({ ...p, done });
}

export function recordQuiz(key: string, correct: number, total: number) {
  const p = read();
  const prev = p.quiz[key];
  if (prev && prev.correct >= correct) return;
  write({ ...p, quiz: { ...p.quiz, [key]: { correct, total } } });
}

export function recordPractice(key: string, score: number, total: number) {
  const p = read();
  const prev = p.practice[key];
  write({ ...p, practice: { ...p.practice, [key]: { best: Math.max(prev?.best ?? 0, score), last: score, total, at: Date.now() } } });
}

export function resetProgress() {
  write(EMPTY);
}
