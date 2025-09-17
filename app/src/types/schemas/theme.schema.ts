import { z } from "zod";

export const ColorField = z.string().regex(/^#[0-9a-f]{6}([0-9a-f]{2})?$/i, { message: "Invalid color hexadecimal" });

export const ShadowSchema = z.object({
  enabled: z.boolean(),
  color: ColorField.optional(),
  offset: z.number().min(0).optional(),
  blur: z.number().min(0).max(100).optional(),
});

export const FontSchema = z.object({
  fontSize: z.number().min(10),
  fontWeight: z.number().min(100).max(900),
  fontFamily: z.string().min(6),
  transform: z.enum(['none', 'uppercase']),
  italic: z.boolean(),
  shadow: ShadowSchema,
});

export const ToggleableColorFontSchema = FontSchema.extend({
  color: ColorField,
  enabled: z.boolean(),
});

export const ClockSchema = ToggleableColorFontSchema.extend({
  format: z.enum(['12', '24', '12withSeconds', '24withSeconds']),
});

export const configSchema = z.object({
  backgroundColor: ColorField,
  foregroundColor: ColorField,
  invisibleOnEmptyItems: z.boolean(),
  title: FontSchema,
  artist: FontSchema,
  lyrics: FontSchema,
  alignment: z.enum(['left', 'center', 'right']).optional(),
  position: z.enum(['top', 'middle', 'bottom']).optional(),
  chords: ToggleableColorFontSchema.optional(),
  clock: ClockSchema.optional(),
});

export const ThemeSchema = z.object({
  id: z.number(),
  name: z.string().min(2),
  extends: z.enum(['lyrics', 'subtitles', 'teleprompter']),
  config: configSchema.optional(),
});
