import { IFontConfig, IShadowConfig } from "@/types";

export const buildShadowStyle = (shadow?: IShadowConfig) => {
  if (!shadow || !shadow.enabled) {
    return 'none';
  }

  const offset = Number((shadow.offset ?? 5) / 100).toFixed(2);
  const blur = Number((shadow.blur ?? 0) / 100).toFixed(2);

  return `${offset}em ${offset}em ${blur}em ${shadow.color}`;
}

export const buildFontStyle = (config?: IFontConfig, defaults?: Partial<IFontConfig> & { color?: string }) => {
  if (!config) {
    return {};
  }

  return {
    fontSize: (config.fontSize ?? defaults?.fontSize ?? 100) / 100 + 'em',
    fontWeight: config.fontWeight ?? defaults?.fontWeight ?? 400,
    lineHeight: '1.15em',
    fontStyle: config.italic ? 'italic' : 'normal',
    textTransform: config.transform ?? 'none',
    textShadow: buildShadowStyle(config?.shadow),
    color: !!defaults?.color ? defaults.color : undefined,
  }
}
