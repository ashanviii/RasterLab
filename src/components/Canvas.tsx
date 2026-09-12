import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image as ImageIcon,
  Loader2,
  Maximize2,
  Minimize2,
  RefreshCcw,
  UploadCloud,
  Wand2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import clsx from 'clsx';
import { useStore, type ViewMode } from '../store/useStore';
import { GLRenderer } from '../webgl/renderer';
import { getFragmentSource } from '../lib/fragmentSource';
import { timeRef } from '../lib/timeRef';
import { SAMPLE_IMAGES, type SampleImage } from '../lib/sampleImages';

interface Props {
  onRendererReady: (r: GLRenderer) => void;
}

const VIEW_MODES: { id: ViewMode; label: string }[] = [
  { id: 'original', label: 'Original' },
  { id: 'split', label: 'Split' },
  { id: 'rendered', label: 'Rendered' },
];

export default function Canvas({ onRendererReady }: Props) {
  const image = useStore((s) => s.image);
  const isLoadingImage = useStore((s) => s.isLoadingImage);
  const setImage = useStore((s) => s.setImage);
  const setImageFromUrl = useStore((s) => s.setImageFromUrl);
  const viewMode = useStore((s) => s.viewMode);
  const setViewMode = useStore((s) => s.setViewMode);
  const splitPosition = useStore((s) => s.splitPosition);
  const setSplitPosition = useStore((s) => s.setSplitPosition);
  const zoom = useStore((s) => s.zoom);
  const setZoom = useStore((s) => s.setZoom);
  const isRemovingBackground = useStore((s) => s.isRemovingBackground);
  const isBackgroundRemoved = useStore((s) => s.isBackgroundRemoved);
  const removeBackground = useStore((s) => s.removeBackground);
  const restoreOriginalBackground = useStore((s) => s.restoreOriginalBackground);

  const containerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<GLRenderer | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fitSize, setFitSize] = useState({ w: 640, h: 400 });
  const [isDragOver, setIsDragOver] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);

  // Init renderer once.
  useEffect(() => {
    if (!canvasRef.current) return;
    const renderer = new GLRenderer(canvasRef.current);
    rendererRef.current = renderer;
    onRendererReady(renderer);
    return () => renderer.dispose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Upload image texture when the image changes.
  useEffect(() => {
    if (!image || !rendererRef.current) return;
    rendererRef.current.setImage(image.element, image.width, image.height);
    setZoom(1);
    setSplitPosition(50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image?.element]);

  // Fit sizing via ResizeObserver.
  useEffect(() => {
    if (!containerRef.current || !image) return;
    const el = containerRef.current;
    const compute = () => {
      const rect = el.getBoundingClientRect();
      const pad = 64;
      const availW = Math.max(80, rect.width - pad);
      const availH = Math.max(80, rect.height - pad);
      const ar = image.width / image.height;
      let w = availW;
      let h = availW / ar;
      if (h > availH) {
        h = availH;
        w = availH * ar;
      }
      setFitSize({ w: Math.round(w), h: Math.round(h) });
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [image]);

  // Render loop.
  useEffect(() => {
    if (!image) return;
    let raf = 0;
    const start = performance.now();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const frame = () => {
      const elapsed = (performance.now() - start) / 1000;
      timeRef.current = elapsed;
      const renderer = rendererRef.current;
      if (renderer) {
        const state = useStore.getState();
        const cssW = Math.max(1, Math.round(fitSize.w * state.zoom));
        const cssH = Math.max(1, Math.round(fitSize.h * state.zoom));
        const maxDim = 4096;
        const scale = Math.min(dpr, maxDim / Math.max(cssW, cssH, 1));
        const renderW = Math.max(1, Math.round(cssW * scale));
        const renderH = Math.max(1, Math.round(cssH * scale));
        if (canvasRef.current) {
          canvasRef.current.style.width = `${cssW}px`;
          canvasRef.current.style.height = `${cssH}px`;
        }
        renderer.render(state.stack, state.allShaderDefs(), getFragmentSource, {
          width: renderW,
          height: renderH,
          time: elapsed,
        });
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [image, fitSize]);

  // Fullscreen tracking.
  useEffect(() => {
    const handler = () => setIsFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (file && file.type.startsWith('image/')) setImage(file);
    },
    [setImage]
  );

  const onSplitPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!frameRef.current) return;
      const rect = frameRef.current.getBoundingClientRect();
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitPosition(Math.min(100, Math.max(0, pct)));
    },
    [setSplitPosition]
  );

  useEffect(() => {
    if (!isDraggingSplit) return;
    const up = () => setIsDraggingSplit(false);
    window.addEventListener('pointermove', onSplitPointerMove);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', onSplitPointerMove);
      window.removeEventListener('pointerup', up);
    };
  }, [isDraggingSplit, onSplitPointerMove]);

  const cssW = fitSize.w * zoom;
  const cssH = fitSize.h * zoom;

  return (
    <div
      ref={containerRef}
      className="relative flex h-full w-full items-center justify-center overflow-auto rounded-2xl"
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {!image && (
        <div className="flex flex-col items-center gap-5">
          <div
            className={clsx(
              'flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-16 py-20 text-center transition-colors duration-200',
              isDragOver
                ? 'border-accent-400 bg-accent-500/5'
                : 'border-black/10 dark:border-white/10 hover:border-black/20 dark:hover:border-white/20'
            )}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/[0.04] dark:bg-white/[0.06]">
              <UploadCloud size={20} className="text-neutral-400" />
            </div>
            <div>
              <p className="text-[13.5px] font-medium text-neutral-700 dark:text-neutral-200">
                {isLoadingImage ? 'Loading image…' : 'Drop an image here'}
              </p>
              <p className="mt-0.5 text-[12px] text-neutral-400">or click below to browse your files</p>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-1 rounded-full bg-neutral-900 dark:bg-white px-4 py-1.5 text-[12px] font-medium text-white dark:text-neutral-900 hover:opacity-90 transition-opacity"
            >
              Upload Image
            </button>
          </div>

          <div className="flex flex-col items-center gap-2.5">
            <p className="text-[11.5px] text-neutral-400">No image? Try one of these</p>
            <div className="flex gap-2">
              {SAMPLE_IMAGES.map((sample) => (
                <SampleThumb
                  key={sample.id}
                  sample={sample}
                  onSelect={() => setImageFromUrl(sample.src, sample.name)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Canvas is always mounted so the renderer/context persists across image loads. */}
      <div
        ref={frameRef}
        className={clsx(
          'select-none overflow-hidden rounded-xl shadow-[0_1px_1px_rgba(0,0,0,0.04),0_20px_40px_-16px_rgba(0,0,0,0.25)] ring-1 ring-black/5 dark:ring-white/10',
          image ? 'relative' : 'invisible absolute inset-0 m-auto'
        )}
        style={{ width: cssW, height: cssH }}
      >
        <canvas ref={canvasRef} className="block h-full w-full bg-[repeating-conic-gradient(#00000008_0%_25%,transparent_0%_50%)] bg-[length:16px_16px]" />

        {image && viewMode !== 'rendered' && (
          <img
            src={image.element.src}
            draggable={false}
            className="pointer-events-none absolute inset-0 h-full w-full object-fill"
            style={
              viewMode === 'split'
                ? { clipPath: `inset(0 ${100 - splitPosition}% 0 0)` }
                : undefined
            }
          />
        )}

        {image && viewMode === 'split' && (
          <div
            className="absolute inset-y-0 z-10 flex w-6 -translate-x-1/2 cursor-ew-resize items-center justify-center"
            style={{ left: `${splitPosition}%` }}
            onPointerDown={(e) => {
              e.preventDefault();
              setIsDraggingSplit(true);
            }}
          >
            <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-white/90 shadow-[0_0_0_1px_rgba(0,0,0,0.15)]" />
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-lg ring-1 ring-black/10">
              <div className="flex gap-0.5">
                <div className="h-3 w-[2px] rounded-full bg-neutral-400" />
                <div className="h-3 w-[2px] rounded-full bg-neutral-400" />
              </div>
            </div>
          </div>
        )}
      </div>

      {image && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full glass-strong px-2 py-1.5 shadow-glass dark:shadow-glass-dark animate-fade-in">
          <div className="flex gap-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] p-0.5">
            {VIEW_MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setViewMode(m.id)}
                className={clsx(
                  'rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors duration-150',
                  viewMode === m.id
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                )}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="mx-1 h-4 w-px bg-black/10 dark:bg-white/10" />

          <ToolbarIconButton title="Zoom out" onClick={() => setZoom((z) => Math.max(0.1, +(z - 0.25).toFixed(2)))}>
            <ZoomOut size={14} />
          </ToolbarIconButton>
          <span className="w-10 text-center text-[11px] tabular-nums text-neutral-500 dark:text-neutral-400">
            {Math.round(zoom * 100)}%
          </span>
          <ToolbarIconButton title="Zoom in" onClick={() => setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2)))}>
            <ZoomIn size={14} />
          </ToolbarIconButton>

          <div className="mx-1 h-4 w-px bg-black/10 dark:bg-white/10" />

          <ToolbarIconButton
            title={
              isRemovingBackground
                ? 'Removing background…'
                : isBackgroundRemoved
                  ? 'Restore original background'
                  : 'Remove background'
            }
            active={isBackgroundRemoved}
            disabled={isRemovingBackground}
            onClick={() => {
              if (isBackgroundRemoved) restoreOriginalBackground();
              else removeBackground();
            }}
          >
            {isRemovingBackground ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />}
          </ToolbarIconButton>

          <div className="mx-1 h-4 w-px bg-black/10 dark:bg-white/10" />

          <ToolbarIconButton
            title="Reset view"
            onClick={() => {
              setZoom(1);
              setSplitPosition(50);
            }}
          >
            <RefreshCcw size={13} />
          </ToolbarIconButton>
          <ToolbarIconButton
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            onClick={() => {
              if (!containerRef.current) return;
              if (document.fullscreenElement) document.exitFullscreen();
              else containerRef.current.requestFullscreen();
            }}
          >
            {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </ToolbarIconButton>
        </div>
      )}
    </div>
  );
}

function ToolbarIconButton({
  children,
  onClick,
  title,
  active,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        'flex h-[26px] w-[26px] items-center justify-center rounded-full transition-colors',
        disabled && 'cursor-not-allowed opacity-50',
        active
          ? 'bg-accent-500 text-white hover:bg-accent-600'
          : 'text-neutral-500 dark:text-neutral-400 hover:bg-black/[0.06] dark:hover:bg-white/10 hover:text-neutral-900 dark:hover:text-white'
      )}
    >
      {children}
    </button>
  );
}

function SampleThumb({ sample, onSelect }: { sample: SampleImage; onSelect: () => void }) {
  const [failed, setFailed] = useState(false);

  return (
    <button
      onClick={onSelect}
      title={sample.name}
      className="group relative h-14 w-14 shrink-0 overflow-hidden rounded-xl ring-1 ring-black/10 dark:ring-white/10 transition-transform duration-150 hover:scale-105 hover:ring-accent-400/60"
    >
      {!failed ? (
        <img
          src={sample.src}
          alt={sample.name}
          draggable={false}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-800">
          <ImageIcon size={16} className="text-neutral-400" />
        </div>
      )}
    </button>
  );
}
