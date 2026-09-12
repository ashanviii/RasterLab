import type { ParamDef } from '../types';

/**
 * Appended to every shader's params (see allShaderDefs() in useStore.ts) so a Color/duotone
 * control is available everywhere, without authoring it per shader. The matching GLSL effect
 * lives in a single shared post-process pass (UNIVERSAL_FX_FRAGMENT_SHADER in common.ts), driven
 * by these same param keys: dark pixels map toward tintColor, while bright pixels stay white,
 * then that result is composited over the original using the chosen Blend Mode.
 */
export const UNIVERSAL_PARAMS: ParamDef[] = [
  { key: 'tintColor', label: 'Tint Color', type: 'color', default: 0, group: 'Color' },
  { key: 'tintAmount', label: 'Tint Amount', type: 'float', default: 0, min: 0, max: 1, step: 0.01, group: 'Color' },
  {
    key: 'colorBlendMode',
    label: 'Blend Mode',
    type: 'select',
    default: 0,
    options: [
      { label: 'Normal', value: 0 },
      { label: 'Darken', value: 1 },
      { label: 'Multiply', value: 2 },
      { label: 'Plus Darker', value: 3 },
      { label: 'Lighten', value: 4 },
      { label: 'Screen', value: 5 },
      { label: 'Plus Lighter', value: 6 },
      { label: 'Color Dodge', value: 7 },
      { label: 'Overlay', value: 8 },
      { label: 'Soft Light', value: 9 },
      { label: 'Hard Light', value: 10 },
      { label: 'Difference', value: 11 },
      { label: 'Exclusion', value: 12 },
      { label: 'Hue', value: 13 },
      { label: 'Saturation', value: 14 },
      { label: 'Color', value: 15 },
      { label: 'Luminosity', value: 16 },
    ],
    group: 'Color',
  },
];
