import type { LessonContent } from './types';
import { lesson as l11 } from './1-1';
import { lesson as l12 } from './1-2';
import { lesson as l13 } from './1-3';
import { lesson as l14 } from './1-4';
import { lesson as l15 } from './1-5';
import { lesson as l16 } from './1-6';
import { lesson as l17 } from './1-7';

export const LESSONS: Record<string, LessonContent> = {
  '1-1': l11, '1-2': l12, '1-3': l13, '1-4': l14, '1-5': l15, '1-6': l16, '1-7': l17,
};
