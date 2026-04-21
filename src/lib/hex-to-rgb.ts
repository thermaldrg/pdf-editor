export interface RgbColor {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

const HEX_PATTERN: RegExp = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i;

export function hexToRgb(hex: string): RgbColor {
  const match: RegExpExecArray | null = HEX_PATTERN.exec(hex);
  if (!match) {
    return { r: 0, g: 0, b: 0 };
  }
  return {
    r: parseInt(match[1], 16) / 255,
    g: parseInt(match[2], 16) / 255,
    b: parseInt(match[3], 16) / 255,
  };
}
