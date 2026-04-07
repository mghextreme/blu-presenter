export interface LineStyle {
  enabled: boolean
  color?: string
  bold: boolean
  italic: boolean
}

export function lineStyleToCSS(style: LineStyle): React.CSSProperties {
  return {
    color: style.color,
    fontWeight: style.bold ? 'bold' : 'normal',
    fontStyle: style.italic ? 'italic' : 'normal',
  };
}
