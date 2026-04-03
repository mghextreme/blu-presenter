import { z } from "zod";
import { SONG_PART_LINE_TYPES } from "@/types/song-part.interface";

const BlockSchema = z.object({
  id: z.number().optional(),
  name: z.string().optional(),
  acronym: z.string().optional(),
  lines: z.array(
    z.object({
      type: z.enum(SONG_PART_LINE_TYPES),
      content: z.string(),
    }),
  ),
});

export const SongSchema = z.object({
  id: z.number(),
  title: z.string().min(2),
  language: z.enum(["en", "pt", "es", "fr", "de", "it"]).optional(),
  artist: z.string().min(2).optional().or(z.literal('')),
  blocks: z.array(BlockSchema),
  references: z.array(
    z.object({
      name: z.string().optional(),
      url: z.string().url(),
    }),
  ),
});
