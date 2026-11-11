'use client';
import { statusLabel, useLessonStatuses } from '@/lib/ai/useLessonStatus';

/** Subline for a not-yet-written lesson on the unit page: AI-written · Ready / Draft · Resume / Generate with AI. */
export function AiStatusLine({ id, unit, project }: { id: string; unit: string; project?: boolean }) {
  const st = useLessonStatuses(unit)?.[id];
  const label = statusLabel(st);
  return <span className={`mt-1 block text-[12.5px] ${st ? 'font-medium text-[var(--accent-deep)]' : 'text-muted'}`} data-ai-status={st?.status ?? 'none'}>{st ? label : `${project ? 'Project · ' : ''}Coming soon · ${label}`}</span>;
}
