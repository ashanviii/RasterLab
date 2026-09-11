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
