import { z } from "zod";

export const ScheduleSchema = z.object({
  id: z.number(),
  title: z.string().min(2),
  date: z.string().nullable().optional(),
});
