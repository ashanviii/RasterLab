import type { ShaderDef } from '../types';
import { buildFragmentShader } from './common';
import { CHARACTER_SET_OPTIONS, BUILTIN_CHARSETS } from '../lib/charsets';
import { UNIVERSAL_PARAMS } from './universalParams';

/** Reuses the same 17 blend modes offered by the universal Color/Tint control, for the ASCII overlay compositor. */
const BLEND_MODE_OPTIONS = UNIVERSAL_PARAMS.find((p) => p.key === 'colorBlendMode')!.options!;

const ASCII_ART_PARAMS: ShaderDef['params'] = [
  // Character
  {
    key: 'renderMode',
    label: 'Render Mode',
    type: 'select',
    default: 0,
    options: [
      { label: 'Full ASCII', value: 0 },
      { label: 'Overlay', value: 1 },
    ],
    group: 'Character',
  },
  { key: 'cellSize', label: 'Font Size', type: 'float', default: 12, min: 4, max: 40, step: 1, group: 'Character' },
  { key: 'characterSet', label: 'Character Set', type: 'select', default: 0, options: CHARACTER_SET_OPTIONS, group: 'Character' },
  { key: 'customChars', label: 'Custom Characters', type: 'text', default: 0, defaultText: BUILTIN_CHARSETS.ASCII, group: 'Character', visibleWhen: { key: 'characterSet', equals: 13 } },
  {
    key: 'colorMode',
    label: 'Mode',
    type: 'select',
    default: 0,
    options: [
      { label: 'Mono', value: 0 },
      { label: 'Color', value: 1 },
      { label: 'Terminal', value: 2 },
    ],
    group: 'Character',
    visibleWhen: { key: 'renderMode', equals: 0 },
  },
  { key: 'charOpacity', label: 'Char Opacity', type: 'float', default: 1, min: 0, max: 1, step: 0.01, group: 'Character', visibleWhen: { key: 'renderMode', equals: 0 } },
  { key: 'charSpacing', label: 'Character Spacing', type: 'float', default: 0, min: 0, max: 0.7, step: 0.01, group: 'Character' },
  { key: 'aspectCorrection', label: 'Aspect Ratio Correction', type: 'float', default: 1, min: 0.4, max: 2.5, step: 0.05, group: 'Character' },
  { key: 'invert', label: 'Invert Mapping', type: 'bool', default: 0, group: 'Character' },
  { key: 'dotGridOverlay', label: 'Dot Grid Overlay', type: 'bool', default: 0, group: 'Character' },
  { key: 'randomizeChars', label: 'Randomize Characters', type: 'bool', default: 0, group: 'Character' },

  // Overlay (only relevant when Render Mode = Overlay)
  { key: 'overlayOpacity', label: 'Opacity', type: 'float', default: 0.65, min: 0, max: 1, step: 0.01, group: 'Overlay', visibleWhen: { key: 'renderMode', equals: 1 } },
  { key: 'overlayBlendMode', label: 'Blend Mode', type: 'select', default: 5, options: BLEND_MODE_OPTIONS, group: 'Overlay', visibleWhen: { key: 'renderMode', equals: 1 } },
  {
    key: 'colorSource',
    label: 'Color Source',
    type: 'select',
    default: 0,
    options: [
      { label: 'Original Image', value: 0 },
      { label: 'Single Color', value: 1 },
      { label: 'Custom Gradient', value: 2 },
    ],
    group: 'Overlay',
    visibleWhen: { key: 'renderMode', equals: 1 },
  },
  {
    key: 'overlayColor',
    label: 'Character Color',
    type: 'color',
    default: 16777215,
    group: 'Overlay',
    visibleWhen: [{ key: 'renderMode', equals: 1 }, { key: 'colorSource', equals: 1 }],
  },
  {
    key: 'overlayGradientStart',
    label: 'Gradient Start',
    type: 'color',
    default: 0,
    group: 'Overlay',
    visibleWhen: [{ key: 'renderMode', equals: 1 }, { key: 'colorSource', equals: 2 }],
  },
  {
    key: 'overlayGradientEnd',
    label: 'Gradient End',
    type: 'color',
    default: 16777215,
    group: 'Overlay',
    visibleWhen: [{ key: 'renderMode', equals: 1 }, { key: 'colorSource', equals: 2 }],
  },

  // Intensity
  { key: 'coverage', label: 'Coverage', type: 'float', default: 1, min: 0, max: 1, step: 0.01, group: 'Intensity' },
  { key: 'density', label: 'Density', type: 'float', default: 0.3, min: 0, max: 1, step: 0.01, group: 'Intensity' },
  { key: 'brightness', label: 'Brightness', type: 'float', default: 1, min: 0, max: 2, step: 0.01, group: 'Intensity' },
  { key: 'contrast', label: 'Contrast', type: 'float', default: 1.1, min: 0, max: 2, step: 0.01, group: 'Intensity' },

  // Image
  { key: 'threshold', label: 'Threshold', type: 'float', default: 0, min: 0, max: 1, step: 0.01, group: 'Image' },
  { key: 'gamma', label: 'Gamma', type: 'float', default: 1, min: 0.2, max: 3, step: 0.01, group: 'Image' },
  { key: 'blackPoint', label: 'Black Point', type: 'float', default: 0, min: 0, max: 0.9, step: 0.01, group: 'Image' },
  { key: 'whitePoint', label: 'White Point', type: 'float', default: 1, min: 0.1, max: 1, step: 0.01, group: 'Image' },
  { key: 'edgeEmphasis', label: 'Edge Emphasis', type: 'float', default: 0, min: 0, max: 1, step: 0.01, group: 'Image' },
  { key: 'sharpness', label: 'Sharpness', type: 'float', default: 0, min: 0, max: 1, step: 0.01, group: 'Image' },

  // Animation
  {
    key: 'animStyle',
    label: 'Style',
    type: 'select',
    default: 0,
    options: [
      { label: 'None', value: 0 },
      { label: 'Jitter', value: 1 },
      { label: 'Flicker', value: 2 },
      { label: 'Wave', value: 3 },
    ],
    group: 'Animation',
  },
  { key: 'animSpeed', label: 'Speed', type: 'float', default: 1, min: 0, max: 5, step: 0.05, group: 'Animation', visibleWhen: { key: 'animStyle', equals: 1 } },
  { key: 'animAmount', label: 'Amount', type: 'float', default: 0.5, min: 0, max: 1, step: 0.01, group: 'Animation', visibleWhen: { key: 'animStyle', equals: 1 } },
  { key: 'animRandomness', label: 'Randomness', type: 'float', default: 0.5, min: 0, max: 1, step: 0.01, group: 'Animation', visibleWhen: { key: 'animStyle', equals: 1 } },
  { key: 'animSeed', label: 'Seed', type: 'float', default: 0, min: 0, max: 100, step: 1, group: 'Animation', visibleWhen: { key: 'animStyle', equals: 1 } },
  { key: 'animDirection', label: 'Direction', type: 'float', default: 0, min: 0, max: 360, step: 1, unit: '°', group: 'Animation', visibleWhen: { key: 'animStyle', equals: 3 } },

  // Color
  {
    key: 'background',
    label: 'Background',
    type: 'select',
    default: 0,
    options: [
      { label: 'Original', value: 0 },
      { label: 'Transparent', value: 1 },
      { label: 'Custom', value: 2 },
    ],
    group: 'Color',
    visibleWhen: { key: 'renderMode', equals: 0 },
  },
  {
    key: 'backgroundColor',
    label: 'Background Color',
    type: 'color',
    default: 0,
    group: 'Color',
    visibleWhen: [{ key: 'renderMode', equals: 0 }, { key: 'background', equals: 2 }],
  },
];

const ASCII_ART_FRAGMENT_SHADER = buildFragmentShader(
  `
uniform float u_cellSize;
uniform float u_contrast;
uniform float u_colorMode;
uniform float u_colorBlendMode;
uniform float u_charOpacity;
uniform float u_charSpacing;
uniform float u_aspectCorrection;
uniform float u_invert;
uniform float u_dotGridOverlay;
uniform float u_randomizeChars;
uniform float u_coverage;
uniform float u_density;
uniform float u_brightness;
uniform float u_threshold;
uniform float u_gamma;
uniform float u_blackPoint;
uniform float u_whitePoint;
uniform float u_edgeEmphasis;
uniform float u_sharpness;
uniform float u_animStyle;
uniform float u_animSpeed;
uniform float u_animAmount;
uniform float u_animRandomness;
uniform float u_animSeed;
uniform float u_animDirection;
uniform float u_background;
uniform float u_backgroundColor;
uniform float u_renderMode;
uniform float u_overlayOpacity;
uniform float u_overlayBlendMode;
uniform float u_colorSource;
uniform float u_overlayColor;
uniform float u_overlayGradientStart;
uniform float u_overlayGradientEnd;
uniform sampler2D u_charsetAtlas;
uniform float u_charsetCount;
  `,
  `
  vec2 cell = max(vec2(1.0), vec2(u_cellSize)) * u_pixelScale;
  vec2 cellAdj = vec2(cell.x, cell.y * max(0.1, u_aspectCorrection));
  vec2 cellId = floor(v_uv * u_resolution / cellAdj);
  vec2 cellUV = mod(v_uv * u_resolution, cellAdj) / cellAdj - 0.5;
  vec2 sampleUV = (cellId + 0.5) * cellAdj / u_resolution;
  // Average a small cross of taps across the cell instead of a single point sample -- a lone pixel
  // is noisy on detailed photos (fine texture/grain), which fragmented the glyph choice into visual
  // static instead of tracking the image's actual regional tone.
  vec2 tapOff = cellAdj * 0.3 / u_resolution;
  vec4 src = texture2D(u_texture, sampleUV);
  src += texture2D(u_texture, sampleUV + vec2(tapOff.x, 0.0));
  src += texture2D(u_texture, sampleUV - vec2(tapOff.x, 0.0));
  src += texture2D(u_texture, sampleUV + vec2(0.0, tapOff.y));
  src += texture2D(u_texture, sampleUV - vec2(0.0, tapOff.y));
  src *= 0.2;
  vec4 srcFull = texture2D(u_texture, v_uv);

  float lum = dot(src.rgb, vec3(0.299, 0.587, 0.114));

  if (u_edgeEmphasis > 0.001 || u_sharpness > 0.001) {
    vec2 stepUV = cellAdj / u_resolution;
    float lumR = dot(texture2D(u_texture, sampleUV + vec2(stepUV.x, 0.0)).rgb, vec3(0.299, 0.587, 0.114));
    float lumL = dot(texture2D(u_texture, sampleUV - vec2(stepUV.x, 0.0)).rgb, vec3(0.299, 0.587, 0.114));
    float lumD = dot(texture2D(u_texture, sampleUV + vec2(0.0, stepUV.y)).rgb, vec3(0.299, 0.587, 0.114));
    float lumU = dot(texture2D(u_texture, sampleUV - vec2(0.0, stepUV.y)).rgb, vec3(0.299, 0.587, 0.114));
    if (u_edgeEmphasis > 0.001) {
      float edge = abs(lum - lumR) + abs(lum - lumD);
      lum = clamp(lum + edge * u_edgeEmphasis * 2.0, 0.0, 1.0);
    }
    if (u_sharpness > 0.001) {
      float avg = (lumL + lumR + lumU + lumD) * 0.25;
      lum = clamp(lum + (lum - avg) * u_sharpness * 3.0, 0.0, 1.0);
    }
  }

  lum = pow(clamp(lum, 0.0001, 1.0), 1.0 / max(u_gamma, 0.05));
  lum = clamp((lum - u_blackPoint) / max(u_whitePoint - u_blackPoint, 0.001), 0.0, 1.0);
  lum = clamp((lum - 0.5) * u_contrast + 0.5, 0.0, 1.0);
  lum = clamp(lum + (lum - 0.5) * u_density * 1.5 + u_density * 0.15, 0.0, 1.0);

  if (u_threshold > 0.001) {
    lum = mix(lum, step(0.5, lum), u_threshold);
  }

  float flickerMul = 1.0;
  if (u_animStyle > 2.5) {
    float rad = radians(u_animDirection);
    vec2 dir = vec2(cos(rad), sin(rad));
    float phase = dot(cellId, dir) * 0.35 - u_time * (0.5 + u_animSpeed * 3.0);
    lum = clamp(lum + sin(phase) * 0.5 * u_animAmount, 0.0, 1.0);
  } else if (u_animStyle > 1.5) {
    float t = floor(u_time * (2.0 + u_animSpeed * 8.0));
    float r = hash12(cellId * 1.7 + t + u_animSeed);
    if (r < 0.15 + u_animRandomness * u_animAmount) {
      flickerMul = 0.15 + hash12(cellId + t * 1.3) * 0.5;
    }
  }

  if (u_invert > 0.5) lum = 1.0 - lum;

  float levelF = lum * u_charsetCount;
  if (u_animStyle > 0.5 && u_animStyle < 1.5) {
    float t = floor(u_time * (2.0 + u_animSpeed * 6.0));
    levelF += (hash12(cellId + t + u_animSeed) - 0.5) * 2.4 * u_animAmount;
  }
  if (u_randomizeChars > 0.5) {
    levelF += (hash12(cellId + 91.7) - 0.5) * 1.2;
  }
  // Clamp to just under the top index (not the top index itself) so floor() below can still
  // land exactly on charsetCount - 1 -- the densest/last glyph in the set -- instead of it
  // being unreachable, which made any short charset (e.g. a 2-glyph blank+icon ramp) always
  // render as blank.
  levelF = clamp(levelF, 0.0, max(u_charsetCount - 0.001, 0.0));
  float level = floor(levelF);

  vec2 glyphUV = cellUV / max(0.15, 1.0 - u_charSpacing);
  float cov = 0.0;
  if (abs(glyphUV.x) < 0.5 && abs(glyphUV.y) < 0.5) {
    vec2 atlasUV = vec2((level + glyphUV.x + 0.5) / u_charsetCount, glyphUV.y + 0.5);
    cov = texture2D(u_charsetAtlas, atlasUV).a;
  }
  cov = clamp(cov * u_coverage * flickerMul, 0.0, 1.0);

  vec3 col;
  float outAlpha = src.a;

  if (u_renderMode > 0.5) {
    // Overlay: the original image stays fully visible (at native resolution, not per-cell blocks);
    // characters are composited on top of it.
    vec3 charColor;
    if (u_colorSource < 0.5) {
      charColor = src.rgb;
    } else if (u_colorSource < 1.5) {
      charColor = unpackColor(u_overlayColor);
    } else {
      charColor = mix(unpackColor(u_overlayGradientStart), unpackColor(u_overlayGradientEnd), lum);
    }
    vec3 blended = applyBlend(srcFull.rgb, charColor, u_overlayBlendMode);
    col = mix(srcFull.rgb, blended, cov * u_overlayOpacity);
    outAlpha = srcFull.a;
  } else {
    // Full ASCII: the character grid entirely replaces the image.
    vec3 bg = vec3(0.03);
    vec3 fg = vec3(0.92);
    if (u_colorMode > 0.5 && u_colorMode < 1.5) {
      fg = src.rgb;
      bg = src.rgb * 0.06;
    } else if (u_colorMode > 1.5) {
      fg = vec3(0.35, 1.0, 0.55);
      bg = vec3(0.0, 0.04, 0.02);
    }
    if (u_background > 1.5) {
      bg = unpackColor(u_backgroundColor);
    }

    col = mix(bg, fg, cov * u_charOpacity);
    col = applyBlend(src.rgb, col, u_colorBlendMode);
    col *= u_brightness;

    if (u_background > 0.5 && u_background < 1.5) {
      outAlpha = src.a * cov;
    }
  }

  if (u_dotGridOverlay > 0.5) {
    vec2 gridUV = fract(v_uv * u_resolution / cellAdj);
    float gd = length(gridUV);
    float dotMask = 1.0 - smoothstep(0.03, 0.07, gd);
    col += dotMask * 0.18;
  }

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), outAlpha);
  `
);

/**
 * Builds a standalone ASCII Art effect card pre-configured with one of its quick-preset's values,
 * so each preset is directly addable from the Effects list instead of only being reachable as a
 * chip inside ASCII Art's own settings panel once it's already in the stack.
 */
function asciiPresetShader(
  id: string,
  name: string,
  description: string,
  thumbnail: string,
  overrides: Record<string, number>
): ShaderDef {
  return {
    id,
    name,
    category: 'ASCII',
    description,
    thumbnail,
    usesCharsetAtlas: true,
    params: ASCII_ART_PARAMS.map((p) => (p.key in overrides ? { ...p, default: overrides[p.key] } : p)),
    fragmentShader: ASCII_ART_FRAGMENT_SHADER,
  };
}

export const BUILTIN_SHADERS: ShaderDef[] = [
  {
    id: 'rgb-split',
    name: 'RGB Split',
    category: 'Color',
    description: 'Separate the red, green and blue channels along an angle.',
    thumbnailImage: '\thumbnails\RGB Split.png',
    thumbnail: 'from-red-400 via-emerald-400 to-blue-400',
    params: [
      { key: 'intensity', label: 'Intensity', type: 'float', default: 0.5, min: 0, max: 1, step: 0.01 },
      { key: 'redOffset', label: 'Red Offset', type: 'float', default: 8, min: -50, max: 50, step: 0.5 },
      { key: 'greenOffset', label: 'Green Offset', type: 'float', default: 0, min: -50, max: 50, step: 0.5 },
      { key: 'blueOffset', label: 'Blue Offset', type: 'float', default: -8, min: -50, max: 50, step: 0.5 },
      { key: 'angle', label: 'Angle', type: 'float', default: 0, min: 0, max: 360, step: 1, unit: '°', advanced: true },
    ],
    fragmentShader: buildFragmentShader(
      `
uniform float u_intensity;
uniform float u_redOffset;
uniform float u_greenOffset;
uniform float u_blueOffset;
uniform float u_angle;
uniform float u_colorBlendMode;
      `,
      `
  vec2 dir = vec2(cos(radians(u_angle)), sin(radians(u_angle)));
  vec2 px = dir * u_pixelScale / u_resolution;
  float amt = u_intensity;
  vec2 rUV = v_uv + px * u_redOffset * amt;
  vec2 gUV = v_uv + px * u_greenOffset * amt;
  vec2 bUV = v_uv + px * u_blueOffset * amt;
  float r = texture2D(u_texture, rUV).r;
  float g = texture2D(u_texture, gUV).g;
  float b = texture2D(u_texture, bUV).b;
  vec4 orig = texture2D(u_texture, v_uv);
  vec3 split = vec3(r, g, b);
  vec3 outc = applyBlend(orig.rgb, split, u_colorBlendMode);
  gl_FragColor = vec4(outc, orig.a);
      `
    ),
  },
  {
    id: 'glitch',
    name: 'Glitch',
    category: 'Distortion',
    description: 'Digital block displacement with color-channel tearing.',
    thumbnailImage: '/thumbnails/glitch.png',
    thumbnail: 'from-fuchsia-500 via-cyan-400 to-yellow-300',
    params: [
      { key: 'amount', label: 'Amount', type: 'float', default: 0.4, min: 0, max: 1, step: 0.01 },
      { key: 'blockSize', label: 'Block Size', type: 'float', default: 24, min: 2, max: 120, step: 1 },
      { key: 'speed', label: 'Speed', type: 'float', default: 1, min: 0, max: 5, step: 0.05 },
      { key: 'colorShift', label: 'Color Shift', type: 'float', default: 0.5, min: 0, max: 1, step: 0.01, advanced: true },
      { key: 'seed', label: 'Seed', type: 'float', default: 0, min: 0, max: 100, step: 1, advanced: true },
    ],
    fragmentShader: buildFragmentShader(
      `
uniform float u_amount;
uniform float u_blockSize;
uniform float u_speed;
uniform float u_colorShift;
uniform float u_seed;
      `,
      `
  float t = u_time * u_speed;
  float blockY = floor(v_uv.y * u_resolution.y / max(u_blockSize * u_pixelScale, 1.0));
  float n = hash12(vec2(blockY, floor(t * 10.0) + u_seed));
  float trigger = step(0.55, hash12(vec2(blockY, floor(t * 6.0) + u_seed + 1.0)));
  float shift = (n - 0.5) * u_amount * trigger;
  vec2 uv = v_uv;
  uv.x += shift * 0.25;
  vec2 uvR = uv + vec2(u_colorShift * 0.01, 0.0);
  vec2 uvB = uv - vec2(u_colorShift * 0.01, 0.0);
  float r = texture2D(u_texture, uvR).r;
  float g = texture2D(u_texture, uv).g;
  float b = texture2D(u_texture, uvB).b;
  float a = texture2D(u_texture, uv).a;
  gl_FragColor = vec4(r, g, b, a);
      `
    ),
  },
  {
    id: 'crt',
    name: 'CRT',
    category: 'Retro',
    description: 'Barrel-curved screen with scanlines and chroma bleed.',
    thumbnail: 'from-emerald-400 via-teal-400 to-slate-700',
    params: [
      { key: 'curvature', label: 'Curvature', type: 'float', default: 0.3, min: 0, max: 1, step: 0.01 },
      { key: 'scanlineIntensity', label: 'Scanlines', type: 'float', default: 0.5, min: 0, max: 1, step: 0.01 },
      { key: 'vignette', label: 'Vignette', type: 'float', default: 0.4, min: 0, max: 1, step: 0.01 },
      { key: 'brightness', label: 'Brightness', type: 'float', default: 1.1, min: 0, max: 2, step: 0.01, advanced: true },
      { key: 'chromaAberration', label: 'Chroma', type: 'float', default: 0.3, min: 0, max: 1, step: 0.01, advanced: true },
    ],
    fragmentShader: buildFragmentShader(
      `
uniform float u_curvature;
uniform float u_scanlineIntensity;
uniform float u_vignette;
uniform float u_brightness;
uniform float u_chromaAberration;
      `,
      `
  vec2 uv = v_uv * 2.0 - 1.0;
  vec2 offset = uv.yx / 6.0 * u_curvature;
  uv = uv + uv * offset * offset;
  uv = uv * 0.5 + 0.5;
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
  } else {
    float ca = u_chromaAberration * 0.004;
    float r = texture2D(u_texture, uv + vec2(ca, 0.0)).r;
    float g = texture2D(u_texture, uv).g;
    float b = texture2D(u_texture, uv - vec2(ca, 0.0)).b;
    vec3 col = vec3(r, g, b);
    float scan = sin(uv.y * u_resolution.y / u_pixelScale * 1.0) * 0.5 + 0.5;
    col *= mix(1.0, scan, u_scanlineIntensity);
    vec2 vc = uv - 0.5;
    float vig = 1.0 - dot(vc, vc) * u_vignette * 2.0;
    col *= vig;
    col *= u_brightness;
    gl_FragColor = vec4(col, 1.0);
  }
      `
    ),
  },
  {
    id: 'pixelate',
    name: 'Pixelate',
    category: 'Texture',
    description: 'Chunky mosaic pixel blocks.',
    thumbnail: 'from-orange-400 via-amber-300 to-rose-400',
    params: [
      { key: 'pixelSize', label: 'Pixel Size', type: 'float', default: 12, min: 1, max: 100, step: 1 },
      { key: 'smoothness', label: 'Smoothness', type: 'float', default: 0, min: 0, max: 1, step: 0.01, advanced: true },
    ],
    fragmentShader: buildFragmentShader(
      `
uniform float u_pixelSize;
uniform float u_smoothness;
      `,
      `
  vec2 size = max(vec2(1.0), vec2(u_pixelSize)) * u_pixelScale;
  vec2 uv = (floor(v_uv * u_resolution / size) + 0.5) * size / u_resolution;
  vec2 uvFinal = mix(uv, v_uv, u_smoothness);
  gl_FragColor = texture2D(u_texture, uvFinal);
      `
    ),
  },
  {
    id: 'dither',
    name: 'Dither',
    category: 'Texture',
    description: 'Ordered-noise dithering with quantized levels.',
    thumbnail: 'from-slate-800 via-slate-400 to-white',
    params: [
      { key: 'levels', label: 'Levels', type: 'float', default: 4, min: 2, max: 16, step: 1 },
      { key: 'pixelSize', label: 'Pixel Size', type: 'float', default: 2, min: 1, max: 8, step: 1 },
      {
        key: 'colorMode',
        label: 'Mode',
        type: 'select',
        default: 0,
        options: [
          { label: 'Color', value: 0 },
          { label: 'Mono', value: 1 },
        ],
        advanced: true,
      },
    ],
    fragmentShader: buildFragmentShader(
      `
uniform float u_levels;
uniform float u_pixelSize;
uniform float u_colorMode;
      `,
      `
  vec2 ps = max(vec2(1.0), vec2(u_pixelSize)) * u_pixelScale;
  vec2 uv = floor(v_uv * u_resolution / ps) * ps / u_resolution;
  vec4 c = texture2D(u_texture, uv);
  vec2 pos = floor(v_uv * u_resolution / ps);
  float noise = hash12(pos) - 0.5;
  float levels = max(u_levels, 2.0);
  vec3 col = c.rgb;
  if (u_colorMode > 0.5) {
    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    lum += noise / levels;
    lum = floor(lum * levels + 0.5) / levels;
    col = vec3(lum);
  } else {
    col += noise / levels;
    col = floor(col * levels + 0.5) / levels;
  }
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), c.a);
      `
    ),
  },
  {
    id: 'noise',
    name: 'Noise',
    category: 'Texture',
    description: 'Animated random static overlay.',
    thumbnail: 'from-neutral-300 via-neutral-500 to-neutral-800',
    params: [
      { key: 'amount', label: 'Amount', type: 'float', default: 0.3, min: 0, max: 1, step: 0.01 },
      { key: 'scale', label: 'Scale', type: 'float', default: 100, min: 1, max: 500, step: 1 },
      { key: 'speed', label: 'Speed', type: 'float', default: 1, min: 0, max: 5, step: 0.05 },
      { key: 'monochrome', label: 'Monochrome', type: 'bool', default: 1, advanced: true },
    ],
    fragmentShader: buildFragmentShader(
      `
uniform float u_amount;
uniform float u_scale;
uniform float u_speed;
uniform float u_monochrome;
      `,
      `
  vec4 c = texture2D(u_texture, v_uv);
  vec2 p = v_uv * u_scale + u_time * u_speed * 10.0;
  float n1 = hash12(floor(p));
  vec3 n = vec3(n1);
  if (u_monochrome < 0.5) {
    n = vec3(hash12(floor(p) + 1.0), hash12(floor(p) + 2.0), hash12(floor(p) + 3.0));
  }
  vec3 col = c.rgb + (n - 0.5) * u_amount;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), c.a);
      `
    ),
  },
  {
    id: 'halftone',
    name: 'Halftone',
    category: 'Texture',
    description: 'Print-style dot screen pattern.',
    thumbnail: 'from-black via-neutral-500 to-neutral-200',
    params: [
      { key: 'dotSize', label: 'Dot Size', type: 'float', default: 8, min: 2, max: 40, step: 0.5 },
      { key: 'angle', label: 'Angle', type: 'float', default: 15, min: 0, max: 90, step: 1 },
      { key: 'contrast', label: 'Contrast', type: 'float', default: 1, min: 0, max: 2, step: 0.01, advanced: true },
      {
        key: 'colorMode',
        label: 'Mode',
        type: 'select',
        default: 0,
        options: [
          { label: 'Mono', value: 0 },
          { label: 'Color', value: 1 },
        ],
        advanced: true,
      },
    ],
    fragmentShader: buildFragmentShader(
      `
uniform float u_dotSize;
uniform float u_angle;
uniform float u_contrast;
uniform float u_colorMode;
      `,
      `
  vec4 c = texture2D(u_texture, v_uv);
  float size = max(u_dotSize, 2.0) * u_pixelScale;
  vec2 base = (v_uv - 0.5) * u_resolution;
  if (u_colorMode > 0.5) {
    vec2 pr = rotate2D(base, radians(u_angle));
    vec2 pg = rotate2D(base, radians(u_angle + 30.0));
    vec2 pb = rotate2D(base, radians(u_angle + 60.0));
    float dr = length(mod(pr, size) - size * 0.5);
    float dg = length(mod(pg, size) - size * 0.5);
    float db = length(mod(pb, size) - size * 0.5);
    float mr = 1.0 - smoothstep(c.r * size * 0.5 * u_contrast - 1.5, c.r * size * 0.5 * u_contrast, dr);
    float mg = 1.0 - smoothstep(c.g * size * 0.5 * u_contrast - 1.5, c.g * size * 0.5 * u_contrast, dg);
    float mb = 1.0 - smoothstep(c.b * size * 0.5 * u_contrast - 1.5, c.b * size * 0.5 * u_contrast, db);
    gl_FragColor = vec4(mr, mg, mb, c.a);
  } else {
    float lum = dot(c.rgb, vec3(0.299, 0.587, 0.114));
    vec2 p = rotate2D(base, radians(u_angle));
    float d = length(mod(p, size) - size * 0.5);
    float radius = lum * size * 0.5 * u_contrast;
    float m = 1.0 - smoothstep(radius - 1.5, radius, d);
    gl_FragColor = vec4(vec3(m), c.a);
  }
      `
    ),
  },
  {
    id: 'displacement',
    name: 'Displacement',
    category: 'Distortion',
    description: 'Warp pixels along an animated noise field.',
    thumbnailImage: '/thumbnails/Displacement.png',
    thumbnail: 'from-indigo-400 via-purple-400 to-pink-400',
    params: [
      { key: 'amount', label: 'Amount', type: 'float', default: 0.3, min: 0, max: 1, step: 0.01 },
      { key: 'scale', label: 'Scale', type: 'float', default: 8, min: 1, max: 50, step: 0.5 },
      { key: 'speed', label: 'Speed', type: 'float', default: 0.5, min: 0, max: 5, step: 0.05 },
      {
        key: 'direction',
        label: 'Direction',
        type: 'select',
        default: 0,
        options: [
          { label: 'Both', value: 0 },
          { label: 'Horizontal', value: 1 },
          { label: 'Vertical', value: 2 },
        ],
        advanced: true,
      },
    ],
    fragmentShader: buildFragmentShader(
      `
uniform float u_amount;
uniform float u_scale;
uniform float u_speed;
uniform float u_direction;
      `,
      `
  vec2 p = v_uv * u_scale + u_time * u_speed;
  float nx = vnoise(p) - 0.5;
  float ny = vnoise(p + 100.0) - 0.5;
  vec2 disp = vec2(nx, ny) * u_amount * 0.15;
  if (u_direction > 1.5) disp.x = 0.0;
  else if (u_direction > 0.5) disp.y = 0.0;
  gl_FragColor = texture2D(u_texture, v_uv + disp);
      `
    ),
  },
  {
    id: 'kaleidoscope',
    name: 'Kaleidoscope',
    category: 'Distortion',
    description: 'Mirrored radial segments around the center.',
    thumbnail: 'from-cyan-400 via-violet-500 to-pink-500',
    params: [
      { key: 'segments', label: 'Segments', type: 'float', default: 6, min: 2, max: 16, step: 1 },
      { key: 'rotation', label: 'Rotation', type: 'float', default: 0, min: 0, max: 360, step: 1 },
      { key: 'zoom', label: 'Zoom', type: 'float', default: 1, min: 0.2, max: 3, step: 0.01 },
      { key: 'offsetX', label: 'Offset X', type: 'float', default: 0, min: -1, max: 1, step: 0.01, advanced: true },
      { key: 'offsetY', label: 'Offset Y', type: 'float', default: 0, min: -1, max: 1, step: 0.01, advanced: true },
    ],
    fragmentShader: buildFragmentShader(
      `
uniform float u_segments;
uniform float u_rotation;
uniform float u_zoom;
uniform float u_offsetX;
uniform float u_offsetY;
      `,
      `
  vec2 uv = v_uv - 0.5;
  uv.x *= u_resolution.x / u_resolution.y;
  uv /= max(u_zoom, 0.01);
  float angle = atan(uv.y, uv.x) + radians(u_rotation);
  float radius = length(uv);
  float seg = 6.28318530718 / max(u_segments, 2.0);
  angle = mod(angle, seg);
  angle = abs(angle - seg * 0.5);
  vec2 kuv = vec2(cos(angle), sin(angle)) * radius;
  kuv.x /= u_resolution.x / u_resolution.y;
  kuv += vec2(u_offsetX, u_offsetY);
  kuv += 0.5;
  gl_FragColor = texture2D(u_texture, clamp(kuv, 0.001, 0.999));
      `
    ),
  },
  {
    id: 'bloom',
    name: 'Bloom',
    category: 'Light',
    description: 'Soft glow bleeding out of bright regions.',
    thumbnail: 'from-yellow-200 via-orange-300 to-red-400',
    params: [
      { key: 'threshold', label: 'Threshold', type: 'float', default: 0.6, min: 0, max: 1, step: 0.01 },
      { key: 'intensity', label: 'Intensity', type: 'float', default: 1, min: 0, max: 3, step: 0.01 },
      { key: 'radius', label: 'Radius', type: 'float', default: 6, min: 1, max: 20, step: 0.5, advanced: true },
    ],
    fragmentShader: buildFragmentShader(
      `
uniform float u_threshold;
uniform float u_intensity;
uniform float u_radius;
      `,
      `
  vec4 c = texture2D(u_texture, v_uv);
  vec2 texel = u_radius * u_pixelScale / u_resolution;
  vec3 bloom = vec3(0.0);
  for (int i = 0; i < 12; i++) {
    float a = float(i) * 0.5235987756;
    vec2 offset = vec2(cos(a), sin(a)) * texel;
    vec3 s = texture2D(u_texture, v_uv + offset).rgb;
    float lum = dot(s, vec3(0.299, 0.587, 0.114));
    float bright = max(lum - u_threshold, 0.0);
    bloom += s * bright;
  }
  bloom /= 12.0;
  vec3 col = c.rgb + bloom * u_intensity * 3.0;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), c.a);
      `
    ),
  },
  {
    id: 'film-grain',
    name: 'Film Grain',
    category: 'Texture',
    description: 'Organic animated grain like analog film stock.',
    thumbnail: 'from-stone-300 via-stone-500 to-stone-800',
    params: [
      { key: 'amount', label: 'Amount', type: 'float', default: 0.4, min: 0, max: 1, step: 0.01 },
      { key: 'size', label: 'Grain Size', type: 'float', default: 1.5, min: 0.5, max: 5, step: 0.1 },
      { key: 'speed', label: 'Speed', type: 'float', default: 1, min: 0, max: 5, step: 0.05, advanced: true },
      { key: 'colorAmount', label: 'Color Amount', type: 'float', default: 0.2, min: 0, max: 1, step: 0.01, advanced: true },
    ],
    fragmentShader: buildFragmentShader(
      `
uniform float u_amount;
uniform float u_size;
uniform float u_speed;
uniform float u_colorAmount;
      `,
      `
  vec4 c = texture2D(u_texture, v_uv);
  vec2 p = v_uv * u_resolution / (max(u_size, 0.1) * u_pixelScale) + u_time * u_speed * 60.0;
  float g1 = hash12(floor(p));
  float g2 = hash12(floor(p) + 50.0);
  float g3 = hash12(floor(p) + 150.0);
  vec3 grain = mix(vec3(g1), vec3(g1, g2, g3), u_colorAmount);
  vec3 col = c.rgb + (grain - 0.5) * u_amount * 0.6;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), c.a);
      `
    ),
  },
  {
    id: 'scanlines',
    name: 'Scanlines',
    category: 'Retro',
    description: 'Horizontal television scan lines.',
    thumbnail: 'from-lime-300 via-green-500 to-emerald-800',
    params: [
      { key: 'intensity', label: 'Intensity', type: 'float', default: 0.5, min: 0, max: 1, step: 0.01 },
      { key: 'count', label: 'Line Count', type: 'float', default: 300, min: 50, max: 1000, step: 10 },
      { key: 'speed', label: 'Speed', type: 'float', default: 0, min: -5, max: 5, step: 0.05, advanced: true },
      { key: 'thickness', label: 'Thickness', type: 'float', default: 0.5, min: 0.1, max: 1, step: 0.01, advanced: true },
    ],
    fragmentShader: buildFragmentShader(
      `
uniform float u_intensity;
uniform float u_count;
uniform float u_speed;
uniform float u_thickness;
      `,
      `
  vec4 c = texture2D(u_texture, v_uv);
  float y = v_uv.y * u_count + u_time * u_speed;
  float wave = sin(y * 3.14159265) * 0.5 + 0.5;
  float line = smoothstep(1.0 - u_thickness, 1.0, wave);
  vec3 col = c.rgb * (1.0 - line * u_intensity);
  gl_FragColor = vec4(col, c.a);
      `
    ),
  },
  {
    id: 'vignette',
    name: 'Vignette',
    category: 'Light',
    description: 'Darkened, softened frame edges.',
    thumbnail: 'from-white via-neutral-400 to-black',
    params: [
      { key: 'intensity', label: 'Intensity', type: 'float', default: 1, min: 0, max: 2, step: 0.01 },
      { key: 'radius', label: 'Radius', type: 'float', default: 0.75, min: 0, max: 1.5, step: 0.01 },
      { key: 'softness', label: 'Softness', type: 'float', default: 0.4, min: 0, max: 1, step: 0.01 },
      { key: 'roundness', label: 'Roundness', type: 'float', default: 1, min: 0, max: 1, step: 0.01, advanced: true },
    ],
    fragmentShader: buildFragmentShader(
      `
uniform float u_intensity;
uniform float u_radius;
uniform float u_softness;
uniform float u_roundness;
      `,
      `
  vec4 c = texture2D(u_texture, v_uv);
  vec2 uv = v_uv - 0.5;
  uv.x *= mix(u_resolution.x / u_resolution.y, 1.0, u_roundness);
  float d = length(uv);
  float edge0 = max(u_radius - u_softness, 0.0);
  float t = smoothstep(edge0, u_radius, d);
  vec3 col = c.rgb * mix(1.0, clamp(1.0 - u_intensity, 0.0, 1.0), t);
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), c.a);
      `
    ),
  },
  {
    id: 'chromatic-aberration',
    name: 'Chromatic Aberration',
    category: 'Color',
    description: 'Lens-like radial color fringing.',
    thumbnailImage: '/thumbnails/chromatic_aberration.png',
    thumbnail: 'from-red-400 via-white to-blue-400',
    params: [
      { key: 'intensity', label: 'Intensity', type: 'float', default: 0.5, min: 0, max: 1, step: 0.01 },
      { key: 'radialAmount', label: 'Radial Amount', type: 'float', default: 0.7, min: 0, max: 1, step: 0.01 },
      { key: 'angle', label: 'Angle', type: 'float', default: 0, min: 0, max: 360, step: 1, advanced: true },
    ],
    fragmentShader: buildFragmentShader(
      `
uniform float u_intensity;
uniform float u_radialAmount;
uniform float u_angle;
      `,
      `
  vec2 center = vec2(0.5);
  vec2 toCenter = v_uv - center;
  float dist = length(toCenter);
  vec2 radialDir = dist > 0.0001 ? toCenter / dist : vec2(0.0);
  vec2 dirFixed = vec2(cos(radians(u_angle)), sin(radians(u_angle)));
  vec2 dir = mix(dirFixed, radialDir, u_radialAmount);
  float amt = u_intensity * 0.02 * (0.3 + dist * u_radialAmount * 2.0);
  vec2 offset = dir * amt;
  float r = texture2D(u_texture, v_uv + offset).r;
  float g = texture2D(u_texture, v_uv).g;
  float b = texture2D(u_texture, v_uv - offset).b;
  float a = texture2D(u_texture, v_uv).a;
  gl_FragColor = vec4(r, g, b, a);
      `
    ),
  },
  {
    id: 'color-shift',
    name: 'Color Shift',
    category: 'Color',
    description: 'Hue, saturation, brightness and contrast grading.',
    thumbnail: 'from-pink-400 via-yellow-300 to-cyan-400',
    params: [
      { key: 'hue', label: 'Hue', type: 'float', default: 0, min: -180, max: 180, step: 1, unit: '°' },
      { key: 'saturation', label: 'Saturation', type: 'float', default: 1, min: 0, max: 2, step: 0.01 },
      { key: 'brightness', label: 'Brightness', type: 'float', default: 1, min: 0, max: 2, step: 0.01 },
      { key: 'contrast', label: 'Contrast', type: 'float', default: 1, min: 0, max: 2, step: 0.01, advanced: true },
    ],
    fragmentShader: buildFragmentShader(
      `
uniform float u_hue;
uniform float u_saturation;
uniform float u_brightness;
uniform float u_contrast;
      `,
      `
  vec4 c = texture2D(u_texture, v_uv);
  vec3 hsv = rgb2hsv(c.rgb);
  hsv.x = fract(hsv.x + u_hue / 360.0);
  hsv.y = clamp(hsv.y * u_saturation, 0.0, 1.0);
  vec3 col = hsv2rgb(hsv);
  col *= u_brightness;
  col = (col - 0.5) * u_contrast + 0.5;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), c.a);
      `
    ),
  },
  {
    id: 'ascii-art',
    name: 'ASCII Art',
    category: 'ASCII',
    description: 'Real typed characters mapped to image luminance, via a live character-atlas texture.',
    thumbnail: 'from-emerald-300 via-emerald-600 to-neutral-950',
    usesCharsetAtlas: true,
    params: ASCII_ART_PARAMS,
    fragmentShader: ASCII_ART_FRAGMENT_SHADER,
  },
  // Each of the ASCII Art quick-presets above is also exposed as its own standalone effect card
  // here, so it can be added directly from the Effects list without first adding a plain ASCII
  // Art layer and then hunting for the preset chip inside its settings panel.
  asciiPresetShader('ascii-classic', 'Classic ASCII', 'The default typewriter-style ASCII grid.', 'from-neutral-200 via-neutral-500 to-neutral-950', { characterSet: 0, colorMode: 0, background: 0, animStyle: 0, invert: 0, contrast: 1.1, density: 0.3 }),
  asciiPresetShader('ascii-terminal', 'Terminal ASCII', 'Green phosphor terminal-style ASCII grid.', 'from-green-400 via-green-700 to-black', { characterSet: 0, colorMode: 2, background: 0, animStyle: 0, contrast: 1.15 }),
  asciiPresetShader('ascii-matrix', 'ASCII Matrix', 'Inverted green glyphs with a jittering Matrix-style flicker.', 'from-green-300 via-emerald-800 to-black', { characterSet: 1, colorMode: 2, background: 0, animStyle: 1, animSpeed: 2.2, animAmount: 0.8, animRandomness: 0.7, invert: 1 }),
  asciiPresetShader('ascii-retro', 'ASCII Retro', 'Warm-tinted block characters with a soft retro glow.', 'from-amber-300 via-orange-600 to-neutral-900', { characterSet: 1, colorMode: 1, contrast: 1.2, density: 0.4, tintColor: 16757575, tintAmount: 0.35, colorBlendMode: 9 }),
  asciiPresetShader('ascii-high-contrast', 'ASCII High Contrast', 'Crisp black & white ASCII with punchy thresholding.', 'from-neutral-100 via-neutral-500 to-black', { threshold: 0.35, contrast: 1.6, gamma: 0.75, blackPoint: 0.08, whitePoint: 0.92, sharpness: 0.5, coverage: 1 }),
  asciiPresetShader('ascii-overlay', 'ASCII Overlay', 'White characters overlaid on the untouched photo.', 'from-white via-neutral-400 to-neutral-800', { renderMode: 1, colorSource: 1, overlayColor: 16777215, overlayBlendMode: 5, overlayOpacity: 0.6, characterSet: 0, cellSize: 10 }),
  asciiPresetShader('ascii-studio', 'ASCII Studio', 'Dense glowing diamond field overlaid on the image.', 'from-cyan-200 via-fuchsia-400 to-neutral-950', { renderMode: 1, colorSource: 0, characterSet: 12, cellSize: 8, charSpacing: 0.03, overlayBlendMode: 6, overlayOpacity: 0.95, coverage: 1, density: 0.7, contrast: 1.4, gamma: 0.85, blackPoint: 0.05, whitePoint: 1, dotGridOverlay: 1, randomizeChars: 0, animStyle: 1, animSpeed: 0.6, animAmount: 0.15, animRandomness: 0.3 }),
  asciiPresetShader('ascii-sparkle', 'ASCII Sparkle', 'Sparse glowing glyphs that twinkle across highlights.', 'from-sky-200 via-cyan-400 to-neutral-950', { renderMode: 1, colorSource: 0, characterSet: 3, cellSize: 16, charSpacing: 0.15, overlayBlendMode: 5, overlayOpacity: 0.85, coverage: 0.85, density: 0.15, contrast: 1.5, gamma: 0.55, blackPoint: 0.5, whitePoint: 1, randomizeChars: 1, animStyle: 1, animSpeed: 0.8, animAmount: 0.5, animRandomness: 0.7 }),
  asciiPresetShader('ascii-code-overlay', 'Code Overlay', 'Hex-code style digits overlaid in glowing color.', 'from-lime-300 via-emerald-500 to-neutral-950', { renderMode: 1, colorSource: 0, characterSet: 4, cellSize: 10, overlayBlendMode: 5, overlayOpacity: 0.85, coverage: 0.9, density: 0.4, contrast: 1.2 }),
  asciiPresetShader('ascii-suit-overlay', 'Suit Overlay', 'Card-suit glyphs with a fine dot-grid backdrop.', 'from-pink-300 via-fuchsia-500 to-neutral-950', { renderMode: 1, colorSource: 0, characterSet: 5, cellSize: 11, overlayBlendMode: 6, overlayOpacity: 0.85, coverage: 1, density: 0.5, contrast: 1.25, dotGridOverlay: 1 }),
  {
    id: 'dream-ascii',
    name: 'Dream ASCII',
    category: 'ASCII',
    description: 'Glowing, color-drifting ascii glyphs with magical sparkle.',
    thumbnail: 'from-violet-400 via-fuchsia-400 to-indigo-900',
    params: [
      { key: 'cellSize', label: 'Cell Size', type: 'float', default: 16, min: 4, max: 40, step: 1 },
      { key: 'contrast', label: 'Contrast', type: 'float', default: 1, min: 0, max: 2, step: 0.01 },
      { key: 'glow', label: 'Glow', type: 'float', default: 0.6, min: 0, max: 1, step: 0.01 },
      { key: 'sparkle', label: 'Sparkle', type: 'float', default: 0.4, min: 0, max: 1, step: 0.01 },
      { key: 'hueSpeed', label: 'Hue Drift', type: 'float', default: 0.3, min: 0, max: 2, step: 0.01, advanced: true },
      { key: 'saturation', label: 'Saturation', type: 'float', default: 0.7, min: 0, max: 1, step: 0.01, advanced: true },
    ],
    fragmentShader: buildFragmentShader(
      `
uniform float u_cellSize;
uniform float u_contrast;
uniform float u_glow;
uniform float u_sparkle;
uniform float u_hueSpeed;
uniform float u_saturation;

float dreamLine(vec2 p, vec2 a, vec2 b, float thick) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  float d = length(pa - ba * h);
  return 1.0 - smoothstep(thick * 0.7, thick, d);
}

float dreamGlyph(vec2 p, float level) {
  float thick = 0.1;
  float ext = 0.34;
  if (level < 0.5) {
    return 0.0;
  } else if (level < 1.5) {
    return 1.0 - smoothstep(0.06, 0.1, length(p));
  } else if (level < 2.5) {
    float a = dreamLine(p, vec2(0.0, -ext), vec2(0.0, ext), thick);
    float b = dreamLine(p, vec2(-ext, 0.0), vec2(ext, 0.0), thick);
    return max(a, b);
  } else if (level < 3.5) {
    float a = dreamLine(p, vec2(0.0, -ext), vec2(0.0, ext), thick);
    float b = dreamLine(p, vec2(-ext, 0.0), vec2(ext, 0.0), thick);
    float c = dreamLine(p, vec2(-ext, -ext), vec2(ext, ext), thick * 0.85);
    float d = dreamLine(p, vec2(-ext, ext), vec2(ext, -ext), thick * 0.85);
    return max(max(a, b), max(c, d));
  } else if (level < 4.5) {
    float boxD = max(abs(p.x), abs(p.y));
    return 1.0 - smoothstep(ext * 0.85, ext * 0.85 + 0.05, boxD);
  } else {
    float boxD = max(abs(p.x), abs(p.y));
    return 1.0 - smoothstep(0.44, 0.49, boxD);
  }
}
      `,
      `
  vec2 cell = max(vec2(1.0), vec2(u_cellSize)) * u_pixelScale;
  vec2 cellId = floor(v_uv * u_resolution / cell);
  vec2 cellUV = mod(v_uv * u_resolution, cell) / cell - 0.5;
  vec2 sampleUV = (cellId + 0.5) * cell / u_resolution;
  vec2 tapOff = cell * 0.3 / u_resolution;
  vec4 src = texture2D(u_texture, sampleUV);
  src += texture2D(u_texture, sampleUV + vec2(tapOff.x, 0.0));
  src += texture2D(u_texture, sampleUV - vec2(tapOff.x, 0.0));
  src += texture2D(u_texture, sampleUV + vec2(0.0, tapOff.y));
  src += texture2D(u_texture, sampleUV - vec2(0.0, tapOff.y));
  src *= 0.2;

  float lum = dot(src.rgb, vec3(0.299, 0.587, 0.114));
  lum = clamp((lum - 0.5) * u_contrast + 0.5, 0.0, 1.0);
  float level = floor(lum * 5.999);
  float cov = dreamGlyph(cellUV, level);

  float hue = fract(0.68 + sin(cellId.x * 0.15 + cellId.y * 0.09 + u_time * u_hueSpeed) * 0.15 + u_time * u_hueSpeed * 0.04);
  vec3 magic = hsv2rgb(vec3(hue, u_saturation, 1.0));
  vec3 bg = mix(vec3(0.02, 0.01, 0.05), magic * 0.12, 0.6);
  vec3 fg = mix(vec3(1.0), magic, 0.55);

  float glowAmt = smoothstep(0.15, 1.0, lum) * u_glow;
  vec3 col = mix(bg, fg, cov);
  col += magic * glowAmt * 0.5 * (1.0 - cov);

  float tw = hash12(cellId + floor(u_time * 2.0));
  float sparkle = step(0.985 - u_sparkle * 0.3, tw) * (0.5 + 0.5 * sin(u_time * 10.0 + tw * 50.0));
  col += vec3(1.0, 0.95, 1.0) * sparkle * u_sparkle;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), src.a);
      `
    ),
  },
  {
    id: 'stippling',
    name: 'Stippling',
    category: 'DreamLight',
    description: 'Hand-inked pointillism — jittered dots sized by darkness.',
    thumbnail: 'from-neutral-100 via-neutral-400 to-neutral-900',
    params: [
      { key: 'cellSize', label: 'Density', type: 'float', default: 10, min: 4, max: 30, step: 1 },
      { key: 'dotSize', label: 'Dot Size', type: 'float', default: 0.55, min: 0.1, max: 1, step: 0.01 },
      { key: 'jitter', label: 'Jitter', type: 'float', default: 0.6, min: 0, max: 1, step: 0.01 },
      {
        key: 'colorMode',
        label: 'Mode',
        type: 'select',
        default: 0,
        options: [
          { label: 'Mono', value: 0 },
          { label: 'Color', value: 1 },
        ],
        advanced: true,
      },
    ],
    fragmentShader: buildFragmentShader(
      `
uniform float u_cellSize;
uniform float u_dotSize;
uniform float u_jitter;
uniform float u_colorMode;
      `,
      `
  vec2 cell = max(vec2(2.0), vec2(u_cellSize)) * u_pixelScale;
  vec2 cellId = floor(v_uv * u_resolution / cell);
  vec2 cellUV = mod(v_uv * u_resolution, cell) / cell - 0.5;
  vec2 jitterOff = (vec2(hash12(cellId), hash12(cellId + 17.0)) - 0.5) * u_jitter * 0.7;
  vec2 sampleUV = clamp((cellId + 0.5 + jitterOff) * cell / u_resolution, 0.001, 0.999);
  vec4 src = texture2D(u_texture, sampleUV);

  float lum = dot(src.rgb, vec3(0.299, 0.587, 0.114));
  float radius = (1.0 - lum) * u_dotSize * 0.5;
  float d = length(cellUV - jitterOff);
  float cov = 1.0 - smoothstep(max(radius - 0.05, 0.0), radius, d);

  vec3 fg = u_colorMode > 0.5 ? src.rgb : vec3(0.06);
  vec3 col = mix(vec3(0.96), fg, cov);
  gl_FragColor = vec4(col, src.a);
      `
    ),
  },
  {
    id: 'cross-hatch',
    name: 'Cross-Hatch',
    category: 'DreamLight',
    description: 'Pen-and-ink hatching that layers with shadow depth.',
    thumbnail: 'from-neutral-50 via-neutral-300 to-neutral-800',
    params: [
      { key: 'lineSpacing', label: 'Line Spacing', type: 'float', default: 7, min: 2, max: 24, step: 0.5 },
      { key: 'lineWidth', label: 'Line Width', type: 'float', default: 0.18, min: 0.05, max: 0.6, step: 0.01 },
      { key: 'contrast', label: 'Contrast', type: 'float', default: 1, min: 0, max: 2, step: 0.01 },
      {
        key: 'style',
        label: 'Style',
        type: 'select',
        default: 0,
        options: [
          { label: 'Diagonal', value: 0 },
          { label: 'Grid', value: 1 },
        ],
        advanced: true,
      },
    ],
    fragmentShader: buildFragmentShader(
      `
uniform float u_lineSpacing;
uniform float u_lineWidth;
uniform float u_contrast;
uniform float u_style;

float hatchLine(vec2 p, float spacing, float width, float angle) {
  float s = sin(angle);
  float c = cos(angle);
  vec2 rp = mat2(c, -s, s, c) * p;
  float m = mod(rp.x, spacing);
  return step(m, width);
}
      `,
      `
  vec4 src = texture2D(u_texture, v_uv);
  float lum = dot(src.rgb, vec3(0.299, 0.587, 0.114));
  lum = clamp((lum - 0.5) * u_contrast + 0.5, 0.0, 1.0);

  vec2 p = v_uv * u_resolution;
  float spacing = max(u_lineSpacing, 2.0) * u_pixelScale;
  float width = spacing * u_lineWidth;
  float baseAngle = u_style > 0.5 ? 0.0 : radians(45.0);
  float h1 = hatchLine(p, spacing, width, baseAngle);
  float h2 = hatchLine(p, spacing, width, baseAngle + radians(90.0));
  float h3 = hatchLine(p, spacing, width, baseAngle + radians(45.0));

  float ink = 0.0;
  if (lum < 0.22) ink = max(max(h1, h2), h3);
  else if (lum < 0.48) ink = max(h1, h2);
  else if (lum < 0.74) ink = h1;

  vec3 col = mix(vec3(1.0), vec3(0.04), ink);
  gl_FragColor = vec4(col, src.a);
      `
    ),
  },
  {
    id: 'dithering',
    name: 'Dithering',
    category: 'DreamLight',
    description: 'True ordered Bayer dithering with adjustable tone levels.',
    thumbnail: 'from-white via-neutral-500 to-black',
    params: [
      { key: 'levels', label: 'Levels', type: 'float', default: 2, min: 2, max: 8, step: 1 },
      { key: 'scale', label: 'Block Scale', type: 'float', default: 1, min: 1, max: 6, step: 1 },
      {
        key: 'colorMode',
        label: 'Mode',
        type: 'select',
        default: 0,
        options: [
          { label: 'Color', value: 0 },
          { label: 'Mono', value: 1 },
        ],
        advanced: true,
      },
    ],
    fragmentShader: buildFragmentShader(
      `
uniform float u_levels;
uniform float u_scale;
uniform float u_colorMode;

float bayerValue(vec2 p) {
  float x = mod(p.x, 4.0);
  float y = mod(p.y, 4.0);
  float i = x + y * 4.0;
  if (i < 0.5) return 0.0;
  else if (i < 1.5) return 8.0;
  else if (i < 2.5) return 2.0;
  else if (i < 3.5) return 10.0;
  else if (i < 4.5) return 12.0;
  else if (i < 5.5) return 4.0;
  else if (i < 6.5) return 14.0;
  else if (i < 7.5) return 6.0;
  else if (i < 8.5) return 3.0;
  else if (i < 9.5) return 11.0;
  else if (i < 10.5) return 1.0;
  else if (i < 11.5) return 9.0;
  else if (i < 12.5) return 15.0;
  else if (i < 13.5) return 7.0;
  else if (i < 14.5) return 13.0;
  else return 5.0;
}
      `,
      `
  float scale = max(u_scale, 1.0) * u_pixelScale;
  vec2 blockPos = floor(v_uv * u_resolution / scale);
  vec2 sampleUV = clamp((blockPos + 0.5) * scale / u_resolution, 0.001, 0.999);
  vec4 src = texture2D(u_texture, sampleUV);

  float threshold = (bayerValue(blockPos) + 0.5) / 16.0;
  float levels = max(u_levels, 2.0);
  vec3 col;
  if (u_colorMode > 0.5) {
    float lum = dot(src.rgb, vec3(0.299, 0.587, 0.114));
    float scaled = lum * (levels - 1.0);
    float lo = floor(scaled);
    float bit = step(threshold, scaled - lo);
    col = vec3((lo + bit) / (levels - 1.0));
  } else {
    vec3 scaled = src.rgb * (levels - 1.0);
    vec3 lo = floor(scaled);
    vec3 bit = step(vec3(threshold), scaled - lo);
    col = (lo + bit) / (levels - 1.0);
  }
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), src.a);
      `
    ),
  },
  {
    id: 'bayer-shading',
    name: 'Bayer Matrix Shading',
    category: 'DreamLight',
    description: 'Chunky matrix-pattern tone blocks, like technical illustration shading.',
    thumbnail: 'from-slate-100 via-slate-500 to-slate-900',
    params: [
      { key: 'cellSize', label: 'Cell Size', type: 'float', default: 20, min: 8, max: 48, step: 1 },
      { key: 'contrast', label: 'Contrast', type: 'float', default: 1.1, min: 0, max: 2, step: 0.01 },
      {
        key: 'colorMode',
        label: 'Mode',
        type: 'select',
        default: 0,
        options: [
          { label: 'Mono', value: 0 },
          { label: 'Tinted', value: 1 },
        ],
        advanced: true,
      },
    ],
    fragmentShader: buildFragmentShader(
      `
uniform float u_cellSize;
uniform float u_contrast;
uniform float u_colorMode;

float bayerVal(vec2 p) {
  float x = mod(p.x, 4.0);
  float y = mod(p.y, 4.0);
  float i = x + y * 4.0;
  if (i < 0.5) return 0.0;
  else if (i < 1.5) return 8.0;
  else if (i < 2.5) return 2.0;
  else if (i < 3.5) return 10.0;
  else if (i < 4.5) return 12.0;
  else if (i < 5.5) return 4.0;
  else if (i < 6.5) return 14.0;
  else if (i < 7.5) return 6.0;
  else if (i < 8.5) return 3.0;
  else if (i < 9.5) return 11.0;
  else if (i < 10.5) return 1.0;
  else if (i < 11.5) return 9.0;
  else if (i < 12.5) return 15.0;
  else if (i < 13.5) return 7.0;
  else if (i < 14.5) return 13.0;
  else return 5.0;
}
      `,
      `
  vec2 cell = max(vec2(4.0), vec2(u_cellSize)) * u_pixelScale;
  vec2 cellId = floor(v_uv * u_resolution / cell);
  vec2 localPx = mod(v_uv * u_resolution, cell);
  vec2 sub = floor(localPx / cell * 4.0);
  vec2 sampleUV = clamp((cellId + 0.5) * cell / u_resolution, 0.001, 0.999);
  vec4 src = texture2D(u_texture, sampleUV);

  float lum = dot(src.rgb, vec3(0.299, 0.587, 0.114));
  lum = clamp((lum - 0.5) * u_contrast + 0.5, 0.0, 1.0);
  float threshold = (bayerVal(sub) + 0.5) / 16.0;
  float on = step(lum, threshold);

  vec2 miniLocal = fract(localPx / cell * 4.0) - 0.5;
  float inset = 1.0 - smoothstep(0.36, 0.48, max(abs(miniLocal.x), abs(miniLocal.y)));
  float cov = on * inset;

  vec3 fg = u_colorMode > 0.5 ? src.rgb : vec3(0.06);
  vec3 col = mix(vec3(0.96), fg, cov);
  gl_FragColor = vec4(col, src.a);
      `
    ),
  },
  {
    id: 'bit-depth',
    name: '8-Bit / 16-Bit',
    category: 'DreamLight',
    description: 'Console-era color quantization with chunky pixels.',
    thumbnail: 'from-red-400 via-yellow-300 to-emerald-400',
    params: [
      { key: 'pixelSize', label: 'Pixel Size', type: 'float', default: 8, min: 2, max: 24, step: 1 },
      {
        key: 'bitDepth',
        label: 'Palette',
        type: 'select',
        default: 0,
        options: [
          { label: '8-Bit', value: 0 },
          { label: '16-Bit', value: 1 },
        ],
      },
    ],
    fragmentShader: buildFragmentShader(
      `
uniform float u_pixelSize;
uniform float u_bitDepth;
      `,
      `
  vec2 cell = max(vec2(1.0), vec2(u_pixelSize)) * u_pixelScale;
  vec2 uv = clamp((floor(v_uv * u_resolution / cell) + 0.5) * cell / u_resolution, 0.001, 0.999);
  vec4 src = texture2D(u_texture, uv);
  vec3 levels = u_bitDepth > 0.5 ? vec3(31.0, 63.0, 31.0) : vec3(7.0, 7.0, 3.0);
  vec3 col = floor(src.rgb * levels + 0.5) / levels;
  gl_FragColor = vec4(col, src.a);
      `
    ),
  },
  {
    id: 'voxel',
    name: 'Voxel',
    category: 'DreamLight',
    description: 'Beveled pixel blocks that fake a raised 3D voxel grid.',
    thumbnail: 'from-cyan-300 via-blue-500 to-indigo-800',
    params: [
      { key: 'cellSize', label: 'Voxel Size', type: 'float', default: 18, min: 6, max: 40, step: 1 },
      { key: 'heightScale', label: 'Height', type: 'float', default: 0.6, min: 0, max: 1, step: 0.01 },
      { key: 'gap', label: 'Gap', type: 'float', default: 0.06, min: 0, max: 0.2, step: 0.01, advanced: true },
    ],
    fragmentShader: buildFragmentShader(
      `
uniform float u_cellSize;
uniform float u_heightScale;
uniform float u_gap;
      `,
      `
  vec2 cell = max(vec2(2.0), vec2(u_cellSize)) * u_pixelScale;
  vec2 cellId = floor(v_uv * u_resolution / cell);
  vec2 p = mod(v_uv * u_resolution, cell) / cell - 0.5;
  vec2 sampleUV = clamp((cellId + 0.5) * cell / u_resolution, 0.001, 0.999);
  vec4 src = texture2D(u_texture, sampleUV);

  float lum = dot(src.rgb, vec3(0.299, 0.587, 0.114));
  float height = lum * u_heightScale;
  float shade = dot(normalize(vec2(-1.0, 1.0)), p);
  float bevel = shade * (0.15 + height * 0.35);
  vec3 col = src.rgb + bevel;

  float mask = 1.0 - smoothstep(0.5 - u_gap, 0.5, max(abs(p.x), abs(p.y)));
  col = mix(vec3(0.02), col, mask);
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), src.a);
      `
    ),
  },
  {
    id: 'lego',
    name: 'LEGO Bricks',
    category: 'DreamLight',
    description: 'Studded brick grid with per-brick specular highlight.',
    thumbnail: 'from-red-500 via-yellow-400 to-blue-500',
    params: [
      { key: 'cellSize', label: 'Brick Size', type: 'float', default: 20, min: 6, max: 40, step: 1 },
      { key: 'studSize', label: 'Stud Size', type: 'float', default: 0.28, min: 0.15, max: 0.4, step: 0.01, advanced: true },
    ],
    fragmentShader: buildFragmentShader(
      `
uniform float u_cellSize;
uniform float u_studSize;
      `,
      `
  vec2 cell = max(vec2(4.0), vec2(u_cellSize)) * u_pixelScale;
  vec2 cellId = floor(v_uv * u_resolution / cell);
  vec2 p = mod(v_uv * u_resolution, cell) / cell - 0.5;
  vec2 sampleUV = clamp((cellId + 0.5) * cell / u_resolution, 0.001, 0.999);
  vec4 src = texture2D(u_texture, sampleUV);

  float studR = u_studSize;
  float d = length(p);
  float studMask = 1.0 - smoothstep(studR - 0.02, studR, d);
  vec2 lightDir = normalize(vec2(-0.4, 0.4));
  float spec = pow(clamp(1.0 - length(p - lightDir * studR * 0.5) / studR, 0.0, 1.0), 3.0);

  vec3 base = src.rgb * 0.85;
  vec3 studCol = src.rgb + spec * 0.5;
  vec3 col = mix(base, studCol, studMask);

  float gap = 0.045;
  float edgeMask = 1.0 - smoothstep(0.5 - gap, 0.5, max(abs(p.x), abs(p.y)));
  col = mix(vec3(0.03), col, edgeMask);
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), src.a);
      `
    ),
  },
  {
    id: 'mosaic',
    name: 'Mosaic',
    category: 'DreamLight',
    description: 'Tiled ceramic-style mosaic with grout lines and bevels.',
    thumbnail: 'from-teal-300 via-cyan-500 to-blue-700',
    params: [
      { key: 'cellSize', label: 'Tile Size', type: 'float', default: 14, min: 4, max: 40, step: 1 },
      { key: 'groutWidth', label: 'Grout Width', type: 'float', default: 0.06, min: 0, max: 0.2, step: 0.01 },
      { key: 'variance', label: 'Tile Variance', type: 'float', default: 0.08, min: 0, max: 0.3, step: 0.01, advanced: true },
    ],
    fragmentShader: buildFragmentShader(
      `
uniform float u_cellSize;
uniform float u_groutWidth;
uniform float u_variance;
      `,
      `
  vec2 cell = max(vec2(2.0), vec2(u_cellSize)) * u_pixelScale;
  vec2 cellId = floor(v_uv * u_resolution / cell);
  vec2 p = mod(v_uv * u_resolution, cell) / cell - 0.5;
  vec2 sampleUV = clamp((cellId + 0.5) * cell / u_resolution, 0.001, 0.999);
  vec4 src = texture2D(u_texture, sampleUV);

  float variance = (hash12(cellId) - 0.5) * u_variance;
  vec3 tileCol = clamp(src.rgb + variance, 0.0, 1.0);

  float edgeMask = 1.0 - smoothstep(0.5 - u_groutWidth, 0.5, max(abs(p.x), abs(p.y)));
  vec3 col = mix(vec3(0.08, 0.08, 0.09), tileCol, edgeMask);
  float bevel = dot(normalize(vec2(-1.0, 1.0)), p) * 0.08;
  col += bevel * edgeMask;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), src.a);
      `
    ),
  },
  {
    id: 'block-shade',
    name: 'Block Shade',
    category: 'DreamLight',
    description: 'Unicode block-style tonal bars filled by luminance.',
    thumbnail: 'from-neutral-900 via-neutral-500 to-neutral-100',
    params: [
      { key: 'cellSize', label: 'Cell Size', type: 'float', default: 10, min: 4, max: 30, step: 1 },
      { key: 'levels', label: 'Levels', type: 'float', default: 5, min: 2, max: 8, step: 1 },
      { key: 'contrast', label: 'Contrast', type: 'float', default: 1, min: 0, max: 2, step: 0.01 },
      {
        key: 'colorMode',
        label: 'Mode',
        type: 'select',
        default: 0,
        options: [
          { label: 'Mono', value: 0 },
          { label: 'Color', value: 1 },
        ],
        advanced: true,
      },
    ],
    fragmentShader: buildFragmentShader(
      `
uniform float u_cellSize;
uniform float u_levels;
uniform float u_contrast;
uniform float u_colorMode;
      `,
      `
  vec2 cell = max(vec2(2.0), vec2(u_cellSize)) * u_pixelScale;
  vec2 cellId = floor(v_uv * u_resolution / cell);
  vec2 p = mod(v_uv * u_resolution, cell) / cell;
  vec2 sampleUV = clamp((cellId + 0.5) * cell / u_resolution, 0.001, 0.999);
  vec4 src = texture2D(u_texture, sampleUV);

  float lum = dot(src.rgb, vec3(0.299, 0.587, 0.114));
  lum = clamp((lum - 0.5) * u_contrast + 0.5, 0.0, 1.0);
  float levels = max(u_levels, 2.0);
  float q = floor(lum * levels + 0.5) / levels;

  float gap = 0.04;
  float insideX = step(gap, p.x) * step(p.x, 1.0 - gap);
  float filled = step(1.0 - q, p.y);
  float cov = insideX * filled;

  vec3 fg = u_colorMode > 0.5 ? src.rgb : vec3(0.92);
  vec3 col = mix(vec3(0.04), fg, cov);
  gl_FragColor = vec4(col, src.a);
      `
    ),
  },
  {
    id: 'braille-art',
    name: 'Braille Art',
    category: 'ASCII',
    description: 'Eight-dot braille cells for high apparent resolution.',
    thumbnail: 'from-neutral-950 via-neutral-600 to-neutral-200',
    params: [
      { key: 'cellSize', label: 'Cell Size', type: 'float', default: 10, min: 4, max: 24, step: 1 },
      { key: 'contrast', label: 'Contrast', type: 'float', default: 1.1, min: 0, max: 2, step: 0.01 },
      {
        key: 'colorMode',
        label: 'Mode',
        type: 'select',
        default: 0,
        options: [
          { label: 'Mono', value: 0 },
          { label: 'Color', value: 1 },
        ],
        advanced: true,
      },
    ],
    fragmentShader: buildFragmentShader(
      `
uniform float u_cellSize;
uniform float u_contrast;
uniform float u_colorMode;

float brailleBayer(vec2 p) {
  float x = mod(p.x, 4.0);
  float y = mod(p.y, 4.0);
  float i = x + y * 4.0;
  if (i < 0.5) return 0.0;
  else if (i < 1.5) return 8.0;
  else if (i < 2.5) return 2.0;
  else if (i < 3.5) return 10.0;
  else if (i < 4.5) return 12.0;
  else if (i < 5.5) return 4.0;
  else if (i < 6.5) return 14.0;
  else if (i < 7.5) return 6.0;
  else if (i < 8.5) return 3.0;
  else if (i < 9.5) return 11.0;
  else if (i < 10.5) return 1.0;
  else if (i < 11.5) return 9.0;
  else if (i < 12.5) return 15.0;
  else if (i < 13.5) return 7.0;
  else if (i < 14.5) return 13.0;
  else return 5.0;
}
      `,
      `
  vec2 cellPx = vec2(max(u_cellSize, 4.0), max(u_cellSize, 4.0) * 2.0) * u_pixelScale;
  vec2 cellId = floor(v_uv * u_resolution / cellPx);
  vec2 localPx = mod(v_uv * u_resolution, cellPx);
  vec2 dotCoord = floor(localPx / cellPx * vec2(2.0, 4.0));
  vec2 sampleUV = clamp((cellId + 0.5) * cellPx / u_resolution, 0.001, 0.999);
  vec2 tapOff = cellPx * 0.3 / u_resolution;
  vec4 src = texture2D(u_texture, sampleUV);
  src += texture2D(u_texture, clamp(sampleUV + vec2(tapOff.x, 0.0), 0.001, 0.999));
  src += texture2D(u_texture, clamp(sampleUV - vec2(tapOff.x, 0.0), 0.001, 0.999));
  src += texture2D(u_texture, clamp(sampleUV + vec2(0.0, tapOff.y), 0.001, 0.999));
  src += texture2D(u_texture, clamp(sampleUV - vec2(0.0, tapOff.y), 0.001, 0.999));
  src *= 0.2;

  float lum = dot(src.rgb, vec3(0.299, 0.587, 0.114));
  lum = clamp((lum - 0.5) * u_contrast + 0.5, 0.0, 1.0);
  float threshold = (brailleBayer(dotCoord + mod(cellId, 4.0)) + 0.5) / 16.0;
  float on = step(threshold, lum);

  vec2 dotLocal = fract(localPx / cellPx * vec2(2.0, 4.0)) - 0.5;
  float d = length(dotLocal);
  float dotMask = 1.0 - smoothstep(0.28, 0.36, d);
  float cov = on * dotMask;

  vec3 fg = u_colorMode > 0.5 ? src.rgb : vec3(0.9);
  vec3 col = mix(vec3(0.04), fg, cov);
  gl_FragColor = vec4(col, src.a);
      `
    ),
  },
  {
    id: 'kaomoji-art',
    name: 'Kaomoji Art',
    category: 'ASCII',
    description: 'Whimsical round face glyphs in a pastel dreamy mosaic.',
    thumbnail: 'from-pink-200 via-purple-300 to-indigo-400',
    params: [
      { key: 'cellSize', label: 'Cell Size', type: 'float', default: 20, min: 10, max: 40, step: 1 },
      { key: 'density', label: 'Density', type: 'float', default: 0.6, min: 0, max: 1, step: 0.01 },
      { key: 'colorful', label: 'Colorful', type: 'float', default: 0.7, min: 0, max: 1, step: 0.01 },
      { key: 'hueSpeed', label: 'Hue Drift', type: 'float', default: 0.2, min: 0, max: 2, step: 0.01, advanced: true },
    ],
    fragmentShader: buildFragmentShader(
      `
uniform float u_cellSize;
uniform float u_density;
uniform float u_colorful;
uniform float u_hueSpeed;
      `,
      `
  vec2 cell = max(vec2(6.0), vec2(u_cellSize)) * u_pixelScale;
  vec2 cellId = floor(v_uv * u_resolution / cell);
  vec2 p = mod(v_uv * u_resolution, cell) / cell - 0.5;
  vec2 sampleUV = clamp((cellId + 0.5) * cell / u_resolution, 0.001, 0.999);
  vec2 tapOff = cell * 0.3 / u_resolution;
  vec4 src = texture2D(u_texture, sampleUV);
  src += texture2D(u_texture, clamp(sampleUV + vec2(tapOff.x, 0.0), 0.001, 0.999));
  src += texture2D(u_texture, clamp(sampleUV - vec2(tapOff.x, 0.0), 0.001, 0.999));
  src += texture2D(u_texture, clamp(sampleUV + vec2(0.0, tapOff.y), 0.001, 0.999));
  src += texture2D(u_texture, clamp(sampleUV - vec2(0.0, tapOff.y), 0.001, 0.999));
  src *= 0.2;
  float lum = dot(src.rgb, vec3(0.299, 0.587, 0.114));

  float faceR = 0.34;
  float distC = length(p);
  float ring = smoothstep(faceR - 0.05, faceR, distC) - smoothstep(faceR, faceR + 0.05, distC);
  vec2 eyeL = vec2(-0.13, 0.08);
  vec2 eyeR = vec2(0.13, 0.08);
  float eyes = (1.0 - smoothstep(0.04, 0.07, length(p - eyeL))) + (1.0 - smoothstep(0.04, 0.07, length(p - eyeR)));
  float mouth = (1.0 - smoothstep(0.03, 0.06, abs(length(p - vec2(0.0, -0.25)) - 0.12))) * step(p.y, -0.12);
  float glyph = clamp(ring + eyes * 0.8 + mouth * 0.6, 0.0, 1.0);

  float show = step(1.0 - lum, u_density);
  float cov = glyph * show;

  float hue = fract(0.75 + sin(cellId.x * 0.2 + cellId.y * 0.13 + u_time * u_hueSpeed) * 0.2);
  vec3 magic = hsv2rgb(vec3(hue, 0.6, 1.0));
  vec3 fg = mix(vec3(0.15), magic, u_colorful);
  vec3 col = mix(vec3(0.98, 0.96, 0.99), fg, cov);
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), src.a);
      `
    ),
  },
  {
    id: 'disco',
    name: 'Disco',
    category: 'DreamLight',
    description: 'Faceted mirror-ball tiles with drifting rainbow sparkle.',
    thumbnail: 'from-fuchsia-400 via-cyan-300 to-yellow-300',
    params: [
      { key: 'cellSize', label: 'Facet Size', type: 'float', default: 16, min: 6, max: 40, step: 1 },
      { key: 'intensity', label: 'Color Intensity', type: 'float', default: 0.7, min: 0, max: 1, step: 0.01 },
      { key: 'sparkle', label: 'Sparkle', type: 'float', default: 0.5, min: 0, max: 1, step: 0.01 },
      { key: 'speed', label: 'Spin Speed', type: 'float', default: 0.6, min: 0, max: 2, step: 0.01, advanced: true },
    ],
    fragmentShader: buildFragmentShader(
      `
uniform float u_cellSize;
uniform float u_intensity;
uniform float u_sparkle;
uniform float u_speed;
      `,
      `
  vec2 cell = max(vec2(6.0), vec2(u_cellSize)) * u_pixelScale;
  vec2 p = v_uv * u_resolution;
  vec2 facetP = vec2((p.x + p.y) * 0.5, (p.x - p.y) * 0.5) / cell;
  vec2 facetId = floor(facetP);
  vec2 facetLocal = fract(facetP) - 0.5;

  vec2 cellId = floor(p / cell);
  vec2 sampleUV = clamp((cellId + 0.5) * cell / u_resolution, 0.001, 0.999);
  vec4 src = texture2D(u_texture, sampleUV);
  float lum = dot(src.rgb, vec3(0.299, 0.587, 0.114));

  float hue = fract(hash12(facetId) * 3.0 + u_time * u_speed * 0.15);
  vec3 discoCol = hsv2rgb(vec3(hue, 0.85, 1.0));
  float facetShade = 1.0 - length(facetLocal) * 1.4;
  vec3 col = mix(src.rgb * 0.3, discoCol, u_intensity) * clamp(facetShade + lum * 0.5, 0.0, 1.5);

  float tw = hash12(facetId + floor(u_time * 3.0));
  float sparkle = step(0.97 - u_sparkle * 0.25, tw) * (0.6 + 0.4 * sin(u_time * 14.0 + tw * 40.0));
  col += vec3(1.0) * sparkle * u_sparkle;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), src.a);
      `
    ),
  },
  {
    id: 'light-rays',
    name: 'Light Rays',
    category: 'Light',
    description: 'Volumetric god-rays radiating from a bright source point.',
    thumbnail: 'from-amber-200 via-yellow-400 to-orange-600',
    params: [
      { key: 'threshold', label: 'Threshold', type: 'float', default: 0.5, min: 0, max: 1, step: 0.01 },
      { key: 'intensity', label: 'Intensity', type: 'float', default: 1, min: 0, max: 3, step: 0.01 },
      { key: 'decay', label: 'Decay', type: 'float', default: 0.96, min: 0.8, max: 0.99, step: 0.005, advanced: true },
      { key: 'sourceX', label: 'Source X', type: 'float', default: 0.5, min: 0, max: 1, step: 0.01, advanced: true },
      { key: 'sourceY', label: 'Source Y', type: 'float', default: 0.15, min: 0, max: 1, step: 0.01, advanced: true },
    ],
    fragmentShader: buildFragmentShader(
      `
uniform float u_threshold;
uniform float u_intensity;
uniform float u_decay;
uniform float u_sourceX;
uniform float u_sourceY;
      `,
      `
  vec4 orig = texture2D(u_texture, v_uv);
  vec2 lightPos = vec2(u_sourceX, u_sourceY);
  vec2 delta = (v_uv - lightPos) / 24.0;
  vec2 uv = v_uv;
  float illum = 1.0;
  vec3 accum = vec3(0.0);
  for (int i = 0; i < 24; i++) {
    uv -= delta;
    vec3 samp = texture2D(u_texture, uv).rgb;
    float lum = dot(samp, vec3(0.299, 0.587, 0.114));
    float bright = max(lum - u_threshold, 0.0);
    accum += samp * bright * illum;
    illum *= u_decay;
  }
  accum /= 24.0;
  vec3 col = orig.rgb + accum * u_intensity * 4.0;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), orig.a);
      `
    ),
  },
  {
    id: 'light-leak',
    name: 'Light Leak',
    category: 'Light',
    description: 'Warm analog light streaks bleeding in across the frame.',
    thumbnail: 'from-red-400 via-orange-400 to-yellow-200',
    params: [
      { key: 'intensity', label: 'Intensity', type: 'float', default: 0.5, min: 0, max: 1, step: 0.01 },
      { key: 'angle', label: 'Angle', type: 'float', default: 45, min: 0, max: 360, step: 1, unit: '°' },
      { key: 'spread', label: 'Spread', type: 'float', default: 0.5, min: 0.15, max: 1, step: 0.01, advanced: true },
      { key: 'hue', label: 'Hue', type: 'float', default: 30, min: 0, max: 360, step: 1, advanced: true },
      { key: 'speed', label: 'Drift Speed', type: 'float', default: 0.3, min: 0, max: 2, step: 0.01, advanced: true },
    ],
    fragmentShader: buildFragmentShader(
      `
uniform float u_intensity;
uniform float u_angle;
uniform float u_spread;
uniform float u_hue;
uniform float u_speed;

// Kept self-contained (no shared helpers) because this block is emitted before the shared
// HELPERS block that defines hsv2rgb -- see hue-to-color conversion in main() below instead.
float leakGlow(vec2 uv, vec2 center, float radius) {
  float d = length(uv - center) / max(radius, 0.05);
  return exp(-d * d * 2.2);
}
      `,
      `
  vec4 src = texture2D(u_texture, v_uv);
  vec2 dir = vec2(cos(radians(u_angle)), sin(radians(u_angle)));
  float drift = u_time * u_speed * 0.06;

  vec3 leak = vec3(0.0);
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float along = fract(0.15 + fi * 0.4 + drift) * 1.8 - 0.4;
    vec2 center = vec2(0.5) + dir * along;
    float hue = fract(u_hue / 360.0 + fi * 0.07);
    float glow = leakGlow(v_uv, center, u_spread) * (1.0 - fi * 0.22);
    leak += hsv2rgb(vec3(hue, 0.8, 1.0)) * glow;
  }

  vec3 col = 1.0 - (1.0 - src.rgb) * (1.0 - clamp(leak * u_intensity, 0.0, 1.0));
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), src.a);
      `
    ),
  },
  {
    id: 'digital-rain',
    name: 'Digital Rain',
    category: 'ASCII',
    description: 'Matrix-style falling character streams over the image.',
    thumbnail: 'from-black via-green-500 to-emerald-300',
    usesCharsetAtlas: true,
    params: [
      { key: 'cellSize', label: 'Font Size', type: 'float', default: 14, min: 6, max: 32, step: 1 },
      { key: 'characterSet', label: 'Character Set', type: 'select', default: 0, options: CHARACTER_SET_OPTIONS },
      { key: 'customChars', label: 'Custom Characters', type: 'text', default: 0, defaultText: BUILTIN_CHARSETS.ASCII, visibleWhen: { key: 'characterSet', equals: 13 } },
      { key: 'speed', label: 'Fall Speed', type: 'float', default: 1, min: 0, max: 4, step: 0.05 },
      { key: 'density', label: 'Background', type: 'float', default: 0.35, min: 0, max: 1, step: 0.01, advanced: true },
      { key: 'glow', label: 'Head Glow', type: 'float', default: 0.7, min: 0, max: 1, step: 0.01, advanced: true },
    ],
    fragmentShader: buildFragmentShader(
      `
uniform float u_cellSize;
uniform float u_speed;
uniform float u_density;
uniform float u_glow;
uniform sampler2D u_charsetAtlas;
uniform float u_charsetCount;
      `,
      `
  vec2 cell = max(vec2(1.0), vec2(u_cellSize)) * u_pixelScale;
  vec2 cellId = floor(v_uv * u_resolution / cell);
  vec2 cellUV = mod(v_uv * u_resolution, cell) / cell - 0.5;
  vec2 sampleUV = (cellId + 0.5) * cell / u_resolution;
  vec2 tapOff = cell * 0.3 / u_resolution;
  vec4 src = texture2D(u_texture, sampleUV);
  src += texture2D(u_texture, sampleUV + vec2(tapOff.x, 0.0));
  src += texture2D(u_texture, sampleUV - vec2(tapOff.x, 0.0));
  src += texture2D(u_texture, sampleUV + vec2(0.0, tapOff.y));
  src += texture2D(u_texture, sampleUV - vec2(0.0, tapOff.y));
  src *= 0.2;
  float lum = dot(src.rgb, vec3(0.299, 0.587, 0.114));

  float totalRows = max(1.0, floor(u_resolution.y / cell.y));
  float colSeed = hash11(cellId.x * 13.17 + 4.7);
  float colSpeed = (0.5 + colSeed * 1.3) * u_speed;
  float phase = fract(cellId.y / totalRows - u_time * colSpeed * 0.25 + colSeed * 9.0);
  float trail = pow(1.0 - phase, 5.0);
  float isHead = smoothstep(0.05, 0.0, phase);

  // Bias glyph choice toward the image's own luminance (denser glyphs on bright regions) so the
  // photo reads through the rain, mixed with noise so the "typing" flicker still feels alive.
  float glyphChangeRate = 2.0 + colSpeed * 3.0;
  float glyphNoise = hash12(cellId + floor(u_time * glyphChangeRate));
  float levelF = clamp(floor(mix(glyphNoise, lum, 0.65) * u_charsetCount), 0.0, max(u_charsetCount - 1.0, 0.0));
  vec2 atlasUV = vec2((levelF + cellUV.x + 0.5) / u_charsetCount, cellUV.y + 0.5);
  float cov = 0.0;
  if (abs(cellUV.x) < 0.5 && abs(cellUV.y) < 0.5) {
    cov = texture2D(u_charsetAtlas, atlasUV).a;
  }

  vec3 dimGreen = vec3(0.02, 0.16, 0.06) * (0.4 + lum * 0.6);
  vec3 trailGreen = mix(vec3(0.05, 0.4, 0.15), vec3(0.5, 1.0, 0.6), trail);
  vec3 glyphColor = mix(dimGreen, trailGreen, trail);
  glyphColor = mix(glyphColor, vec3(0.85, 1.0, 0.92), isHead * u_glow);

  vec3 background = mix(vec3(0.0), src.rgb * 0.18, u_density);
  vec3 col = mix(background, glyphColor, cov);
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), src.a);
      `
    ),
  },
  {
    id: 'halftone-print',
    name: 'Halftone Print',
    category: 'Texture',
    description: 'Bold graphic dot screen that grows along the image\'s own contours, like litho print.',
    thumbnail: 'from-white via-neutral-500 to-black',
    params: [
      { key: 'dotSize', label: 'Dot Size', type: 'float', default: 10, min: 3, max: 40, step: 0.5 },
      { key: 'contrast', label: 'Contrast', type: 'float', default: 1.2, min: 0, max: 2, step: 0.01 },
      { key: 'angle', label: 'Angle', type: 'float', default: 15, min: 0, max: 90, step: 1, advanced: true },
      { key: 'sharpness', label: 'Contour Boost', type: 'float', default: 0.4, min: 0, max: 1, step: 0.01, advanced: true },
      { key: 'invert', label: 'Invert', type: 'bool', default: 0, advanced: true },
    ],
    fragmentShader: buildFragmentShader(
      `
uniform float u_dotSize;
uniform float u_contrast;
uniform float u_angle;
uniform float u_sharpness;
uniform float u_invert;
      `,
      `
  vec4 c = texture2D(u_texture, v_uv);
  float lum = dot(c.rgb, vec3(0.299, 0.587, 0.114));

  vec2 texel = 1.0 / u_resolution;
  float lumR = dot(texture2D(u_texture, v_uv + vec2(texel.x, 0.0)).rgb, vec3(0.299, 0.587, 0.114));
  float lumD = dot(texture2D(u_texture, v_uv + vec2(0.0, texel.y)).rgb, vec3(0.299, 0.587, 0.114));
  float edge = abs(lum - lumR) + abs(lum - lumD);
  lum = clamp(lum - edge * u_sharpness * 1.5, 0.0, 1.0);
  lum = clamp((lum - 0.5) * u_contrast + 0.5, 0.0, 1.0);
  if (u_invert > 0.5) lum = 1.0 - lum;

  float size = max(u_dotSize, 2.0) * u_pixelScale;
  vec2 base = (v_uv - 0.5) * u_resolution;
  vec2 p = rotate2D(base, radians(u_angle));
  float d = length(mod(p, size) - size * 0.5);
  float radius = (1.0 - lum) * size * 0.62;
  float m = 1.0 - smoothstep(radius - 1.0, radius, d);

  gl_FragColor = vec4(vec3(1.0 - m), c.a);
      `
    ),
  },
  {
    id: 'mesh-screen',
    name: 'Mesh Screen',
    category: 'Texture',
    description: 'Fine woven line-screen texture over the full-color photo, like silk-screen fabric.',
    thumbnail: 'from-pink-100 via-rose-300 to-purple-300',
    params: [
      { key: 'cellSize', label: 'Mesh Size', type: 'float', default: 6, min: 2, max: 20, step: 0.5 },
      { key: 'opacity', label: 'Screen Strength', type: 'float', default: 0.6, min: 0, max: 1, step: 0.01 },
      { key: 'contrast', label: 'Contrast', type: 'float', default: 1.1, min: 0, max: 2, step: 0.01, advanced: true },
    ],
    fragmentShader: buildFragmentShader(
      `
uniform float u_cellSize;
uniform float u_opacity;
uniform float u_contrast;
      `,
      `
  vec4 c = texture2D(u_texture, v_uv);
  float lum = dot(c.rgb, vec3(0.299, 0.587, 0.114));
  lum = clamp((lum - 0.5) * u_contrast + 0.5, 0.0, 1.0);

  float size = max(u_cellSize, 2.0) * u_pixelScale;
  vec2 p = v_uv * u_resolution;
  float wx = sin(p.x / size * 6.28318530718) * 0.5 + 0.5;
  float wy = sin(p.y / size * 6.28318530718) * 0.5 + 0.5;
  float weave = wx * wy;
  float meshDarken = (1.0 - weave) * (1.0 - lum);

  vec3 col = c.rgb * (1.0 - meshDarken * u_opacity);
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), c.a);
      `
    ),
  },
  {
    id: 'radial-halftone',
    name: 'Radial Halftone',
    category: 'Texture',
    description: 'Concentric-ring line screen radiating from a point, like a vinyl-groove print.',
    thumbnail: 'from-white via-red-400 to-red-700',
    params: [
      { key: 'spacing', label: 'Ring Spacing', type: 'float', default: 10, min: 3, max: 40, step: 0.5 },
      { key: 'contrast', label: 'Contrast', type: 'float', default: 1.1, min: 0, max: 2, step: 0.01 },
      { key: 'centerX', label: 'Center X', type: 'float', default: 0.5, min: 0, max: 1, step: 0.01, advanced: true },
      { key: 'centerY', label: 'Center Y', type: 'float', default: 0.4, min: 0, max: 1, step: 0.01, advanced: true },
      { key: 'softness', label: 'Softness', type: 'float', default: 0.06, min: 0.01, max: 0.3, step: 0.01, advanced: true },
    ],
    fragmentShader: buildFragmentShader(
      `
uniform float u_spacing;
uniform float u_contrast;
uniform float u_centerX;
uniform float u_centerY;
uniform float u_softness;
      `,
      `
  vec4 c = texture2D(u_texture, v_uv);
  float lum = dot(c.rgb, vec3(0.299, 0.587, 0.114));
  lum = clamp((lum - 0.5) * u_contrast + 0.5, 0.0, 1.0);

  vec2 center = vec2(u_centerX, u_centerY) * u_resolution;
  float dist = length(v_uv * u_resolution - center);
  float spacing = max(u_spacing, 2.0) * u_pixelScale;
  float ringPhase = mod(dist, spacing) / spacing;
  float d = abs(ringPhase - 0.5) * 2.0;
  float thickness = clamp(1.0 - lum, 0.02, 0.98);
  float soft = max(u_softness, 0.001);
  float m = 1.0 - smoothstep(thickness - soft, thickness + soft, d);

  gl_FragColor = vec4(vec3(1.0 - m), c.a);
      `
    ),
  },
  {
    id: 'melt',
    name: 'Melt',
    category: 'Distortion',
    description: 'Vertical columns stretch into dripping spikes below a jagged break line.',
    thumbnail: 'from-amber-200 via-rose-400 to-rose-900',
    params: [
      { key: 'amount', label: 'Drip Length', type: 'float', default: 0.5, min: 0, max: 1, step: 0.01 },
      { key: 'spikiness', label: 'Jaggedness', type: 'float', default: 0.6, min: 0, max: 1, step: 0.01 },
      { key: 'spikeWidth', label: 'Spike Width', type: 'float', default: 6, min: 1, max: 30, step: 1, advanced: true },
      { key: 'seed', label: 'Seed', type: 'float', default: 0, min: 0, max: 100, step: 1, advanced: true },
    ],
    fragmentShader: buildFragmentShader(
      `
uniform float u_amount;
uniform float u_spikiness;
uniform float u_spikeWidth;
uniform float u_seed;
      `,
      `
  float bandSize = max(u_spikeWidth, 1.0) * u_pixelScale;
  float band = floor(v_uv.x * u_resolution.x / bandSize);
  // Most bands stay untouched (gated off) so the drip reads as sparse, isolated spikes rather than
  // a uniform curtain -- only bands that pass the gate get a (randomly sized) drip at all.
  float gateRoll = hash11(band * 12.9898 + u_seed * 7.31 + 4.7);
  float gateThreshold = mix(0.96, 0.45, u_amount);
  float gated = step(gateThreshold, gateRoll);
  float lenRoll = hash11(band * 5.171 + u_seed * 2.63 + 9.4);
  float meltLen = gated * pow(lenRoll, 1.0 + u_spikiness * 4.0) * mix(0.2, 0.95, u_amount);
  float breakPoint = 1.0 - meltLen;

  vec2 uv = v_uv;
  if (uv.y > breakPoint) {
    float t = uv.y - breakPoint;
    uv.y = clamp(breakPoint - t * 0.04, 0.0, breakPoint);
  }
  gl_FragColor = texture2D(u_texture, uv);
      `
    ),
  },
  {
    id: 'duotone-halftone',
    name: 'Duotone Halftone',
    category: 'Texture',
    description: 'Bold two-color halftone dot screen, like a risograph or duotone poster print.',
    thumbnail: 'from-rose-600 via-rose-800 to-slate-900',
    params: [
      { key: 'dotSize', label: 'Dot Size', type: 'float', default: 8, min: 2, max: 30, step: 0.5 },
      { key: 'colorA', label: 'Shadow Color', type: 'color', default: 14690650, group: 'Color' },
      { key: 'colorB', label: 'Highlight Color', type: 'color', default: 1316902, group: 'Color' },
      { key: 'contrast', label: 'Contrast', type: 'float', default: 1.1, min: 0, max: 2, step: 0.01, advanced: true },
      { key: 'angle', label: 'Angle', type: 'float', default: 15, min: 0, max: 90, step: 1, advanced: true },
    ],
    fragmentShader: buildFragmentShader(
      `
uniform float u_dotSize;
uniform float u_colorA;
uniform float u_colorB;
uniform float u_contrast;
uniform float u_angle;
      `,
      `
  vec4 c = texture2D(u_texture, v_uv);
  float lum = dot(c.rgb, vec3(0.299, 0.587, 0.114));
  lum = clamp((lum - 0.5) * u_contrast + 0.5, 0.0, 1.0);

  float size = max(u_dotSize, 2.0) * u_pixelScale;
  vec2 base = (v_uv - 0.5) * u_resolution;
  vec2 p = rotate2D(base, radians(u_angle));
  float d = length(mod(p, size) - size * 0.5);
  float radius = (1.0 - lum) * size * 0.62;
  float m = 1.0 - smoothstep(radius - 1.0, radius, d);

  vec3 colA = unpackColor(u_colorA);
  vec3 colB = unpackColor(u_colorB);
  vec3 col = mix(colB, colA, m);
  gl_FragColor = vec4(col, c.a);
      `
    ),
  },
  {
    id: 'ink-stipple',
    name: 'Ink Stipple',
    category: 'DreamLight',
    description: 'Fine engraving-style stipple: many uniform dots, density carrying the tone.',
    thumbnail: 'from-neutral-50 via-neutral-300 to-neutral-950',
    params: [
      { key: 'fineness', label: 'Dot Pitch', type: 'float', default: 4, min: 2, max: 12, step: 0.5 },
      { key: 'density', label: 'Density', type: 'float', default: 1.4, min: 0.5, max: 3, step: 0.05 },
      { key: 'dotSize', label: 'Dot Size', type: 'float', default: 0.5, min: 0.2, max: 0.9, step: 0.01, advanced: true },
      { key: 'contrast', label: 'Contrast', type: 'float', default: 1.2, min: 0, max: 2, step: 0.01, advanced: true },
    ],
    fragmentShader: buildFragmentShader(
      `
uniform float u_fineness;
uniform float u_density;
uniform float u_dotSize;
uniform float u_contrast;
      `,
      `
  vec2 pitch = vec2(max(u_fineness, 2.0)) * u_pixelScale;
  vec2 cellId = floor(v_uv * u_resolution / pitch);
  vec2 jitter = vec2(hash12(cellId), hash12(cellId + 31.7)) - 0.5;
  vec2 dotCenterUV = (cellId + 0.5 + jitter * 0.7) * pitch / u_resolution;
  vec4 src = texture2D(u_texture, clamp(dotCenterUV, 0.001, 0.999));
  float lum = dot(src.rgb, vec3(0.299, 0.587, 0.114));
  lum = clamp((lum - 0.5) * u_contrast + 0.5, 0.0, 1.0);
  float darkness = 1.0 - lum;

  float threshold = hash12(cellId + 91.3);
  float show = step(threshold, darkness * u_density);

  vec2 cellUV = mod(v_uv * u_resolution, pitch) / pitch - 0.5;
  vec2 localOffset = cellUV - jitter * 0.7;
  float d = length(localOffset);
  float radius = max(u_dotSize, 0.05) * 0.5;
  float cov = (1.0 - smoothstep(radius - 0.06, radius, d)) * show;

  vec3 col = mix(vec3(0.98), vec3(0.05), cov);
  gl_FragColor = vec4(col, src.a);
      `
    ),
  },
  {
    id: 'vhs-static',
    name: 'VHS Static',
    category: 'Retro',
    description: 'Crushed-contrast analog broadcast noise with jittery scanlines and tracking glitches.',
    thumbnail: 'from-white via-neutral-600 to-black',
    params: [
      { key: 'noiseAmount', label: 'Static', type: 'float', default: 0.5, min: 0, max: 1, step: 0.01 },
      { key: 'contrast', label: 'Contrast', type: 'float', default: 1.6, min: 0.5, max: 3, step: 0.01 },
      { key: 'scanlineJitter', label: 'Line Jitter', type: 'float', default: 0.3, min: 0, max: 1, step: 0.01, advanced: true },
      { key: 'lineCount', label: 'Line Count', type: 'float', default: 400, min: 100, max: 800, step: 10, advanced: true },
      { key: 'speed', label: 'Speed', type: 'float', default: 1, min: 0, max: 5, step: 0.05, advanced: true },
    ],
    fragmentShader: buildFragmentShader(
      `
uniform float u_noiseAmount;
uniform float u_contrast;
uniform float u_scanlineJitter;
uniform float u_lineCount;
uniform float u_speed;
      `,
      `
  float t = u_time * u_speed;
  float row = floor(v_uv.y * u_lineCount);
  float rowNoise = hash11(row * 3.17 + floor(t * 8.0));
  float xJitter = (rowNoise - 0.5) * u_scanlineJitter * 0.02;
  vec2 uv = vec2(v_uv.x + xJitter, v_uv.y);

  vec4 c = texture2D(u_texture, clamp(uv, 0.0, 1.0));
  float lum = dot(c.rgb, vec3(0.299, 0.587, 0.114));
  lum = clamp((lum - 0.5) * u_contrast + 0.5, 0.0, 1.0);

  vec2 noiseUV = v_uv * u_resolution + t * 137.0;
  float grain = hash12(floor(noiseUV));
  lum = clamp(lum + (grain - 0.5) * u_noiseAmount, 0.0, 1.0);

  float trackLine = step(0.995, hash11(floor(t * 6.0) + 5.2));
  float trackY = hash11(floor(t * 6.0) + 9.1);
  float nearTrack = 1.0 - smoothstep(0.0, 0.02, abs(v_uv.y - trackY));
  lum = mix(lum, 1.0, trackLine * nearTrack * 0.8);

  vec3 col = vec3(lum);
  gl_FragColor = vec4(col, c.a);
      `
    ),
  },
  {
    id: 'fluted-glass',
    name: 'Fluted Glass',
    category: 'Glass',
    description: 'Reeded glass ribs that bend the image like a lens, column by column.',
    thumbnail: 'from-sky-100 via-cyan-200 to-slate-300',
    params: [
      { key: 'ribWidth', label: 'Rib Width', type: 'float', default: 24, min: 6, max: 80, step: 1 },
      { key: 'amount', label: 'Distortion', type: 'float', default: 0.6, min: 0, max: 1, step: 0.01 },
      { key: 'angle', label: 'Angle', type: 'float', default: 0, min: 0, max: 180, step: 1, advanced: true },
    ],
    fragmentShader: buildFragmentShader(
      `
uniform float u_ribWidth;
uniform float u_amount;
uniform float u_angle;
      `,
      `
  vec2 dir = vec2(cos(radians(u_angle)), sin(radians(u_angle)));
  float ribSize = max(u_ribWidth, 2.0) * u_pixelScale;
  float along = dot(v_uv * u_resolution, dir);
  float ribPos = fract(along / ribSize) - 0.5;
  float lens = ribPos * (1.0 - abs(ribPos) * 1.3);
  vec2 uv = v_uv + dir * lens * u_amount * 0.05;
  gl_FragColor = texture2D(u_texture, clamp(uv, 0.0, 1.0));
      `
    ),
  },
  {
    id: 'frosted-glass',
    name: 'Frosted Glass',
    category: 'Glass',
    description: 'Soft blur behind a milky, translucent haze, like satin glass.',
    thumbnail: 'from-white via-slate-200 to-slate-400',
    params: [
      { key: 'blurAmount', label: 'Frost Amount', type: 'float', default: 8, min: 1, max: 30, step: 0.5 },
      { key: 'haze', label: 'Haze', type: 'float', default: 0.5, min: 0, max: 1, step: 0.01 },
      { key: 'grain', label: 'Grain', type: 'float', default: 0.15, min: 0, max: 1, step: 0.01, advanced: true },
    ],
    fragmentShader: buildFragmentShader(
      `
uniform float u_blurAmount;
uniform float u_haze;
uniform float u_grain;
      `,
      `
  vec2 texel = u_blurAmount * u_pixelScale / u_resolution;
  vec3 sum = vec3(0.0);
  float wsum = 0.0;
  for (int i = -2; i <= 2; i++) {
    for (int j = -2; j <= 2; j++) {
      vec2 off = vec2(float(i), float(j)) * texel;
      float w = 1.0 / (1.0 + float(i * i + j * j));
      sum += texture2D(u_texture, clamp(v_uv + off, 0.0, 1.0)).rgb * w;
      wsum += w;
    }
  }
  vec3 blurred = sum / wsum;
  vec3 col = mix(blurred, vec3(1.0), u_haze * 0.35);
  col = mix(vec3(dot(col, vec3(0.333))), col, 1.0 - u_haze * 0.3);
  float g = hash12(v_uv * u_resolution * 0.5 + u_time * 0.02) - 0.5;
  col += g * u_grain * 0.05;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), texture2D(u_texture, v_uv).a);
      `
    ),
  },
  {
    id: 'prism-glass',
    name: 'Prism Glass',
    category: 'Glass',
    description: 'Faceted crystal refraction with chromatic fringing and bright shard seams.',
    thumbnail: 'from-cyan-200 via-fuchsia-200 to-amber-200',
    params: [
      { key: 'facetSize', label: 'Facet Size', type: 'float', default: 40, min: 10, max: 120, step: 1 },
      { key: 'refraction', label: 'Refraction', type: 'float', default: 0.6, min: 0, max: 2, step: 0.01 },
      { key: 'chroma', label: 'Chromatic Split', type: 'float', default: 0.4, min: 0, max: 1, step: 0.01, advanced: true },
      { key: 'shine', label: 'Edge Shine', type: 'float', default: 0.5, min: 0, max: 1, step: 0.01, advanced: true },
    ],
    fragmentShader: buildFragmentShader(
      `
uniform float u_facetSize;
uniform float u_refraction;
uniform float u_chroma;
uniform float u_shine;
      `,
      `
  float size = max(u_facetSize, 8.0) * u_pixelScale;
  vec2 p = v_uv * u_resolution;
  vec2 cellId = floor(p / size);
  vec2 cellUV = fract(p / size) - 0.5;

  float ang = hash12(cellId) * 6.28318530718;
  vec2 tilt = vec2(cos(ang), sin(ang));
  vec2 baseOffset = tilt * u_refraction * 0.02;

  vec2 uvR = clamp(v_uv + baseOffset * (1.0 + u_chroma), 0.0, 1.0);
  vec2 uvG = clamp(v_uv + baseOffset, 0.0, 1.0);
  vec2 uvB = clamp(v_uv + baseOffset * (1.0 - u_chroma), 0.0, 1.0);
  float r = texture2D(u_texture, uvR).r;
  float g = texture2D(u_texture, uvG).g;
  float b = texture2D(u_texture, uvB).b;
  float a = texture2D(u_texture, uvG).a;

  vec2 edgeDist = 0.5 - abs(cellUV);
  float edge = 1.0 - smoothstep(0.0, 0.08, min(edgeDist.x, edgeDist.y));
  vec3 col = vec3(r, g, b) + edge * u_shine * 0.5;

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), a);
      `
    ),
  },
  {
    id: 'string-art',
    name: 'String Art',
    category: 'Texture',
    description: 'Continuous wavy vertical lines whose thickness traces the image, like cut-paper thread art.',
    thumbnail: 'from-white via-neutral-400 to-black',
    params: [
      { key: 'lineSpacing', label: 'Line Spacing', type: 'float', default: 8, min: 3, max: 30, step: 0.5 },
      { key: 'contrast', label: 'Contrast', type: 'float', default: 1.3, min: 0, max: 2.5, step: 0.01 },
      { key: 'waviness', label: 'Waviness', type: 'float', default: 0.4, min: 0, max: 1, step: 0.01 },
      { key: 'jaggedness', label: 'Edge Jaggedness', type: 'float', default: 0.5, min: 0, max: 1, step: 0.01, advanced: true },
    ],
    fragmentShader: buildFragmentShader(
      `
uniform float u_lineSpacing;
uniform float u_contrast;
uniform float u_waviness;
uniform float u_jaggedness;
      `,
      `
  float spacing = max(u_lineSpacing, 3.0) * u_pixelScale;
  float lineIdx = floor(v_uv.x * u_resolution.x / spacing);
  float lineCenterX = (lineIdx + 0.5) * spacing;

  float wobble = (vnoise(vec2(lineIdx * 0.3, v_uv.y * 6.0)) - 0.5) * u_waviness * spacing * 0.6;
  float px = v_uv.x * u_resolution.x;
  float distFromCenter = px - (lineCenterX + wobble);

  vec2 sampleUV = vec2(clamp((lineCenterX + wobble) / u_resolution.x, 0.001, 0.999), v_uv.y);
  vec4 src = texture2D(u_texture, sampleUV);
  float lum = dot(src.rgb, vec3(0.299, 0.587, 0.114));
  lum = clamp((lum - 0.5) * u_contrast + 0.5, 0.0, 1.0);
  float thickness = (1.0 - lum) * spacing * 0.9;

  float edgeJitter = (vnoise(vec2(lineIdx * 5.3, v_uv.y * 40.0)) - 0.5) * u_jaggedness * spacing * 0.3;
  thickness = max(0.0, thickness + edgeJitter);

  float m = 1.0 - smoothstep(thickness * 0.5 - 1.0, thickness * 0.5, abs(distFromCenter));
  gl_FragColor = vec4(vec3(1.0 - m), src.a);
      `
    ),
  },
  {
    id: 'dot-portrait',
    name: 'Dot Portrait',
    category: 'Texture',
    description: 'Bold, evenly-gridded pop-art dot screen -- clean high-contrast poster halftone.',
    thumbnail: 'from-white via-neutral-500 to-black',
    params: [
      { key: 'dotSize', label: 'Dot Size', type: 'float', default: 14, min: 4, max: 40, step: 0.5 },
      { key: 'contrast', label: 'Contrast', type: 'float', default: 1.4, min: 0, max: 2.5, step: 0.01 },
      { key: 'invert', label: 'Invert', type: 'bool', default: 0, advanced: true },
    ],
    fragmentShader: buildFragmentShader(
      `
uniform float u_dotSize;
uniform float u_contrast;
uniform float u_invert;
      `,
      `
  vec4 c = texture2D(u_texture, v_uv);
  float lum = dot(c.rgb, vec3(0.299, 0.587, 0.114));
  lum = clamp((lum - 0.5) * u_contrast + 0.5, 0.0, 1.0);
  if (u_invert > 0.5) lum = 1.0 - lum;

  float size = max(u_dotSize, 3.0) * u_pixelScale;
  vec2 p = mod(v_uv * u_resolution, size) - size * 0.5;
  float d = length(p);
  float radius = (1.0 - lum) * size * 0.62;
  float m = 1.0 - smoothstep(radius - 1.0, radius, d);

  gl_FragColor = vec4(vec3(1.0 - m), c.a);
      `
    ),
  },
  {
    id: 'anime-cel',
    name: 'Anime Cel',
    category: 'Color',
    description: 'Vivid cel-shaded color grade: flat tonal bands, punchy contrast, orange/teal split-tone.',
    thumbnail: 'from-orange-400 via-slate-700 to-teal-500',
    params: [
      { key: 'saturation', label: 'Saturation', type: 'float', default: 1.4, min: 0, max: 2.5, step: 0.01 },
      { key: 'contrast', label: 'Contrast', type: 'float', default: 1.25, min: 0, max: 2.5, step: 0.01 },
      { key: 'celBands', label: 'Cel Bands', type: 'float', default: 10, min: 3, max: 32, step: 1, advanced: true },
      { key: 'splitTone', label: 'Split Tone', type: 'float', default: 0.5, min: 0, max: 1, step: 0.01, advanced: true },
      { key: 'lineStrength', label: 'Ink Lines', type: 'float', default: 0.3, min: 0, max: 1, step: 0.01, advanced: true },
    ],
    fragmentShader: buildFragmentShader(
      `
uniform float u_saturation;
uniform float u_contrast;
uniform float u_celBands;
uniform float u_splitTone;
uniform float u_lineStrength;
      `,
      `
  vec4 c = texture2D(u_texture, v_uv);
  vec3 col = c.rgb;

  col = (col - 0.5) * u_contrast + 0.5;

  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(vec3(lum), col, u_saturation);

  vec3 teal = vec3(0.0, 0.35, 0.4);
  vec3 orange = vec3(1.0, 0.55, 0.15);
  vec3 tint = mix(teal, orange, clamp(lum, 0.0, 1.0));
  col = mix(col, col * 0.5 + tint * 0.5, u_splitTone * 0.5);

  float bands = max(u_celBands, 2.0);
  col = floor(col * bands + 0.5) / bands;

  vec2 texel = 1.0 / u_resolution;
  float lumR = dot(texture2D(u_texture, v_uv + vec2(texel.x, 0.0)).rgb, vec3(0.299, 0.587, 0.114));
  float lumD = dot(texture2D(u_texture, v_uv + vec2(0.0, texel.y)).rgb, vec3(0.299, 0.587, 0.114));
  float edge = abs(lum - lumR) + abs(lum - lumD);
  col *= 1.0 - clamp(edge * u_lineStrength * 4.0, 0.0, 0.85);

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), c.a);
      `
    ),
  },
  {
    id: 'bitmap-dither',
    name: 'Bit Map',
    category: 'Texture',
    description: 'Stochastic pixel dithering, like a classic bitmap-mode diffusion dither conversion.',
    thumbnail: 'from-white via-neutral-400 to-black',
    params: [
      { key: 'dotPitch', label: 'Dot Size', type: 'float', default: 2, min: 1, max: 8, step: 0.5 },
      { key: 'contrast', label: 'Contrast', type: 'float', default: 1.1, min: 0, max: 2, step: 0.01, advanced: true },
    ],
    fragmentShader: buildFragmentShader(
      `
uniform float u_dotPitch;
uniform float u_contrast;
      `,
      `
  float pitch = max(u_dotPitch, 1.0) * u_pixelScale;
  vec2 cellId = floor(v_uv * u_resolution / pitch);
  vec2 sampleUV = clamp((cellId + 0.5) * pitch / u_resolution, 0.001, 0.999);
  vec4 c = texture2D(u_texture, sampleUV);
  float lum = dot(c.rgb, vec3(0.299, 0.587, 0.114));
  lum = clamp((lum - 0.5) * u_contrast + 0.5, 0.0, 1.0);

  float threshold = hash12(cellId + 0.5);
  float bit = step(threshold, lum);

  gl_FragColor = vec4(vec3(bit), c.a);
      `
    ),
  },
  {
    id: 'pixel-bloom',
    name: 'Pixel Bloom',
    category: 'Distortion',
    description: 'Chunky pixelation with color streaks bleeding outward from the frame edges.',
    thumbnail: 'from-black via-rose-400 to-pink-200',
    params: [
      { key: 'pixelSize', label: 'Pixel Size', type: 'float', default: 6, min: 2, max: 24, step: 1 },
      { key: 'streakAmount', label: 'Streak Amount', type: 'float', default: 0.5, min: 0, max: 1, step: 0.01 },
      { key: 'sparsity', label: 'Streak Sparsity', type: 'float', default: 0.6, min: 0, max: 1, step: 0.01, advanced: true },
      { key: 'seed', label: 'Seed', type: 'float', default: 0, min: 0, max: 100, step: 1, advanced: true },
    ],
    fragmentShader: buildFragmentShader(
      `
uniform float u_pixelSize;
uniform float u_streakAmount;
uniform float u_sparsity;
uniform float u_seed;
      `,
      `
  vec2 blockSize = max(vec2(1.0), vec2(u_pixelSize)) * u_pixelScale;
  vec2 pv = (floor(v_uv * u_resolution / blockSize) + 0.5) * blockSize / u_resolution;

  float bandSize = max(u_pixelSize, 1.0) * u_pixelScale;
  float row = floor(v_uv.y * u_resolution.y / bandSize);
  float gateRoll = hash11(row * 7.13 + u_seed * 3.7 + 1.1);
  float gated = step(mix(0.96, 0.4, u_streakAmount), gateRoll);
  float lenRoll = hash11(row * 2.71 + u_seed * 5.2 + 8.3);
  float streakLen = gated * pow(lenRoll, 1.0 + u_sparsity * 4.0) * mix(0.15, 0.9, u_streakAmount);
  float fromRight = step(0.5, hash11(row * 4.61 + u_seed * 1.9 + 3.3));

  vec2 uv = pv;
  if (fromRight < 0.5) {
    if (uv.x < streakLen) {
      float t = streakLen - uv.x;
      uv.x = clamp(streakLen + t * 0.05, streakLen, 1.0);
    }
  } else {
    float edge = 1.0 - streakLen;
    if (uv.x > edge) {
      float t = uv.x - edge;
      uv.x = clamp(edge - t * 0.05, 0.0, edge);
    }
  }
  gl_FragColor = texture2D(u_texture, uv);
      `
    ),
  },
  {
    id: 'dot-bloom',
    name: 'Dot Bloom',
    category: 'DreamLight',
    description: 'Soft blurred glow with a luminance-gated white dot mesh over the highlights.',
    thumbnail: 'from-teal-200 via-pink-200 to-orange-200',
    params: [
      { key: 'blurAmount', label: 'Blur', type: 'float', default: 6, min: 0, max: 20, step: 0.5 },
      { key: 'dotOpacity', label: 'Dot Opacity', type: 'float', default: 0.7, min: 0, max: 1, step: 0.01 },
      { key: 'dotSize', label: 'Dot Size', type: 'float', default: 10, min: 3, max: 30, step: 0.5, advanced: true },
      { key: 'threshold', label: 'Dot Threshold', type: 'float', default: 0.35, min: 0, max: 1, step: 0.01, advanced: true },
    ],
    fragmentShader: buildFragmentShader(
      `
uniform float u_blurAmount;
uniform float u_dotOpacity;
uniform float u_dotSize;
uniform float u_threshold;
      `,
      `
  vec2 texel = u_blurAmount * u_pixelScale / u_resolution;
  vec3 sum = vec3(0.0);
  float wsum = 0.0;
  for (int i = -2; i <= 2; i++) {
    for (int j = -2; j <= 2; j++) {
      vec2 off = vec2(float(i), float(j)) * texel;
      float w = 1.0 / (1.0 + float(i * i + j * j));
      sum += texture2D(u_texture, clamp(v_uv + off, 0.0, 1.0)).rgb * w;
      wsum += w;
    }
  }
  vec3 blurred = sum / wsum;

  float size = max(u_dotSize, 2.0) * u_pixelScale;
  vec2 base = (v_uv - 0.5) * u_resolution;
  vec2 p = mod(base, size) - size * 0.5;
  float lum = dot(blurred, vec3(0.299, 0.587, 0.114));
  float showDot = smoothstep(u_threshold - 0.15, u_threshold + 0.15, lum);
  float radius = showDot * size * 0.22;
  float d = length(p);
  float dotMask = 1.0 - smoothstep(radius - 1.0, radius, d);

  vec3 col = blurred + dotMask * u_dotOpacity;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
      `
    ),
  },
];

export const SHADER_MAP: Record<string, ShaderDef> = Object.fromEntries(
  BUILTIN_SHADERS.map((s) => [s.id, s])
);
