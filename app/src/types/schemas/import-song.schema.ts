import { z } from "zod";
import { SONG_PART_LINE_TYPES } from "@/types/song-part.interface";

export const ImportSongSchema = z.object({
  fullText: z.string().min(2),
  blocks: z.array(
    z.object({
      id: z.number().optional(),
      name: z.string().optional(),
      acronym: z.string().optional(),
      lines: z.array(
        z.object({
          type: z.enum(SONG_PART_LINE_TYPES),
          content: z.string(),
        }),
      ),
    }),
  ),
});
