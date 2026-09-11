import { useMemo, useState } from 'react';
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

  const filteredShaders = useMemo(() => {
    return BUILTIN_SHADERS.filter((s) => {
      const matchesCategory = activeCategory === 'All' || s.category === activeCategory;
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const editingDef = customShaders.find((d) => d.id === editingCustomId);

  return (
    <aside className="glass flex h-full w-[300px] shrink-0 flex-col rounded-2xl overflow-hidden">
      {editingDef ? (
        <CustomShaderEditor def={editingDef} onBack={() => setEditingCustomId(null)} />
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-1 p-2.5 pb-0">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'flex-1 rounded-lg py-1.5 text-[12px] font-medium transition-colors duration-150',
                  activeTab === tab.id
                    ? 'bg-black/[0.06] dark:bg-white/10 text-neutral-900 dark:text-white'
                    : 'text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'effects' && (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="p-2.5 pb-2">
                <div className="relative">
                  <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search shaders"
                    className="w-full rounded-lg bg-black/[0.04] dark:bg-white/[0.06] py-1.5 pl-8 pr-2.5 text-[12.5px] text-neutral-700 dark:text-neutral-200 placeholder:text-neutral-400 outline-none focus:ring-1 focus:ring-accent-400"
                  />
                </div>
                <div className="scroll-thin mt-2 flex gap-1 overflow-x-auto pb-1">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={clsx(
                        'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors duration-150',
                        activeCategory === cat
                          ? 'bg-accent-500 text-white'
                          : 'bg-black/[0.04] dark:bg-white/[0.06] text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div className="scroll-thin flex-1 overflow-y-auto px-2 pb-3">
                {filteredShaders.length === 0 ? (
                  <div className="px-3 py-8 text-center text-[12px] text-neutral-400">No shaders found.</div>
                ) : (
                  filteredShaders.map((def) => (
                    <ShaderListItem key={def.id} def={def} onAdd={() => addShaderToStack(def.id)} />
                  ))
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
                    className="group flex flex-col overflow-hidden rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-white/40 dark:bg-white/[0.03] text-left hover:border-accent-400/50 hover:shadow-md transition-all duration-150"
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
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent-500 py-2 text-[12px] font-medium text-white hover:bg-accent-600 transition-colors shadow-sm"
                >
                  <Plus size={13} strokeWidth={2.5} />
                  New Custom Shader
                </button>
              </div>
              <div className="scroll-thin flex-1 overflow-y-auto px-2 pb-3">
                {customShaders.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                    <Sparkles size={20} className="text-neutral-300 dark:text-neutral-600" />
                    <p className="text-[12px] text-neutral-400 leading-snug">
                      Write your own GLSL fragment shaders and drop them straight into the stack.
                    </p>
                  </div>
                ) : (
                  customShaders.map((def) => (
                    <ShaderListItem
                      key={def.id}
                      def={def}
                      onAdd={() => addShaderToStack(def.id)}
                      onClick={() => setEditingCustomId(def.id)}
                    />
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}
    </aside>
  );
}
