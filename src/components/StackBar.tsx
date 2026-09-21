import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useState } from 'react';
import clsx from 'clsx';
import { Check, Copy, GripVertical, Layers, RotateCcw, Save, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import type { StackItem } from '../types';

export default function StackBar() {
  const stack = useStore((s) => s.stack);
  const setStackOrder = useStore((s) => s.setStackOrder);
  const clearStack = useStore((s) => s.clearStack);
  const saveStackAsPreset = useStore((s) => s.saveStackAsPreset);
  const setActiveTab = useStore((s) => s.setActiveTab);

  const [isNamingPreset, setIsNamingPreset] = useState(false);
  const [presetName, setPresetName] = useState('');

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = stack.map((i) => i.instanceId);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    const next = [...ids];
    next.splice(oldIndex, 1);
    next.splice(newIndex, 0, String(active.id));
    setStackOrder(next);
  }

  function commitSavePreset() {
    saveStackAsPreset(presetName);
    setIsNamingPreset(false);
    setPresetName('');
    setActiveTab('presets');
  }

  return (
    <div className="glass flex h-[210px] w-full flex-col rounded-xl overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-3.5 py-2.5 border-b border-neutral-200 dark:border-neutral-800">
        {isNamingPreset ? (
          <div className="flex flex-1 items-center gap-1.5">
            <input
              autoFocus
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitSavePreset();
                if (e.key === 'Escape') setIsNamingPreset(false);
              }}
              placeholder="Preset name..."
              className="min-w-0 flex-1 rounded-md bg-black/[0.04] dark:bg-white/[0.06] px-2 py-1 text-[12px] text-neutral-800 dark:text-neutral-100 placeholder:text-neutral-400 outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-white/30"
            />
            <button
              onClick={commitSavePreset}
              title="Save preset"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-neutral-500 hover:bg-black/[0.06] hover:text-neutral-900 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <Check size={13} />
            </button>
            <button
              onClick={() => setIsNamingPreset(false)}
              title="Cancel"
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-neutral-400 hover:bg-black/[0.06] hover:text-neutral-700 dark:hover:bg-white/10 dark:hover:text-neutral-200"
            >
              <X size={13} />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-neutral-400">
              <Layers size={12} />
              Shader Stack
              {stack.length > 0 && (
                <span className="rounded-full bg-black/[0.06] dark:bg-white/10 px-1.5 py-0.5 text-[10px] font-medium normal-case text-neutral-500 dark:text-neutral-400">
                  {stack.length}
                </span>
              )}
            </div>
            {stack.length > 0 && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsNamingPreset(true)}
                  title="Save this stack as a preset"
                  className="flex items-center gap-1 text-[10.5px] font-medium text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-100 transition-colors"
                >
                  <Save size={11} />
                  Save as Preset
                </button>
                <button
                  onClick={clearStack}
                  className="text-[10.5px] font-medium text-neutral-400 hover:text-red-500 transition-colors"
                >
                  Clear all
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {stack.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-6 text-center">
          <p className="text-[12px] leading-snug text-neutral-400">
            Add shaders from the left panel to build your stack. Effects render top to bottom.
          </p>
        </div>
      ) : (
        <div className="scroll-thin flex-1 overflow-y-auto p-2">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={stack.map((i) => i.instanceId)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-1">
                {stack.map((item) => (
                  <StackRow key={item.instanceId} item={item} />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}
    </div>
  );
}

function StackRow({ item }: { item: StackItem }) {
  const allDefs = useStore((s) => s.allShaderDefs());
  const selectedInstanceId = useStore((s) => s.selectedInstanceId);
  const selectStackItem = useStore((s) => s.selectStackItem);
  const toggleStackItem = useStore((s) => s.toggleStackItem);
  const duplicateStackItem = useStore((s) => s.duplicateStackItem);
  const removeStackItem = useStore((s) => s.removeStackItem);
  const resetStackItemParams = useStore((s) => s.resetStackItemParams);

  const def = allDefs[item.shaderId];
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.instanceId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (!def) return null;
  const selected = selectedInstanceId === item.instanceId;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={() => selectStackItem(item.instanceId)}
      className={clsx(
        'group flex items-center gap-2 rounded-lg px-2 py-2 cursor-pointer transition-colors duration-150 border',
        isDragging && 'z-10 shadow-lg',
        selected
          ? 'bg-neutral-100 dark:bg-white/[0.08] border-neutral-300 dark:border-white/20'
          : 'border-transparent hover:bg-black/[0.03] dark:hover:bg-white/[0.05]',
        !item.enabled && 'opacity-45'
      )}
    >
      <button
        {...attributes}
        {...listeners}
        onClick={(e) => e.stopPropagation()}
        className="shrink-0 flex h-6 w-5 cursor-grab active:cursor-grabbing items-center justify-center text-neutral-300 dark:text-neutral-600 hover:text-neutral-500 dark:hover:text-neutral-400"
      >
        <GripVertical size={14} />
      </button>

      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleStackItem(item.instanceId);
        }}
        title={item.enabled ? 'Disable' : 'Enable'}
        className="shrink-0 flex h-6 w-6 items-center justify-center"
      >
        <span
          className={clsx(
            'block h-2 w-2 rounded-full transition-colors',
            item.enabled ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-300 dark:bg-neutral-600'
          )}
        />
      </button>

      <div className={`h-6 w-6 shrink-0 rounded-md bg-gradient-to-br ${def.thumbnail} ring-1 ring-black/5 dark:ring-white/10`} />

      <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-neutral-800 dark:text-neutral-100">
        {def.name}
      </span>

      <div className="flex shrink-0 items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <RowIconButton title="Reset settings" onClick={() => resetStackItemParams(item.instanceId)}>
          <RotateCcw size={12} />
        </RowIconButton>
        <RowIconButton title="Duplicate" onClick={() => duplicateStackItem(item.instanceId)}>
          <Copy size={12} />
        </RowIconButton>
        <RowIconButton title="Delete" onClick={() => removeStackItem(item.instanceId)} danger>
          <X size={13} />
        </RowIconButton>
      </div>
    </div>
  );
}

function RowIconButton({
  children,
  onClick,
  title,
  danger,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  danger?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={clsx(
        'flex h-6 w-6 items-center justify-center rounded-md text-neutral-400 transition-colors',
        danger ? 'hover:bg-red-500/10 hover:text-red-500' : 'hover:bg-black/[0.06] dark:hover:bg-white/10 hover:text-neutral-700 dark:hover:text-neutral-200'
      )}
    >
      {children}
    </button>
  );
}
