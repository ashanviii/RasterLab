import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import { GLRenderer } from '../webgl/renderer';
import type { ShaderDef, StackItem } from '../types';

export type StillFormat = 'png' | 'jpeg';

export interface ExportProgress {
  frame: number;
  totalFrames: number;
}

type FragmentSourceFn = (item: StackItem, def: ShaderDef) => string;

export async function exportStillImage(
  image: HTMLImageElement,
  stack: StackItem[],
  shaderDefs: Record<string, ShaderDef>,
  getFragmentSource: FragmentSourceFn,
  width: number,
  height: number,
  time: number,
  format: StillFormat,
  quality: number
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const renderer = new GLRenderer(canvas, { preserveDrawingBuffer: true });
  try {
    renderer.setImage(image, image.naturalWidth, image.naturalHeight);
    renderer.render(stack, shaderDefs, getFragmentSource, { width, height, time });
    const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const blob = await renderer.toBlob(mime, format === 'jpeg' ? quality : undefined);
    if (!blob) throw new Error(`Failed to encode ${format.toUpperCase()}.`);
    return blob;
  } finally {
    renderer.dispose();
  }
}

export async function exportGif(
  image: HTMLImageElement,
  stack: StackItem[],
  shaderDefs: Record<string, ShaderDef>,
  getFragmentSource: FragmentSourceFn,
  width: number,
  height: number,
  durationSec: number,
  fps: number,
  onProgress?: (p: ExportProgress) => void
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const renderer = new GLRenderer(canvas, { preserveDrawingBuffer: true });
  const readCanvas = document.createElement('canvas');
  readCanvas.width = width;
  readCanvas.height = height;
  const readCtx = readCanvas.getContext('2d', { willReadFrequently: true });
  if (!readCtx) throw new Error('2D canvas context is unavailable.');

  try {
    renderer.setImage(image, image.naturalWidth, image.naturalHeight);
    const glCanvas = renderer.getGL().canvas as HTMLCanvasElement;
    const totalFrames = Math.max(1, Math.round(durationSec * fps));
    const gif = GIFEncoder();
    const delay = Math.round(1000 / fps);

    for (let i = 0; i < totalFrames; i++) {
      const time = i / fps;
      renderer.render(stack, shaderDefs, getFragmentSource, { width, height, time });
      readCtx.drawImage(glCanvas, 0, 0);
      const { data } = readCtx.getImageData(0, 0, width, height);
      const palette = quantize(data, 256);
      const index = applyPalette(data, palette);
      gif.writeFrame(index, width, height, { palette, delay });
      onProgress?.({ frame: i + 1, totalFrames });
      await new Promise((r) => setTimeout(r, 0));
    }

    gif.finish();
    return new Blob([gif.bytes()], { type: 'image/gif' });
  } finally {
    renderer.dispose();
  }
}

const VIDEO_CANDIDATES = [
  { mimeType: 'video/mp4;codecs=avc1', extension: 'mp4' },
  { mimeType: 'video/webm;codecs=vp9', extension: 'webm' },
  { mimeType: 'video/webm;codecs=vp8', extension: 'webm' },
  { mimeType: 'video/webm', extension: 'webm' },
];

export function isVideoExportSupported() {
  return (
    typeof MediaRecorder !== 'undefined' &&
    VIDEO_CANDIDATES.some((c) => MediaRecorder.isTypeSupported(c.mimeType))
  );
}

export async function exportVideo(
  image: HTMLImageElement,
  stack: StackItem[],
  shaderDefs: Record<string, ShaderDef>,
  getFragmentSource: FragmentSourceFn,
  width: number,
  height: number,
  durationSec: number,
  fps: number,
  onProgress?: (p: ExportProgress) => void
): Promise<{ blob: Blob; extension: string }> {
  const chosen = VIDEO_CANDIDATES.find(
    (c) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c.mimeType)
  );
  if (!chosen) throw new Error('Video recording is not supported in this browser.');

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const renderer = new GLRenderer(canvas, { preserveDrawingBuffer: true });

  try {
    renderer.setImage(image, image.naturalWidth, image.naturalHeight);
    const glCanvas = renderer.getGL().canvas as HTMLCanvasElement & {
      captureStream(fps?: number): MediaStream;
    };

    renderer.render(stack, shaderDefs, getFragmentSource, { width, height, time: 0 });
    const stream = glCanvas.captureStream(fps);
    const recorder = new MediaRecorder(stream, { mimeType: chosen.mimeType });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    const stopped = new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
    });

    recorder.start();
    const totalFrames = Math.max(1, Math.round(durationSec * fps));
    const frameInterval = 1000 / fps;
    for (let i = 0; i < totalFrames; i++) {
      const time = i / fps;
      renderer.render(stack, shaderDefs, getFragmentSource, { width, height, time });
      onProgress?.({ frame: i + 1, totalFrames });
      await new Promise((r) => setTimeout(r, frameInterval));
    }
    recorder.stop();
    await stopped;

    return { blob: new Blob(chunks, { type: chosen.mimeType }), extension: chosen.extension };
  } finally {
    renderer.dispose();
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
