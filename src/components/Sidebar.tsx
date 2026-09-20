import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Search, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { useStore } from '../store/useStore';
import { BUILTIN_SHADERS } from '../shaders/registry';
import { PRESETS } from '../shaders/presets';
import type { ShaderCategory } from '../types';
import ShaderListItem from './ShaderListItem';
import CustomShaderEditor from './CustomShaderEditor';

const CATEGORIES: (ShaderCategory | 'All')[] = [
  'All',
  'Distortion',
  'Color',
  'Texture',
  'Light',
  'Glass',
  'Retro',
  'ASCII',
  'DreamLight',
];

const TABS = [
  { id: 'effects', label: 'Effects' },
  { id: 'presets', label: 'Presets' },
  { id: 'custom', label: 'Custom' },
] as const;

export default function Sidebar() {
  const activeTab = useStore((s) => s.activeTab);
  const setActiveTab = useStore((s) => s.setActiveTab);
  const searchQuery = useStore((s) => s.searchQuery);
  const setSearchQuery = useStore((s) => s.setSearchQuery);
  const activeCategory = useStore((s) => s.activeCategory);
  const setActiveCategory = useStore((s) => s.setActiveCategory);
  const addShaderToStack = useStore((s) => s.addShaderToStack);
  const loadPreset = useStore((s) => s.loadPreset);
  const customShaders = useStore((s) => s.customShaders);
  const createCustomShader = useStore((s) => s.createCustomShader);

  const [editingCustomId, setEditingCustomId] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setActiveTab('effects');
        searchInputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setActiveTab]);

  const filteredShaders = useMemo(() => {
    return BUILTIN_SHADERS.filter((s) => {
      const matchesCategory = activeCategory === 'All' || s.category === activeCategory;
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const editingDef = customShaders.find((d) => d.id === editingCustomId);

  return (
    <aside className="glass flex h-full w-[300px] shrink-0 flex-col rounded-xl overflow-hidden">
      {editingDef ? (
        <CustomShaderEditor def={editingDef} onBack={() => setEditingCustomId(null)} />
      ) : (
        <>
          {/* Tabs */}
          <div className="flex items-center gap-4 border-b border-neutral-200 dark:border-neutral-800 px-3.5 pt-3 pb-2.5">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'text-[13px] transition-colors duration-150',
                  activeTab === tab.id
                    ? 'font-semibold text-neutral-900 dark:text-white'
                    : 'font-medium text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'effects' && (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="p-3.5 pb-2">
                <div className="relative">
                  <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search shaders..."
                    className="w-full rounded-lg bg-black/[0.04] dark:bg-white/[0.06] py-1.5 pl-8 pr-10 text-[12.5px] text-neutral-700 dark:text-neutral-200 placeholder:text-neutral-400 outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-white/30"
                  />
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded-md border border-neutral-200 dark:border-neutral-700 px-1.5 py-0.5 text-[10px] font-medium text-neutral-400">
                    ⌘K
                  </span>
                </div>
                <div className="mt-3.5 text-[10.5px] font-semibold uppercase tracking-wide text-neutral-400">
                  Categories
                </div>
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={clsx(
                        'whitespace-nowrap rounded-lg border px-1.5 py-1.5 text-[11px] font-medium transition-colors duration-150',
                        activeCategory === cat
                          ? 'border-neutral-300 dark:border-white/25 bg-white dark:bg-white/10 text-neutral-900 dark:text-white'
                          : 'border-transparent bg-black/[0.04] dark:bg-white/[0.06] text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div className="scroll-thin flex-1 overflow-y-auto px-2.5 pb-3">
                {filteredShaders.length === 0 ? (
                  <div className="px-3 py-8 text-center text-[12px] text-neutral-400">No shaders found.</div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {filteredShaders.map((def) => (
                      <ShaderListItem key={def.id} def={def} onAdd={() => addShaderToStack(def.id)} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'presets' && (
            <div className="scroll-thin flex-1 overflow-y-auto p-2.5">
              <div className="grid grid-cols-2 gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => loadPreset(preset)}
                    className="group flex flex-col overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white/40 dark:bg-white/[0.03] text-left hover:border-neutral-400 dark:hover:border-white/30 hover:shadow-sm transition-all duration-150"
                  >
                    <div className={`h-16 w-full bg-gradient-to-br ${preset.thumbnail}`} />
                    <div className="p-2">
                      <div className="text-[12px] font-medium text-neutral-800 dark:text-neutral-100">{preset.name}</div>
                      <div className="mt-0.5 text-[10.5px] leading-snug text-neutral-400 line-clamp-2">
                        {preset.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'custom' && (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="p-2.5">
                <button
                  onClick={() => {
                    createCustomShader();
                  }}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-neutral-900 dark:bg-white py-2 text-[12px] font-medium text-white dark:text-neutral-900 hover:opacity-90 transition-opacity shadow-sm"
                >
                  <Plus size={13} strokeWidth={2.5} />
                  New Custom Shader
                </button>
              </div>
              <div className="scroll-thin flex-1 overflow-y-auto px-2.5 pb-3">
                {customShaders.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                    <Sparkles size={20} className="text-neutral-300 dark:text-neutral-600" />
                    <p className="text-[12px] text-neutral-400 leading-snug">
                      Write your own GLSL fragment shaders and drop them straight into the stack.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {customShaders.map((def) => (
                      <ShaderListItem
                        key={def.id}
                        def={def}
                        onAdd={() => addShaderToStack(def.id)}
                        onClick={() => setEditingCustomId(def.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </aside>
  );
}
