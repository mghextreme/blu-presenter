import { z } from "zod";

export const SessionSchema = z.object({
  id: z.number(),
  name: z.string().min(2),
  language: z.enum(["en", "pt"]).nullable().optional(),
  theme: z.union([z.enum(['lyrics', 'subtitles', 'teleprompter']), z.number()]).nullable().optional(),
});
