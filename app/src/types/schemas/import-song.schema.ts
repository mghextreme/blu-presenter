import { z } from "zod";

export const ImportSongSchema = z.object({
  fullText: z.string().min(2),
  blocks: z.array(
    z.object({
      id: z.number().optional(),
      text: z.string().optional(),
      chords: z.string().optional(),
    }),
  ),
});

