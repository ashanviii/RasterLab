import { useState } from 'react';
import { ArrowLeft, Check, Play, Trash2 } from 'lucide-react';
import type { ShaderDef } from '../types';
import { useStore } from '../store/useStore';
import { extractCustomUniforms, wrapCustomSource } from '../shaders/common';
import { useRenderer } from '../context/RendererContext';

interface Props {
  def: ShaderDef;
  onBack: () => void;
}

export default function CustomShaderEditor({ def, onBack }: Props) {
  const updateSource = useStore((s) => s.updateCustomShaderSource);
  const syncParams = useStore((s) => s.syncCustomShaderParams);
  const updateMeta = useStore((s) => s.updateCustomShaderMeta);
  const deleteShader = useStore((s) => s.deleteCustomShader);
  const addToStack = useStore((s) => s.addShaderToStack);
  const renderer = useRenderer();

  const [source, setSource] = useState(def.fragmentShader);
  const [name, setName] = useState(def.name);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  function apply() {
    try {
      if (renderer) {
        renderer.testCompile(wrapCustomSource(source));
      }
      updateSource(def.id, source);
      const keys = extractCustomUniforms(source);
      syncParams(def.id, keys);
      if (renderer) renderer.invalidateProgram(`custom:${def.id}`);
      setError(null);
      setDirty(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <div className="flex h-full flex-col animate-fade-in">
      <div className="flex items-center gap-2 px-3 pt-3 pb-2">
        <button
          onClick={onBack}
          className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-500 hover:bg-black/[0.05] dark:hover:bg-white/10 dark:text-neutral-400"
        >
          <ArrowLeft size={15} />
        </button>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            updateMeta(def.id, e.target.value);
          }}
          className="flex-1 rounded-md bg-transparent px-1.5 py-1 text-[13px] font-medium text-neutral-800 dark:text-neutral-100 outline-none focus:bg-black/[0.04] dark:focus:bg-white/[0.06]"
        />
        <button
          onClick={() => deleteShader(def.id)}
          title="Delete custom shader"
          className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 hover:bg-red-500/10 hover:text-red-500 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>

      <div className="px-3 pb-2">
        <button
          onClick={() => addToStack(def.id)}
          className="w-full rounded-lg bg-neutral-900 dark:bg-white py-1.5 text-[12px] font-medium text-white dark:text-neutral-900 hover:opacity-90 transition-opacity shadow-sm"
        >
          Add to Stack
        </button>
      </div>

      <div className="flex-1 min-h-0 px-3">
        <textarea
          value={source}
          spellCheck={false}
          onChange={(e) => {
            setSource(e.target.value);
            setDirty(true);
          }}
          className="scroll-thin h-full w-full resize-none rounded-lg border border-neutral-200 dark:border-neutral-800 bg-black/[0.03] dark:bg-black/30 p-3 font-mono text-[11.5px] leading-relaxed text-neutral-700 dark:text-neutral-200 outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-white/30"
        />
      </div>

      {error && (
        <div className="mx-3 mt-2 max-h-24 overflow-auto rounded-lg bg-red-500/10 border border-red-500/20 px-2.5 py-2 text-[10.5px] leading-snug text-red-500 whitespace-pre-wrap scroll-thin">
          {error}
        </div>
      )}

      <div className="p-3">
        <button
          onClick={apply}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-neutral-900 dark:bg-white py-2 text-[12px] font-medium text-white dark:text-neutral-900 hover:opacity-90 transition-opacity"
        >
          {dirty ? <Play size={13} /> : <Check size={13} />}
          {dirty ? 'Run Shader' : 'Up to date'}
        </button>
      </div>
    </div>
  );
}
