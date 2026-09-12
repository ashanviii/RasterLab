import { useState } from 'react';
import { ChevronDown, Gauge, Palette, Play, RotateCcw, SlidersHorizontal, Type } from 'lucide-react';
import clsx from 'clsx';
import { useStore } from '../store/useStore';
import ParamControl from './ParamControl';
import type { ParamDef } from '../types';

const GROUP_ICONS: Record<string, typeof Type> = {
  Effect: SlidersHorizontal,
  Intensity: Gauge,
  Animation: Play,
  Color: Palette,
};

function groupIcon(name: string) {
  return GROUP_ICONS[name] ?? Type;
}

/** Every param belongs to a group: its own, or an automatic Effect/Advanced bucket. */
function effectiveGroup(p: ParamDef): string {
  return p.group ?? (p.advanced ? 'Advanced' : 'Effect');
}

export default function RightPanel() {
  const stack = useStore((s) => s.stack);
  const selectedInstanceId = useStore((s) => s.selectedInstanceId);
  const updateParam = useStore((s) => s.updateParam);
  const resetParams = useStore((s) => s.resetStackItemParams);
  const allDefs = useStore((s) => s.allShaderDefs());
  const [advancedOpen, setAdvancedOpen] = useState(true);

  const item = stack.find((i) => i.instanceId === selectedInstanceId);
  const def = item ? allDefs[item.shaderId] : null;

  const groupNames: string[] = [];
  if (def) {
    for (const p of def.params) {
      const g = effectiveGroup(p);
      if (!groupNames.includes(g)) groupNames.push(g);
    }
  }
  const groupedParams = (name: string): ParamDef[] => def?.params.filter((p) => effectiveGroup(p) === name) ?? [];

  return (
    <aside className="glass flex h-full w-[300px] shrink-0 flex-col rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-3.5 pt-3.5 pb-2">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
          <SlidersHorizontal size={12} />
          Settings
        </div>
        {item && (
          <button
            onClick={() => resetParams(item.instanceId)}
            title="Reset to defaults"
            className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[10.5px] font-medium text-neutral-400 hover:bg-black/[0.05] dark:hover:bg-white/10 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
          >
            <RotateCcw size={11} />
            Reset
          </button>
        )}
      </div>

      {!item || !def ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
          <div className="h-10 w-10 rounded-full bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center">
            <SlidersHorizontal size={16} className="text-neutral-300 dark:text-neutral-600" />
          </div>
          <p className="text-[12px] leading-snug text-neutral-400">
            Select a shader in the stack below to edit its parameters.
          </p>
        </div>
      ) : (
        <div className="scroll-thin flex-1 overflow-y-auto px-3.5 pb-4">
          <div className="mb-3.5">
            <div className="text-[14px] font-semibold text-neutral-900 dark:text-white">{def.name}</div>
            <p className="mt-0.5 text-[11.5px] leading-snug text-neutral-400">{def.description}</p>
          </div>

          <div className="flex flex-col gap-5">
            {groupNames.map((name) =>
              name === 'Advanced' ? (
                <div key={name}>
                  <button
                    onClick={() => setAdvancedOpen((v) => !v)}
                    className="flex w-full items-center justify-between rounded-lg py-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                  >
                    Advanced
                    <ChevronDown
                      size={13}
                      className={clsx('transition-transform duration-200', advancedOpen && 'rotate-180')}
                    />
                  </button>
                  {advancedOpen && (
                    <div className="mt-2.5 flex flex-col gap-4 animate-fade-in">
                      {groupedParams(name).map((p) => (
                        <ParamControl
                          key={p.key}
                          def={p}
                          value={item.params[p.key] ?? p.default}
                          onChange={(v) => updateParam(item.instanceId, p.key, v)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div key={name}>
                  <SectionHeader label={name} icon={groupIcon(name)} />
                  <div className="mt-2.5 flex flex-col gap-4">
                    {groupedParams(name).map((p) => (
                      <ParamControl
                        key={p.key}
                        def={p}
                        value={item.params[p.key] ?? p.default}
                        onChange={(v) => updateParam(item.instanceId, p.key, v)}
                      />
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </aside>
  );
}

function SectionHeader({ label, icon: Icon }: { label: string; icon: typeof Type }) {
  return (
    <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-accent-600 dark:text-accent-400">
      <Icon size={11} />
      {label}
    </div>
  );
}
