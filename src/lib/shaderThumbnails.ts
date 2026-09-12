import { GLRenderer } from '../webgl/renderer';
import { getFragmentSource } from './fragmentSource';
import type { ShaderDef, StackItem } from '../types';

const THUMB_SIZE = 128;
const PREVIEW_TIME = 0.6;
const SCENE_SIZE = 160;

const cache = new Map<string, string>();
const pending = new Set<string>();
const listeners = new Set<() => void>();

let sceneImages: HTMLImageElement[] | null = null;
let sceneImagesPromise: Promise<HTMLImageElement[]> | null = null;
let sharedRenderer: GLRenderer | null = null;

function notify() {
  listeners.forEach((l) => l());
}

export function subscribeThumbnails(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function thumbnailCacheKey(def: ShaderDef): string {
  return def.custom ? `${def.id}:${hashString(def.fragmentShader).toString(36)}` : def.id;
}

type SceneDrawer = (ctx: CanvasRenderingContext2D) => void;

const SCENES: SceneDrawer[] = [
  // Night lanterns: warm glow on near-black, dark silhouette, ember sparks.
  (ctx) => {
    const grad = ctx.createLinearGradient(0, 0, 0, SCENE_SIZE);
    grad.addColorStop(0, '#0f1117');
    grad.addColorStop(0.55, '#1a1c24');
    grad.addColorStop(1, '#241d16');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, SCENE_SIZE, SCENE_SIZE);

    const glow = ctx.createRadialGradient(58, 54, 2, 58, 54, 56);
    glow.addColorStop(0, 'rgba(255,208,140,0.95)');
    glow.addColorStop(0.5, 'rgba(255,170,90,0.35)');
    glow.addColorStop(1, 'rgba(255,170,90,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(58, 54, 56, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    ctx.arc(118, 122, 26, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,225,180,0.85)';
    for (const [sx, sy, sr] of [
      [128, 40, 2.6],
      [140, 70, 1.8],
      [30, 100, 2],
      [95, 130, 1.6],
    ] as const) {
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(8, 138);
    ctx.lineTo(152, 128);
    ctx.stroke();
  },

  // Sky and clouds: deep blue fading lighter, soft layered cloud masses.
  (ctx) => {
    const grad = ctx.createLinearGradient(0, 0, 0, SCENE_SIZE);
    grad.addColorStop(0, '#16375e');
    grad.addColorStop(1, '#4d7fae');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, SCENE_SIZE, SCENE_SIZE);

    const cloud = (cx: number, cy: number, r: number, alpha: number) => {
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    };
    cloud(60, 115, 34, 0.95);
    cloud(90, 105, 28, 0.9);
    cloud(38, 122, 24, 0.85);
    cloud(108, 122, 22, 0.85);
    cloud(125, 55, 20, 0.55);
    cloud(140, 65, 15, 0.5);
    cloud(20, 45, 12, 0.35);
  },

  // Botanical: warm paper background, stems and tulip-like heads.
  (ctx) => {
    const grad = ctx.createLinearGradient(0, 0, SCENE_SIZE, SCENE_SIZE);
    grad.addColorStop(0, '#f1efe2');
    grad.addColorStop(1, '#cfd6bd');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, SCENE_SIZE, SCENE_SIZE);

    ctx.strokeStyle = '#4c7a3d';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(58, 160);
    ctx.lineTo(64, 68);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(102, 160);
    ctx.lineTo(96, 58);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(128, 160);
    ctx.lineTo(122, 78);
    ctx.stroke();

    ctx.fillStyle = '#d9502b';
    ctx.beginPath();
    ctx.ellipse(64, 52, 17, 26, -0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e2a52c';
    ctx.beginPath();
    ctx.ellipse(96, 44, 15, 24, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c23b2f';
    ctx.beginPath();
    ctx.ellipse(122, 62, 13, 20, -0.05, 0, Math.PI * 2);
    ctx.fill();
  },

  // Monochrome dramatic portrait: single hard light source, deep shadow mass.
  (ctx) => {
    const grad = ctx.createLinearGradient(0, 0, SCENE_SIZE, 0);
    grad.addColorStop(0, '#0a0a0a');
    grad.addColorStop(1, '#9a9a9a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, SCENE_SIZE, SCENE_SIZE);

    ctx.fillStyle = 'rgba(15,15,15,0.92)';
    ctx.beginPath();
    ctx.ellipse(74, 82, 46, 56, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.beginPath();
    ctx.ellipse(56, 58, 16, 22, -0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(30, 150);
    ctx.lineTo(150, 150);
    ctx.stroke();
  },

  // Fireworks: near-black sky, radiating burst of spark trails.
  (ctx) => {
    ctx.fillStyle = '#06050a';
    ctx.fillRect(0, 0, SCENE_SIZE, SCENE_SIZE);

    const cx = 82;
    const cy = 66;
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 9) {
      const len = 46 + (Math.sin(a * 3) + 1) * 8;
      const x2 = cx + Math.cos(a) * len;
      const y2 = cy + Math.sin(a) * len;
      ctx.strokeStyle = 'rgba(255,222,170,0.85)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255,236,200,0.95)';
      ctx.beginPath();
      ctx.arc(x2, y2, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,240,0.95)';
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fill();
  },
];

function renderScene(index: number): Promise<HTMLImageElement> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = SCENE_SIZE;
    canvas.height = SCENE_SIZE;
    const ctx = canvas.getContext('2d')!;
    SCENES[index](ctx);
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = canvas.toDataURL();
  });
}

function loadSceneImages(): Promise<HTMLImageElement[]> {
  if (sceneImages) return Promise.resolve(sceneImages);
  if (sceneImagesPromise) return sceneImagesPromise;
  sceneImagesPromise = Promise.all(SCENES.map((_, i) => renderScene(i))).then((imgs) => {
    sceneImages = imgs;
    return imgs;
  });
  return sceneImagesPromise;
}

function defaultParamsFor(def: ShaderDef): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of def.params) out[p.key] = p.default;
  return out;
}

export function getCachedThumbnail(key: string): string | undefined {
  return cache.get(key);
}

export async function ensureThumbnail(def: ShaderDef): Promise<void> {
  const key = thumbnailCacheKey(def);
  if (cache.has(key) || pending.has(key)) return;
  pending.add(key);

  try {
    const images = await loadSceneImages();
    const image = images[hashString(def.id) % images.length];

    if (!sharedRenderer) {
      const canvas = document.createElement('canvas');
      canvas.width = THUMB_SIZE;
      canvas.height = THUMB_SIZE;
      sharedRenderer = new GLRenderer(canvas);
    }
    const renderer = sharedRenderer;
    renderer.setImage(image, image.naturalWidth, image.naturalHeight);

    const cacheKeyForProgram = def.custom ? `custom:${def.id}` : `builtin:${def.id}`;
    if (def.custom) renderer.invalidateProgram(cacheKeyForProgram);

    const item: StackItem = {
      instanceId: def.id,
      shaderId: def.id,
      enabled: true,
      params: defaultParamsFor(def),
    };

    renderer.render([item], { [def.id]: def }, getFragmentSource, {
      width: THUMB_SIZE,
      height: THUMB_SIZE,
      time: PREVIEW_TIME,
    });

    const canvasEl = renderer.getGL().canvas as HTMLCanvasElement;
    cache.set(key, canvasEl.toDataURL('image/png'));
    notify();
  } catch {
    // Leave uncached; caller falls back to the gradient swatch.
  } finally {
    pending.delete(key);
  }
}
