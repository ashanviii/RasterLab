export const VERTEX_SHADER = `
attribute vec2 a_position;
varying vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const HEADER = `
precision highp float;
varying vec2 v_uv;
uniform sampler2D u_texture;
uniform vec2 u_resolution;
uniform float u_time;
`;

const HELPERS = `
float hash11(float p) {
  p = fract(p * 0.1031);
  p *= p + 33.33;
  p *= p + p;
  return fract(p);
}
float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
vec2 rotate2D(vec2 p, float a) {
  float s = sin(a);
  float c = cos(a);
  return mat2(c, -s, s, c) * p;
}
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash12(i);
  float b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0));
  float d = hash12(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}
vec3 rgb2hsv(vec3 c) {
  vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
  vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
  vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
  float d = q.x - min(q.w, q.y);
  float e = 1.0e-10;
  return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}
vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}
vec3 unpackColor(float colorPacked) {
  float r = floor(colorPacked / 65536.0);
  float g = floor(mod(colorPacked, 65536.0) / 256.0);
  float b = mod(colorPacked, 256.0);
  return vec3(r, g, b) / 255.0;
}
float blendLum(vec3 c) { return dot(c, vec3(0.3, 0.59, 0.11)); }
float blendSat(vec3 c) { return max(max(c.r, c.g), c.b) - min(min(c.r, c.g), c.b); }

vec3 blendClipColor(vec3 c) {
  float l = blendLum(c);
  float n = min(min(c.r, c.g), c.b);
  float x = max(max(c.r, c.g), c.b);
  if (n < 0.0) c = l + (c - l) * (l / max(l - n, 1e-4));
  if (x > 1.0) c = l + (c - l) * ((1.0 - l) / max(x - l, 1e-4));
  return c;
}

vec3 blendSetLum(vec3 c, float l) {
  return blendClipColor(c + vec3(l - blendLum(c)));
}

vec3 blendSetSat(vec3 c, float s) {
  float cmin = min(min(c.r, c.g), c.b);
  float cmax = max(max(c.r, c.g), c.b);
  if (cmax > cmin) return (c - cmin) * s / (cmax - cmin);
  return vec3(0.0);
}

/** Standard Photoshop/CSS blend modes: 0 Normal, 1 Darken, 2 Multiply, 3 Plus Darker, 4 Lighten,
    5 Screen, 6 Plus Lighter, 7 Color Dodge, 8 Overlay, 9 Soft Light, 10 Hard Light, 11 Difference,
    12 Exclusion, 13 Hue, 14 Saturation, 15 Color, 16 Luminosity. */
vec3 applyBlend(vec3 base, vec3 blend, float mode) {
  if (mode < 0.5) return blend;
  else if (mode < 1.5) return min(base, blend);
  else if (mode < 2.5) return base * blend;
  else if (mode < 3.5) return clamp(base + blend - 1.0, 0.0, 1.0);
  else if (mode < 4.5) return max(base, blend);
  else if (mode < 5.5) return 1.0 - (1.0 - base) * (1.0 - blend);
  else if (mode < 6.5) return clamp(base + blend, 0.0, 1.0);
  else if (mode < 7.5) return clamp(base / max(1.0 - blend, 0.001), 0.0, 1.0);
  else if (mode < 8.5) {
    return vec3(
      base.r < 0.5 ? 2.0 * base.r * blend.r : 1.0 - 2.0 * (1.0 - base.r) * (1.0 - blend.r),
      base.g < 0.5 ? 2.0 * base.g * blend.g : 1.0 - 2.0 * (1.0 - base.g) * (1.0 - blend.g),
      base.b < 0.5 ? 2.0 * base.b * blend.b : 1.0 - 2.0 * (1.0 - base.b) * (1.0 - blend.b)
    );
  } else if (mode < 9.5) {
    vec3 d = vec3(
      blend.r <= 0.25 ? ((16.0 * blend.r - 12.0) * blend.r + 4.0) * blend.r : sqrt(blend.r),
      blend.g <= 0.25 ? ((16.0 * blend.g - 12.0) * blend.g + 4.0) * blend.g : sqrt(blend.g),
      blend.b <= 0.25 ? ((16.0 * blend.b - 12.0) * blend.b + 4.0) * blend.b : sqrt(blend.b)
    );
    return vec3(
      base.r <= 0.5 ? base.r - (1.0 - 2.0 * blend.r) * base.r * (1.0 - base.r) : base.r + (2.0 * blend.r - 1.0) * (d.r - base.r),
      base.g <= 0.5 ? base.g - (1.0 - 2.0 * blend.g) * base.g * (1.0 - base.g) : base.g + (2.0 * blend.g - 1.0) * (d.g - base.g),
      base.b <= 0.5 ? base.b - (1.0 - 2.0 * blend.b) * base.b * (1.0 - base.b) : base.b + (2.0 * blend.b - 1.0) * (d.b - base.b)
    );
  } else if (mode < 10.5) {
    return vec3(
      blend.r < 0.5 ? 2.0 * base.r * blend.r : 1.0 - 2.0 * (1.0 - base.r) * (1.0 - blend.r),
      blend.g < 0.5 ? 2.0 * base.g * blend.g : 1.0 - 2.0 * (1.0 - base.g) * (1.0 - blend.g),
      blend.b < 0.5 ? 2.0 * base.b * blend.b : 1.0 - 2.0 * (1.0 - base.b) * (1.0 - blend.b)
    );
  } else if (mode < 11.5) return abs(base - blend);
  else if (mode < 12.5) return base + blend - 2.0 * base * blend;
  else if (mode < 13.5) return blendSetLum(blendSetSat(blend, blendSat(base)), blendLum(base));
  else if (mode < 14.5) return blendSetLum(blendSetSat(base, blendSat(blend)), blendLum(base));
  else if (mode < 15.5) return blendSetLum(blend, blendLum(base));
  else return blendSetLum(base, blendLum(blend));
}
`;

export function buildFragmentShader(uniformDecls: string, mainBody: string): string {
  return `${HEADER}\n${uniformDecls}\n${HELPERS}\nvoid main() {\n${mainBody}\n}\n`;
}

/** Wrap a user-authored custom shader body (uniform decls + void main) with the shared header/helpers. */
export function wrapCustomSource(source: string): string {
  return `${HEADER}\n${HELPERS}\n${source}`;
}

/** Extract `uniform float u_xxx;` declarations from a custom shader source, excluding the built-in ones. */
export function extractCustomUniforms(source: string): string[] {
  const reserved = new Set(['texture', 'resolution', 'time']);
  const found: string[] = [];
  const re = /uniform\s+float\s+u_([a-zA-Z0-9_]+)\s*;/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source))) {
    const key = m[1];
    if (!reserved.has(key) && !found.includes(key)) found.push(key);
  }
  return found;
}

export const IDENTITY_FRAGMENT_SHADER = buildFragmentShader(
  '',
  `gl_FragColor = texture2D(u_texture, v_uv);`
);

/**
 * Composites a stack item's own effect (u_texture) back over its original input (u_base),
 * using a painted per-item mask (u_mask, red channel = visibility) so the effect can be
 * erased/added back in specific spots. See GLRenderer.paintMask.
 */
export const MASK_COMPOSITE_FRAGMENT_SHADER = buildFragmentShader(
  `
uniform sampler2D u_base;
uniform sampler2D u_mask;
  `,
  `
  vec4 effect = texture2D(u_texture, v_uv);
  vec4 base = texture2D(u_base, v_uv);
  float m = texture2D(u_mask, v_uv).r;
  gl_FragColor = mix(base, effect, m);
  `
);

/** Shared post-process pass applying the universal Color (duotone) params every shader gets. */
export const UNIVERSAL_FX_FRAGMENT_SHADER = buildFragmentShader(
  `
uniform float u_tintColor;
uniform float u_colorBlendMode;
uniform float u_tintAmount;
  `,
  `
  vec4 src = texture2D(u_texture, v_uv);
  vec3 col = src.rgb;

  if (u_tintAmount > 0.001) {
    vec3 tint = unpackColor(u_tintColor);
    vec3 light = vec3(1.0);
    float lum = dot(col, vec3(0.299, 0.587, 0.114));
    vec3 duotone = mix(tint, light, lum);

    vec3 blended = clamp(applyBlend(col, duotone, u_colorBlendMode), 0.0, 1.0);
    col = mix(col, blended, clamp(u_tintAmount, 0.0, 1.0));
  }

  gl_FragColor = vec4(clamp(col, 0.0, 1.0), src.a);
  `
);

export const CUSTOM_SHADER_TEMPLATE = `// Available uniforms:
// u_texture   (sampler2D) - the input image / previous stack result
// u_resolution (vec2)     - render size in pixels
// u_time      (float)     - seconds elapsed
// u_amount    (float)     - your custom slider (0..1)
//
// Available helpers: hash11, hash12, vnoise, rotate2D, rgb2hsv, hsv2rgb

uniform float u_amount;

void main() {
  vec2 uv = v_uv;
  vec4 color = texture2D(u_texture, uv);

  float wave = sin(uv.x * 40.0 + u_time * 2.0) * 0.01 * u_amount;
  color = texture2D(u_texture, uv + vec2(0.0, wave));

  gl_FragColor = color;
}
`;
