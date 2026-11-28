import { z } from 'zod';
import { BASE_THEME_TYPES } from '../theme.interface';

export const SessionSchema = z.object({
  id: z.number(),
  name: z.string().min(2),
  language: z.enum(['en', 'pt']).nullable().optional(),
  theme: z
    .union([z.enum(BASE_THEME_TYPES), z.number()])
    .nullable()
    .optional(),
});
