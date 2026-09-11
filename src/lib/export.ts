import { GLRenderer } from '../webgl/renderer';
import type { ShaderDef, StackItem } from '../types';

export async function exportRenderedImage(
  image: HTMLImageElement,
  stack: StackItem[],
  shaderDefs: Record<string, ShaderDef>,
  getFragmentSource: (item: StackItem, def: ShaderDef) => string,
  width: number,
  height: number,
  time: number
): Promise<Blob> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const renderer = new GLRenderer(canvas);
  try {
    renderer.setImage(image, image.naturalWidth, image.naturalHeight);
    renderer.render(stack, shaderDefs, getFragmentSource, { width, height, time });
    const blob = await renderer.toBlob('image/png');
    if (!blob) throw new Error('Failed to encode PNG.');
    return blob;
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
