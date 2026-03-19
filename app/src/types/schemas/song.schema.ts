import { z } from "zod";

export const SongSchema = z.object({
  id: z.number(),
  title: z.string().min(2),
  language: z.enum(["en", "pt", "es", "fr", "de", "it"]).optional(),
  artist: z.string().min(2).optional().or(z.literal('')),
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
  references: z.array(
    z.object({
      name: z.string().optional(),
      url: z.string().url(),
    }),
  ),
});
