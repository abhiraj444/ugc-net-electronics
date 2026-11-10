import fs from 'node:fs';
import path from 'node:path';
import { BlockSchema, zodMessage, type LessonDoc } from './ai/schema';

/**
 * Build-time loader for lessons published from the AI layer (content/published/<id>.json).
 * Each block is validated; an invalid block is dropped with a build warning rather than breaking the deploy.
 */
let cache: LessonDoc[] | null = null;

export function validateDoc(doc: LessonDoc, file = doc.id): LessonDoc {
  const blocks = doc.blocks.filter((b, i) => {
    if (b.type === 'raw') return false;
    const r = BlockSchema.safeParse(b);
    if (!r.success) console.warn(`[published] ${file} block ${i} dropped: ${zodMessage(r.error)}`);
    return r.success;
  }).map((b, i) => ({ ...b, _id: b._id ?? `b${i}` }));
  return { ...doc, blocks };
}

export function loadPublished(): LessonDoc[] {
  if (cache) return cache;
  const dir = path.join(process.cwd(), 'content', 'published');
  const out: LessonDoc[] = [];
  if (fs.existsSync(dir)) {
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json')).sort()) {
      try {
        const doc = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) as LessonDoc;
        if (!doc.id || !Array.isArray(doc.blocks)) throw new Error('missing id or blocks');
        if (!/^[a-z0-9-]+$/i.test(doc.id)) throw new Error('bad id');
        out.push(validateDoc(doc, f));
      } catch (e) {
        console.warn(`[published] skipped ${f}: ${(e as Error).message}`);
      }
    }
  }
  cache = out;
  return out;
}

export const publishedById = (id: string) => loadPublished().find((d) => d.id === id);
export const publishedIds = () => loadPublished().map((d) => d.id);
export const publishedForUnit = (slug: string) => loadPublished().filter((d) => d.unit === slug);
