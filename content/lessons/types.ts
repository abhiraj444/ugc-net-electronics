import type { ReactNode } from 'react';
import type { MCQ } from '@/components/lesson/Interactive';

export type LessonContent = {
  id: string; // matches curriculum id, e.g. "1-6"
  dek: string;
  netWeight: 'High' | 'Medium' | 'Low';
  buildsOn: string[]; // lesson ids
  hook: ReactNode;
  body: ReactNode; // numbered sections, figures, asides, equation card
  remember: string;
  quiz: MCQ[];
  net: { questions: MCQ[]; traps: ReactNode[]; formula: string; formulaLabel: string };
  doneWhen: ReactNode;
  upNextTeaser: string;
};
