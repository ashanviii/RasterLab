import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Download, ImagePlus, Moon, Sparkle, Sun } from 'lucide-react';
import clsx from 'clsx';
import { useStore } from '../store/useStore';
import {
  downloadBlob,
  exportGif,
  exportStillImage,
  exportVideo,
  isVideoExportSupported,
  type ExportProgress,
  type StillFormat,
} from '../lib/export';
import { getFragmentSource } from '../lib/fragmentSource';
import { timeRef } from '../lib/timeRef';

interface Props {
  isDark: boolean;
  onToggleDark: () => void;
}

type ExportFormat = 'png' | 'jpeg' | 'gif' | 'video';
type Resolution = 'original' | 'custom';

const FORMATS: { id: ExportFormat; label: string }[] = [
  { id: 'png', label: 'PNG' },
  { id: 'jpeg', label: 'JPG' },
  { id: 'gif', label: 'GIF' },
  { id: 'video', label: 'Video' },
];

const FPS_OPTIONS = [12, 24, 30];

export default function TopBar({ isDark, onToggleDark }: Props) {
  const image = useStore((s) => s.image);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const setImage = useStore((s) => s.setImage);

  const [exportOpen, setExportOpen] = useState(false);
  const [format, setFormat] = useState<ExportFormat>('png');
  const [resolution, setResolution] = useState<Resolution>('original');
  const [customW, setCustomW] = useState(1920);
  const [customH, setCustomH] = useState(1080);
  const [quality, setQuality] = useState(0.92);
  const [duration, setDuration] = useState(3);
  const [fps, setFps] = useState(24);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const videoSupported = useMemo(() => isVideoExportSupported(), []);
  const isAnimated = format === 'gif' || format === 'video';

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) setExportOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    if (image) {
      setCustomW(image.width);
      setCustomH(image.height);
    }
  }, [image]);

  async function handleExport() {
    if (!image) return;
    setIsExporting(true);
    setProgress(null);
    setExportError(null);
    try {
      const state = useStore.getState();
      let width = image.width;
      let height = image.height;
      if (resolution === 'custom') {
        width = Math.max(1, Math.round(customW));
        height = Math.max(1, Math.round(customH));
      }
      const stamp = Date.now();
      const stack = state.stack;
      const defs = state.allShaderDefs();

      if (format === 'png' || format === 'jpeg') {
        const stillFormat: StillFormat = format;
        const blob = await exportStillImage(
          image.element,
          stack,
          defs,
          getFragmentSource,
          width,
          height,
          timeRef.current,
          stillFormat,
          quality
        );
        downloadBlob(blob, `stencil-${stamp}.${format === 'jpeg' ? 'jpg' : 'png'}`);
      } else if (format === 'gif') {
        const blob = await exportGif(image.element, stack, defs, getFragmentSource, width, height, duration, fps, setProgress);
        downloadBlob(blob, `stencil-${stamp}.gif`);
      } else {
        const { blob, extension } = await exportVideo(
          image.element,
          stack,
          defs,
          getFragmentSource,
          width,
          height,
          duration,
          fps,
          setProgress
        );
        downloadBlob(blob, `stencil-${stamp}.${extension}`);
      }
      setExportOpen(false);
    } catch (e) {
      console.error(e);
      setExportError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsExporting(false);
      setProgress(null);
    }
  }

  const formatLabel = FORMATS.find((f) => f.id === format)?.label ?? format;
  const downloadLabel = isExporting
    ? progress
      ? `Rendering ${progress.frame}/${progress.totalFrames}…`
      : 'Rendering…'
    : `Download ${formatLabel}`;

  return (
    <div className="glass relative z-20 flex h-14 w-full shrink-0 items-center justify-between rounded-xl px-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) setImage(f);
        }}
      />

      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-black/10 dark:border-white/15 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-sm">
          <Sparkle size={14} fill="currentColor" strokeWidth={0} />
        </div>
        <span className="text-[14px] font-semibold tracking-tight text-neutral-900 dark:text-white">Stencil</span>
        {image && (
          <>
            <span className="mx-1 text-neutral-300 dark:text-neutral-700">/</span>
            <span className="max-w-[220px] truncate text-[12.5px] text-neutral-400">{image.name}</span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        {image && (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium text-neutral-600 dark:text-neutral-300 hover:bg-black/[0.05] dark:hover:bg-white/10 transition-colors"
          >
            <ImagePlus size={13} />
            Replace
          </button>
        )}

        <button
          onClick={onToggleDark}
          title="Toggle dark mode"
          className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 dark:text-neutral-400 hover:bg-black/[0.05] dark:hover:bg-white/10 transition-colors"
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        <div className="relative" ref={popoverRef}>
          <button
            disabled={!image}
            onClick={() => setExportOpen((v) => !v)}
            className={clsx(
              'flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-medium transition-colors',
              image
                ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:opacity-90'
                : 'bg-black/[0.05] dark:bg-white/10 text-neutral-400 cursor-not-allowed'
            )}
          >
            <Download size={13} />
            Export
            <ChevronDown size={12} className={clsx('transition-transform', exportOpen && 'rotate-180')} />
          </button>

          {exportOpen && image && (
            <div className="absolute right-0 top-11 z-30 w-72 rounded-lg border border-neutral-200 bg-white p-3 shadow-glass animate-pop-in origin-top-right dark:border-neutral-800 dark:bg-[#111113] dark:shadow-glass-dark">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400 mb-2">Format</div>
              <div className="grid grid-cols-4 gap-1 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] p-1">
                {FORMATS.map((f) => {
                  const disabled = f.id === 'video' && !videoSupported;
                  return (
                    <button
                      key={f.id}
                      disabled={disabled}
                      title={disabled ? 'Video recording is not supported in this browser' : undefined}
                      onClick={() => setFormat(f.id)}
                      className={clsx(
                        'rounded-md px-1.5 py-1.5 text-[11px] font-medium transition-smooth duration-150',
                        disabled && 'cursor-not-allowed opacity-40',
                        format === f.id && !disabled
                          ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                          : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                      )}
                    >
                      {f.label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-neutral-400 mb-2">
                Resolution
              </div>
              <div className="flex flex-col gap-1.5">
                <ExportOption
                  label="Original resolution"
                  sub={`${image.width} × ${image.height}px`}
                  active={resolution === 'original'}
                  onClick={() => setResolution('original')}
                />
                <ExportOption
                  label="Custom resolution"
                  sub="Set exact width & height"
                  active={resolution === 'custom'}
                  onClick={() => setResolution('custom')}
                />
              </div>

              {resolution === 'custom' && (
                <div className="mt-2.5 flex items-center gap-2 animate-fade-in">
                  <input
                    type="number"
                    value={customW}
                    min={1}
                    onChange={(e) => setCustomW(parseInt(e.target.value) || 1)}
                    className="w-full min-w-0 rounded-md bg-black/[0.04] dark:bg-white/[0.06] px-2 py-1 text-[12px] text-neutral-700 dark:text-neutral-200 outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-white/30"
                  />
                  <span className="text-neutral-400 text-[11px]">×</span>
                  <input
                    type="number"
                    value={customH}
                    min={1}
                    onChange={(e) => setCustomH(parseInt(e.target.value) || 1)}
                    className="w-full min-w-0 rounded-md bg-black/[0.04] dark:bg-white/[0.06] px-2 py-1 text-[12px] text-neutral-700 dark:text-neutral-200 outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-white/30"
                  />
                </div>
              )}

              {format === 'jpeg' && (
                <div className="mt-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Quality</span>
                    <span className="text-[10.5px] tabular-nums text-neutral-400">{Math.round(quality * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.4}
                    max={1}
                    step={0.01}
                    value={quality}
                    onChange={(e) => setQuality(parseFloat(e.target.value))}
                    style={{ ['--fill' as string]: `${((quality - 0.4) / 0.6) * 100}%` }}
                    className="mt-1.5 w-full"
                  />
                </div>
              )}

              {isAnimated && (
                <div className="mt-3 flex flex-col gap-2.5 animate-fade-in">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Duration</span>
                      <span className="text-[10.5px] tabular-nums text-neutral-400">{duration}s</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={8}
                      step={1}
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value))}
                      style={{ ['--fill' as string]: `${((duration - 1) / 7) * 100}%` }}
                      className="mt-1.5 w-full"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400">Frame rate</span>
                    <div className="mt-1.5 grid grid-cols-3 gap-1 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] p-1">
                      {FPS_OPTIONS.map((f) => (
                        <button
                          key={f}
                          onClick={() => setFps(f)}
                          className={clsx(
                            'rounded-md px-1.5 py-1 text-[11px] font-medium transition-smooth duration-150',
                            fps === f
                              ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                              : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                          )}
                        >
                          {f} fps
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {exportError && (
                <div className="mt-3 rounded-lg bg-red-500/10 border border-red-500/20 px-2.5 py-2 text-[10.5px] leading-snug text-red-500">
                  {exportError}
                </div>
              )}

              <button
                onClick={handleExport}
                disabled={isExporting}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-neutral-900 dark:bg-white py-2 text-[12px] font-medium text-white dark:text-neutral-900 hover:opacity-90 transition-opacity disabled:opacity-60"
              >
                {downloadLabel}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ExportOption({
  label,
  sub,
  active,
  onClick,
}: {
  label: string;
  sub: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex flex-col items-start rounded-lg px-2.5 py-1.5 text-left transition-colors',
        active
          ? 'bg-neutral-100 dark:bg-white/10 ring-1 ring-neutral-300 dark:ring-white/20'
          : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
      )}
    >
      <span className="text-[12px] font-medium text-neutral-800 dark:text-neutral-100">{label}</span>
      <span className="text-[10.5px] text-neutral-400">{sub}</span>
    </button>
  );
}
