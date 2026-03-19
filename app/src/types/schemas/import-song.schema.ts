import { z } from "zod";

export const ImportSongSchema = z.object({
  fullText: z.string().min(2),
  blocks: z.array(
    z.object({
      id: z.number().optional(),
      name: z.string().optional(),
      acronym: z.string().optional(),
      lines: z.array(
        z.object({
          type: z.enum(["lyrics", "chords", "comments"]),
          content: z.string(),
        }),
      ),
    }),
  ),
});
