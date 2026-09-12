import { useEffect, useState } from 'react';
import type { ParamDef } from '../types';
import clsx from 'clsx';
import ColorWheelControl from './ColorWheel';

interface Props {
  def: ParamDef;
  value: number;
  onChange: (v: number) => void;
}

export default function ParamControl({ def, value, onChange }: Props) {
  if (def.type === 'color') {
    return <ColorWheelControl def={def} value={value} onChange={onChange} />;
  }

  if (def.type === 'select') {
    const options = def.options ?? [];

    if (options.length > 4) {
      return (
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">{def.label}</span>
          <select
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="rounded-md bg-black/[0.04] dark:bg-white/[0.06] px-2 py-1 text-[11px] text-neutral-700 dark:text-neutral-200 outline-none focus:ring-1 focus:ring-accent-400"
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">{def.label}</span>
        <div className="grid grid-flow-col auto-cols-fr gap-1 rounded-lg bg-black/[0.04] dark:bg-white/[0.06] p-1">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={clsx(
                'rounded-md px-2 py-1 text-[11px] font-medium transition-smooth duration-150',
                value === opt.value
                  ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (def.type === 'bool') {
    const on = value > 0.5;
    return (
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">{def.label}</span>
        <button
          onClick={() => onChange(on ? 0 : 1)}
          className={clsx(
            'relative h-[22px] w-[38px] rounded-full transition-colors duration-200',
            on ? 'bg-accent-500' : 'bg-black/15 dark:bg-white/15'
          )}
        >
          <span
            className={clsx(
              'absolute top-[2px] h-[18px] w-[18px] rounded-full bg-white shadow-sm transition-transform duration-200',
              on ? 'translate-x-[18px]' : 'translate-x-[2px]'
            )}
          />
        </button>
      </div>
    );
  }

  return <SliderControl def={def} value={value} onChange={onChange} />;
}

function SliderControl({ def, value, onChange }: Props) {
  const min = def.min ?? 0;
  const max = def.max ?? 1;
  const step = def.step ?? 0.01;
  const [text, setText] = useState(formatNumber(value));

  useEffect(() => setText(formatNumber(value)), [value]);

  const pct = ((clampVal(value, min, max) - min) / (max - min)) * 100;

  function commitText() {
    const n = parseFloat(text);
    if (!Number.isNaN(n)) onChange(clampVal(n, min, max));
    else setText(formatNumber(value));
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">{def.label}</span>
        <div className="flex items-center gap-0.5">
          <input
            type="number"
            value={text}
            step={step}
            min={min}
            max={max}
            onChange={(e) => setText(e.target.value)}
            onBlur={commitText}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            }}
            className="w-14 rounded-md bg-black/[0.04] dark:bg-white/[0.06] px-1.5 py-0.5 text-right text-[11px] tabular-nums text-neutral-700 dark:text-neutral-200 outline-none focus:ring-1 focus:ring-accent-400"
          />
          {def.unit && <span className="text-[10px] text-neutral-400 w-3">{def.unit}</span>}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ ['--fill' as string]: `${pct}%` }}
      />
    </div>
  );
}

function formatNumber(n: number) {
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

function clampVal(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}
