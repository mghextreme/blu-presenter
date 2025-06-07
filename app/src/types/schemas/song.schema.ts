import { z } from "zod";

export const SongSchema = z.object({
  id: z.number(),
  title: z.string().min(2),
  language: z.enum(["en", "pt", "es", "fr", "de", "it"]).optional(),
  artist: z.string().min(2).optional().or(z.literal('')),
  blocks: z.array(
    z.object({
      id: z.number().optional(),
      text: z.string().optional(),
      chords: z.string().optional(),
    }),
  ),
});
