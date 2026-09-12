import type { ShaderDef } from '../types';
import { buildFragmentShader } from './common';

export const BUILTIN_SHADERS: ShaderDef[] = [
  {
    id: 'rgb-split',
    name: 'RGB Split',
    category: 'Color',
    description: 'Separate the red, green and blue channels along an angle.',
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
  vec2 px = dir / u_resolution;
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
  float blockY = floor(v_uv.y * u_resolution.y / max(u_blockSize, 1.0));
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
    float scan = sin(uv.y * u_resolution.y * 1.0) * 0.5 + 0.5;
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
  vec2 size = max(vec2(1.0), vec2(u_pixelSize));
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
  vec2 ps = max(vec2(1.0), vec2(u_pixelSize));
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
  float size = max(u_dotSize, 2.0);
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
  vec2 texel = u_radius / u_resolution;
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
  vec2 p = v_uv * u_resolution / max(u_size, 0.1) + u_time * u_speed * 60.0;
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
    description: 'Luminance-mapped terminal glyphs in place of pixels.',
    thumbnail: 'from-emerald-300 via-emerald-600 to-neutral-950',
    params: [
      { key: 'cellSize', label: 'Font Size', type: 'float', default: 12, min: 4, max: 40, step: 1, group: 'Character Options' },
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
        group: 'Character Options',
      },
      { key: 'charOpacity', label: 'Char Opacity', type: 'float', default: 1, min: 0, max: 1, step: 0.01, group: 'Character Options' },
      { key: 'invert', label: 'Invert Mapping', type: 'bool', default: 0, group: 'Character Options' },
      { key: 'dotGridOverlay', label: 'Dot Grid Overlay', type: 'bool', default: 0, group: 'Character Options' },
      { key: 'randomizeChars', label: 'Randomize Characters', type: 'bool', default: 0, group: 'Character Options' },

      { key: 'coverage', label: 'Coverage', type: 'float', default: 1, min: 0, max: 1, step: 0.01, group: 'Intensity' },
      { key: 'edgeEmphasis', label: 'Edge Emphasis', type: 'float', default: 0, min: 0, max: 1, step: 0.01, group: 'Intensity' },
      { key: 'density', label: 'Density', type: 'float', default: 0.3, min: 0, max: 1, step: 0.01, group: 'Intensity' },
      { key: 'brightness', label: 'Brightness', type: 'float', default: 1, min: 0, max: 2, step: 0.01, group: 'Intensity' },
      { key: 'contrast', label: 'Contrast', type: 'float', default: 1.1, min: 0, max: 2, step: 0.01, group: 'Intensity' },

      { key: 'animated', label: 'Animated ASCII', type: 'bool', default: 0, group: 'Animation' },
    ],
    fragmentShader: buildFragmentShader(
      `
uniform float u_cellSize;
uniform float u_contrast;
uniform float u_colorMode;
uniform float u_colorBlendMode;
uniform float u_charOpacity;
uniform float u_invert;
uniform float u_dotGridOverlay;
uniform float u_randomizeChars;
uniform float u_coverage;
uniform float u_edgeEmphasis;
uniform float u_density;
uniform float u_brightness;
uniform float u_animated;

float asciiLine(vec2 p, vec2 a, vec2 b, float thick) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  float d = length(pa - ba * h);
  return 1.0 - smoothstep(thick * 0.7, thick, d);
}

float asciiGlyph(vec2 p, float level) {
  float thick = 0.09;
  float ext = 0.34;
  if (level < 0.5) {
    return 0.0;
  } else if (level < 1.5) {
    return 1.0 - smoothstep(0.05, 0.09, length(p));
  } else if (level < 2.5) {
    float a = asciiLine(p, vec2(0.0, -ext), vec2(0.0, ext), thick);
    float b = asciiLine(p, vec2(-ext, 0.0), vec2(ext, 0.0), thick);
    return max(a, b);
  } else if (level < 3.5) {
    float a = asciiLine(p, vec2(0.0, -ext), vec2(0.0, ext), thick);
    float b = asciiLine(p, vec2(-ext, 0.0), vec2(ext, 0.0), thick);
    float c = asciiLine(p, vec2(-ext, -ext), vec2(ext, ext), thick * 0.85);
    float d = asciiLine(p, vec2(-ext, ext), vec2(ext, -ext), thick * 0.85);
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
  vec2 cell = max(vec2(1.0), vec2(u_cellSize));
  vec2 cellId = floor(v_uv * u_resolution / cell);
  vec2 cellUV = mod(v_uv * u_resolution, cell) / cell - 0.5;
  vec2 sampleUV = (cellId + 0.5) * cell / u_resolution;
  vec4 src = texture2D(u_texture, sampleUV);

  float lum = dot(src.rgb, vec3(0.299, 0.587, 0.114));

  if (u_edgeEmphasis > 0.001) {
    vec2 stepUV = cell / u_resolution;
    float lumR = dot(texture2D(u_texture, sampleUV + vec2(stepUV.x, 0.0)).rgb, vec3(0.299, 0.587, 0.114));
    float lumD = dot(texture2D(u_texture, sampleUV + vec2(0.0, stepUV.y)).rgb, vec3(0.299, 0.587, 0.114));
    float edge = abs(lum - lumR) + abs(lum - lumD);
    lum = clamp(lum + edge * u_edgeEmphasis * 2.0, 0.0, 1.0);
  }

  lum = clamp((lum - 0.5) * u_contrast + 0.5, 0.0, 1.0);
  lum = clamp(lum + (lum - 0.5) * u_density * 1.5 + u_density * 0.15, 0.0, 1.0);
  if (u_invert > 0.5) lum = 1.0 - lum;

  float levelF = lum * 5.999;
  if (u_randomizeChars > 0.5) {
    float t = u_animated > 0.5 ? floor(u_time * 6.0) : 0.0;
    float jitter = (hash12(cellId + t) - 0.5) * 2.4;
    levelF = clamp(levelF + jitter, 0.0, 5.999);
  }
  float level = floor(levelF);
  float cov = asciiGlyph(cellUV, level) * u_coverage;

  vec3 bg = vec3(0.03);
  vec3 fg = vec3(0.92);
  if (u_colorMode > 0.5 && u_colorMode < 1.5) {
    fg = src.rgb;
    bg = src.rgb * 0.06;
  } else if (u_colorMode > 1.5) {
    fg = vec3(0.35, 1.0, 0.55);
    bg = vec3(0.0, 0.04, 0.02);
  }

  vec3 col = mix(bg, fg, cov * u_charOpacity);
  col = applyBlend(src.rgb, col, u_colorBlendMode);

  if (u_dotGridOverlay > 0.5) {
    vec2 gridUV = fract(v_uv * u_resolution / cell);
    float gd = length(gridUV);
    float dotMask = 1.0 - smoothstep(0.03, 0.07, gd);
    col += dotMask * 0.18;
  }

  col *= u_brightness;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), src.a);
      `
    ),
  },
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
  vec2 cell = max(vec2(1.0), vec2(u_cellSize));
  vec2 cellId = floor(v_uv * u_resolution / cell);
  vec2 cellUV = mod(v_uv * u_resolution, cell) / cell - 0.5;
  vec2 sampleUV = (cellId + 0.5) * cell / u_resolution;
  vec4 src = texture2D(u_texture, sampleUV);

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
  vec2 cell = max(vec2(2.0), vec2(u_cellSize));
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
  float spacing = max(u_lineSpacing, 2.0);
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
  float scale = max(u_scale, 1.0);
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
  vec2 cell = max(vec2(4.0), vec2(u_cellSize));
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
  vec2 cell = max(vec2(1.0), vec2(u_pixelSize));
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
  vec2 cell = max(vec2(2.0), vec2(u_cellSize));
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
  vec2 cell = max(vec2(4.0), vec2(u_cellSize));
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
  vec2 cell = max(vec2(2.0), vec2(u_cellSize));
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
  vec2 cell = max(vec2(2.0), vec2(u_cellSize));
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
  vec2 cellPx = vec2(max(u_cellSize, 4.0), max(u_cellSize, 4.0) * 2.0);
  vec2 cellId = floor(v_uv * u_resolution / cellPx);
  vec2 localPx = mod(v_uv * u_resolution, cellPx);
  vec2 dotCoord = floor(localPx / cellPx * vec2(2.0, 4.0));
  vec2 sampleUV = clamp((cellId + 0.5) * cellPx / u_resolution, 0.001, 0.999);
  vec4 src = texture2D(u_texture, sampleUV);

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
  vec2 cell = max(vec2(6.0), vec2(u_cellSize));
  vec2 cellId = floor(v_uv * u_resolution / cell);
  vec2 p = mod(v_uv * u_resolution, cell) / cell - 0.5;
  vec2 sampleUV = clamp((cellId + 0.5) * cell / u_resolution, 0.001, 0.999);
  vec4 src = texture2D(u_texture, sampleUV);
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
  vec2 cell = max(vec2(6.0), vec2(u_cellSize));
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
];

export const SHADER_MAP: Record<string, ShaderDef> = Object.fromEntries(
  BUILTIN_SHADERS.map((s) => [s.id, s])
);
