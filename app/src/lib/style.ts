import type { CSSProperties } from "react";
import { IFontConfig, IShadowConfig } from "@/types";

export const buildShadowStyle = (shadow?: IShadowConfig) => {
  if (!shadow || !shadow.enabled) {
    return 'none';
  }

  const offset = shadow.offset ?? 0;
  if (offset <= 0) {
    return 'none';
  }

  const offsetEm = Number(offset / 100).toFixed(2);
  const blurEm = Number((shadow.blur ?? 0) / 100).toFixed(2);

  return `${offsetEm}em ${offsetEm}em ${blurEm}em ${shadow.color}`;
}

export const buildStrokeStyle = (shadow?: IShadowConfig) => {
  if (!shadow || !shadow.enabled) {
    return undefined;
  }

  const size = shadow.strokeSize ?? 0;
  if (size <= 0) {
    return undefined;
  }

  const sizeEm = Number(size / 100).toFixed(2);
  return `${sizeEm}em ${shadow.strokeColor ?? '#000000'}`;
}

export const buildFontStyle = (config?: IFontConfig, defaults?: Partial<IFontConfig> & { color?: string }) => {
  if (!config) {
    return {};
  }

  const stroke = buildStrokeStyle(config?.shadow);

  return {
    fontSize: (config.fontSize ?? defaults?.fontSize ?? 100) / 100 + 'em',
    fontWeight: config.fontWeight ?? defaults?.fontWeight ?? 400,
    lineHeight: '1.15em',
    fontStyle: config.italic ? 'italic' : 'normal',
    textTransform: config.transform ?? 'none',
    textShadow: buildShadowStyle(config?.shadow),
    color: !!defaults?.color ? defaults.color : undefined,
    WebkitTextStroke: stroke,
    paintOrder: stroke ? 'stroke fill' : undefined,
  } as CSSProperties;
}
