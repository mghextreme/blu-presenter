import {
  BaseTheme,
  ILyricsThemeConfig,
  ISubtitlesThemeConfig,
  ITeleprompterThemeConfig,
  ITheme,
  LyricsTheme,
  SubtitlesTheme,
  TeleprompterTheme,
} from "@/types";

export type AnyThemeConfig =
  | ILyricsThemeConfig
  | ISubtitlesThemeConfig
  | ITeleprompterThemeConfig;

/**
 * Returns the default config for the given base theme.
 * Returns a deep clone so callers can safely mutate it.
 */
export function getDefaultThemeConfig(extendsType: BaseTheme): AnyThemeConfig {
  switch (extendsType) {
    case "subtitles":
      return structuredClone(SubtitlesTheme.config) as ISubtitlesThemeConfig;
    case "teleprompter":
      return structuredClone(TeleprompterTheme.config) as ITeleprompterThemeConfig;
    case "lyrics":
    default:
      return structuredClone(LyricsTheme.config) as ILyricsThemeConfig;
  }
}

/**
 * Deep-merges a stored theme config over the appropriate base defaults.
 *
 * - Stored leaf values win, even when falsy (false, 0, "").
 * - Missing nested objects fall back entirely to defaults.
 * - Plain objects are merged recursively; arrays and non-plain objects are replaced.
 * - When `stored` is undefined/null, returns a copy of defaults.
 */
export function mergeThemeConfig(
  extendsType: BaseTheme,
  stored?: Partial<AnyThemeConfig> | null,
): AnyThemeConfig {
  const defaults = getDefaultThemeConfig(extendsType);
  if (!stored) {
    return defaults;
  }
  return deepMerge(
    defaults as unknown as Record<string, unknown>,
    stored as unknown as Record<string, unknown>,
  ) as unknown as AnyThemeConfig;
}

/**
 * Returns a copy of the theme with its config merged against the matching base defaults.
 */
export function mergeTheme(theme: ITheme): ITheme {
  return {
    ...theme,
    config: mergeThemeConfig(theme.extends, theme.config),
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

/**
 * Recursive merge tailored to theme configs:
 * - skips `undefined` source values (keeps default)
 * - merges plain objects recursively
 * - replaces non-plain values (primitives, arrays, etc.) wholesale
 */
function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...target };
  for (const key of Object.keys(source)) {
    const sVal = source[key];
    if (sVal === undefined) {
      continue;
    }
    const tVal = out[key];
    if (isPlainObject(sVal) && isPlainObject(tVal)) {
      out[key] = deepMerge(tVal, sVal);
    } else if (isPlainObject(sVal)) {
      out[key] = structuredClone(sVal);
    } else {
      out[key] = sVal;
    }
  }
  return out;
}

