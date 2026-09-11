import type { PresetDef } from '../types';

export const PRESETS: PresetDef[] = [
  {
    id: 'cyberpunk',
    name: 'Cyberpunk',
    description: 'Neon split channels with a glitchy edge.',
    thumbnail: 'from-fuchsia-500 via-purple-600 to-cyan-400',
    stack: [
      { shaderId: 'glitch', params: { amount: 0.18, blockSize: 30, speed: 1.2, colorShift: 0.6, seed: 4 } },
      { shaderId: 'rgb-split', params: { intensity: 0.7, redOffset: 10, greenOffset: 0, blueOffset: -10, angle: 0, blendMode: 1 } },
      { shaderId: 'chromatic-aberration', params: { intensity: 0.4, radialAmount: 0.8, angle: 0 } },
      { shaderId: 'scanlines', params: { intensity: 0.25, count: 400, speed: 0.5, thickness: 0.4 } },
      { shaderId: 'vignette', params: { intensity: 1.1, radius: 0.7, softness: 0.5, roundness: 1 } },
    ],
  },
  {
    id: 'vhs',
    name: 'VHS',
    description: 'Worn-out tape with tracking noise and bleeding color.',
    thumbnail: 'from-slate-800 via-pink-500 to-yellow-300',
    stack: [
      { shaderId: 'chromatic-aberration', params: { intensity: 0.5, radialAmount: 0.3, angle: 0 } },
      { shaderId: 'scanlines', params: { intensity: 0.45, count: 250, speed: 8, thickness: 0.55 } },
      { shaderId: 'noise', params: { amount: 0.12, scale: 220, speed: 3, monochrome: 1 } },
      { shaderId: 'film-grain', params: { amount: 0.35, size: 1.8, speed: 2, colorAmount: 0.3 } },
      { shaderId: 'color-shift', params: { hue: -6, saturation: 0.75, brightness: 1.05, contrast: 1.1 } },
    ],
  },
  {
    id: 'analog',
    name: 'Analog',
    description: 'Warm faded film with soft grain and vignette.',
    thumbnail: 'from-amber-200 via-orange-300 to-stone-600',
    stack: [
      { shaderId: 'color-shift', params: { hue: 8, saturation: 0.8, brightness: 1.05, contrast: 0.9 } },
      { shaderId: 'film-grain', params: { amount: 0.25, size: 1.4, speed: 0.6, colorAmount: 0.15 } },
      { shaderId: 'vignette', params: { intensity: 0.6, radius: 0.85, softness: 0.55, roundness: 0.8 } },
    ],
  },
  {
    id: 'dream',
    name: 'Dream',
    description: 'Hazy glow with gentle drifting distortion.',
    thumbnail: 'from-sky-200 via-purple-200 to-pink-200',
    stack: [
      { shaderId: 'displacement', params: { amount: 0.08, scale: 3, speed: 0.15, direction: 0 } },
      { shaderId: 'bloom', params: { threshold: 0.45, intensity: 1.4, radius: 10 } },
      { shaderId: 'color-shift', params: { hue: 4, saturation: 0.85, brightness: 1.1, contrast: 0.85 } },
      { shaderId: 'vignette', params: { intensity: 0.4, radius: 0.9, softness: 0.6, roundness: 1 } },
    ],
  },
  {
    id: 'digital-decay',
    name: 'Digital Decay',
    description: 'Corrupted signal breaking into blocks and noise.',
    thumbnail: 'from-emerald-500 via-black to-red-500',
    stack: [
      { shaderId: 'dither', params: { levels: 5, pixelSize: 2, colorMode: 0 } },
      { shaderId: 'pixelate', params: { pixelSize: 5, smoothness: 0 } },
      { shaderId: 'glitch', params: { amount: 0.5, blockSize: 18, speed: 1.6, colorShift: 0.8, seed: 12 } },
      { shaderId: 'noise', params: { amount: 0.15, scale: 150, speed: 2, monochrome: 0 } },
    ],
  },
];
