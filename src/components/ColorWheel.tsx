import { useEffect, useRef, useState } from 'react';
import { hsvToRgb, numberToHex, packRGB, rgbToHsv, unpackRGB } from '../lib/color';
import type { ParamDef } from '../types';

interface Props {
  def: ParamDef;
  value: number;
  onChange: (v: number) => void;
}

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

export default function ColorWheelControl({ def, value, onChange }: Props) {
  const { h, s, v } = rgbToHsv(unpackRGB(value));
  const ringRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<'ring' | 'box' | null>(null);

  function fromRing(clientX: number, clientY: number) {
    const rect = ringRef.current!.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const angle = Math.atan2(clientY - cy, clientX - cx) * (180 / Math.PI);
    const hue = (angle + 360) % 360;
    const rgb = hsvToRgb(hue, s, v);
    onChange(packRGB(rgb.r, rgb.g, rgb.b));
  }

  function fromBox(clientX: number, clientY: number) {
    const rect = boxRef.current!.getBoundingClientRect();
    const x = clamp01((clientX - rect.left) / rect.width);
    const y = clamp01((clientY - rect.top) / rect.height);
    const rgb = hsvToRgb(h, x, 1 - y);
    onChange(packRGB(rgb.r, rgb.g, rgb.b));
  }

  useEffect(() => {
    if (!dragging) return;
    const move = (e: PointerEvent) => {
      if (dragging === 'ring') fromRing(e.clientX, e.clientY);
      else fromBox(e.clientX, e.clientY);
    };
    const up = () => setDragging(null);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging, h, s, v]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">{def.label}</span>
        <div
          className="h-4 w-4 rounded-full ring-1 ring-black/10 dark:ring-white/20"
          style={{ background: numberToHex(value) }}
        />
      </div>
      <div className="flex items-center gap-3">
        <div
          ref={ringRef}
          onPointerDown={(e) => {
            setDragging('ring');
            fromRing(e.clientX, e.clientY);
          }}
          className="relative h-14 w-14 shrink-0 cursor-pointer rounded-full ring-1 ring-black/10 dark:ring-white/10"
          style={{ background: 'conic-gradient(from 90deg, red, yellow, lime, cyan, blue, magenta, red)' }}
        >
          <div
            className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white shadow"
            style={{
              left: `${50 + 42 * Math.cos((h * Math.PI) / 180)}%`,
              top: `${50 + 42 * Math.sin((h * Math.PI) / 180)}%`,
              background: `hsl(${h}, 100%, 50%)`,
            }}
          />
        </div>
        <div
          ref={boxRef}
          onPointerDown={(e) => {
            setDragging('box');
            fromBox(e.clientX, e.clientY);
          }}
          className="relative h-14 flex-1 cursor-pointer rounded-lg ring-1 ring-black/10 dark:ring-white/10"
          style={{
            background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent), hsl(${h}, 100%, 50%)`,
          }}
        >
          <div
            className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
            style={{ left: `${s * 100}%`, top: `${(1 - v) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
