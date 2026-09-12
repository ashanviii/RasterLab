/** Colors are stored as a single packed number: R*65536 + G*256 + B, each channel 0-255. */

export function packRGB(r: number, g: number, b: number): number {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n * 255)));
  return clamp(r) * 65536 + clamp(g) * 256 + clamp(b);
}

export function unpackRGB(n: number): { r: number; g: number; b: number } {
  const r = Math.floor(n / 65536) % 256;
  const g = Math.floor(n / 256) % 256;
  const b = Math.floor(n) % 256;
  return { r: r / 255, g: g / 255, b: b / 255 };
}

export function numberToHex(n: number): string {
  const clamped = Math.max(0, Math.min(16777215, Math.round(n)));
  return '#' + clamped.toString(16).padStart(6, '0');
}

export function rgbToHsv({ r, g, b }: { r: number; g: number; b: number }): { h: number; s: number; v: number } {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  return { h, s, v: max };
}

export function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return { r: r + m, g: g + m, b: b + m };
}
