import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Download, ImagePlus, Moon, Sparkle, Sun } from 'lucide-react';
import clsx from 'clsx';
import { useStore } from '../store/useStore';
import { exportRenderedImage, downloadBlob } from '../lib/export';
import { getFragmentSource } from '../lib/fragmentSource';
import { timeRef } from '../lib/timeRef';

interface Props {
  isDark: boolean;
  onToggleDark: () => void;
}

type ExportPreset = 'original' | 'canvas' | 'custom';

export default function TopBar({ isDark, onToggleDark }: Props) {
  const image = useStore((s) => s.image);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const setImage = useStore((s) => s.setImage);

  const [exportOpen, setExportOpen] = useState(false);
  const [preset, setPreset] = useState<ExportPreset>('original');
  const [customW, setCustomW] = useState(1920);
  const [customH, setCustomH] = useState(1080);
  const [isExporting, setIsExporting] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

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
    try {
      const state = useStore.getState();
      let width = image.width;
      let height = image.height;
      if (preset === 'custom') {
        width = Math.max(1, Math.round(customW));
        height = Math.max(1, Math.round(customH));
      }
      const blob = await exportRenderedImage(
        image.element,
        state.stack,
        state.allShaderDefs(),
        getFragmentSource,
        width,
        height,
        timeRef.current
      );
      downloadBlob(blob, `rasterlab-${Date.now()}.png`);
      setExportOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="glass flex h-14 w-full shrink-0 items-center justify-between rounded-2xl px-4">
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
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent-400 to-accent-600 text-white shadow-sm">
          <Sparkle size={14} fill="currentColor" strokeWidth={0} />
        </div>
        <span className="text-[14px] font-semibold tracking-tight text-neutral-900 dark:text-white">RasterLab</span>
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
            <div className="glass-strong absolute right-0 top-11 z-30 w-64 rounded-xl p-3 shadow-glass dark:shadow-glass-dark animate-pop-in origin-top-right">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-400 mb-2">
                Export PNG
              </div>
              <div className="flex flex-col gap-1.5">
                <ExportOption
                  label="Original resolution"
                  sub={`${image.width} × ${image.height}px`}
                  active={preset === 'original'}
                  onClick={() => setPreset('original')}
                />
                <ExportOption
                  label="Custom resolution"
                  sub="Set exact width & height"
                  active={preset === 'custom'}
                  onClick={() => setPreset('custom')}
                />
              </div>

              {preset === 'custom' && (
                <div className="mt-2.5 flex items-center gap-2 animate-fade-in">
                  <input
                    type="number"
                    value={customW}
                    min={1}
                    onChange={(e) => setCustomW(parseInt(e.target.value) || 1)}
                    className="w-full min-w-0 rounded-md bg-black/[0.04] dark:bg-white/[0.06] px-2 py-1 text-[12px] text-neutral-700 dark:text-neutral-200 outline-none focus:ring-1 focus:ring-accent-400"
                  />
                  <span className="text-neutral-400 text-[11px]">×</span>
                  <input
                    type="number"
                    value={customH}
                    min={1}
                    onChange={(e) => setCustomH(parseInt(e.target.value) || 1)}
                    className="w-full min-w-0 rounded-md bg-black/[0.04] dark:bg-white/[0.06] px-2 py-1 text-[12px] text-neutral-700 dark:text-neutral-200 outline-none focus:ring-1 focus:ring-accent-400"
                  />
                </div>
              )}

              <button
                onClick={handleExport}
                disabled={isExporting}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent-500 py-2 text-[12px] font-medium text-white hover:bg-accent-600 transition-colors disabled:opacity-60"
              >
                {isExporting ? 'Rendering…' : 'Download PNG'}
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
        active ? 'bg-accent-500/10 ring-1 ring-accent-400/40' : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
      )}
    >
      <span className="text-[12px] font-medium text-neutral-800 dark:text-neutral-100">{label}</span>
      <span className="text-[10.5px] text-neutral-400">{sub}</span>
    </button>
  );
}
