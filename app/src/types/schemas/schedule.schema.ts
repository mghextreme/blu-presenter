import { z } from "zod";

// Auto-generated references (e.g. Spotify playlists) carry sync metadata that
// must survive form round-trips. The metadata lives in a JSON column, so
// absent values come back from the API as `null` (e.g. `syncedByName` when
// the syncing user has no nickname) — every optional field must accept null
// or the form silently fails validation on submit.
const ScheduleReferenceSchema = z.object({
  name: z.string().nullable().optional(),
  url: z.url(),
  source: z.string().nullable().optional(),
  syncedAt: z.string().nullable().optional(),
  tracksHash: z.string().nullable().optional(),
  syncedByName: z.string().nullable().optional(),
  syncedByMe: z.boolean().nullable().optional(),
});

export const ScheduleSchema = z.object({
  id: z.number(),
  title: z.string().min(2),
  date: z.string().nullable().optional(),
  references: z.array(ScheduleReferenceSchema),
});
