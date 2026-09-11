import { create } from 'zustand';
import type { PresetDef, ShaderCategory, ShaderDef, StackItem } from '../types';
import { BUILTIN_SHADERS, SHADER_MAP } from '../shaders/registry';
import { CUSTOM_SHADER_TEMPLATE } from '../shaders/common';
import { removeImageBackground } from '../lib/backgroundRemoval';

export type SidebarTab = 'effects' | 'presets' | 'custom';
export type ViewMode = 'rendered' | 'original' | 'split';

interface LoadedImage {
  element: HTMLImageElement;
  width: number;
  height: number;
  name: string;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function defaultParams(def: ShaderDef): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of def.params) out[p.key] = p.default;
  return out;
}

interface RasterLabState {
  // image
  image: LoadedImage | null;
  originalImage: LoadedImage | null;
  isLoadingImage: boolean;
  isRemovingBackground: boolean;
  isBackgroundRemoved: boolean;
  backgroundRemovalError: string | null;
  setImage: (file: File) => Promise<void>;
  clearImage: () => void;
  removeBackground: () => Promise<void>;
  restoreOriginalBackground: () => void;

  // shader stack
  stack: StackItem[];
  selectedInstanceId: string | null;
  addShaderToStack: (shaderId: string) => void;
  removeStackItem: (instanceId: string) => void;
  toggleStackItem: (instanceId: string) => void;
  duplicateStackItem: (instanceId: string) => void;
  selectStackItem: (instanceId: string | null) => void;
  setStackOrder: (instanceIds: string[]) => void;
  updateParam: (instanceId: string, key: string, value: number) => void;
  resetStackItemParams: (instanceId: string) => void;
  clearStack: () => void;

  // presets
  loadPreset: (preset: PresetDef) => void;

  // custom shaders
  customShaders: ShaderDef[];
  createCustomShader: () => void;
  updateCustomShaderSource: (shaderId: string, source: string) => void;
  syncCustomShaderParams: (shaderId: string, keys: string[]) => void;
  updateCustomShaderMeta: (shaderId: string, name: string) => void;
  deleteCustomShader: (shaderId: string) => void;

  // sidebar / browsing
  activeTab: SidebarTab;
  setActiveTab: (tab: SidebarTab) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeCategory: ShaderCategory | 'All';
  setActiveCategory: (c: ShaderCategory | 'All') => void;

  // viewer
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;
  splitPosition: number;
  setSplitPosition: (n: number) => void;
  zoom: number;
  setZoom: (z: number | ((z: number) => number)) => void;

  allShaderDefs: () => Record<string, ShaderDef>;
  getSelectedItem: () => StackItem | null;
}

export const useStore = create<RasterLabState>((set, get) => ({
  image: null,
  originalImage: null,
  isLoadingImage: false,
  isRemovingBackground: false,
  isBackgroundRemoved: false,
  backgroundRemovalError: null,

  setImage: async (file: File) => {
    set({ isLoadingImage: true });
    const url = URL.createObjectURL(file);
    try {
      const element = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
      });
      const loaded: LoadedImage = { element, width: element.naturalWidth, height: element.naturalHeight, name: file.name };
      set({
        image: loaded,
        originalImage: loaded,
        isLoadingImage: false,
        isBackgroundRemoved: false,
        backgroundRemovalError: null,
      });
    } catch {
      set({ isLoadingImage: false });
    }
  },

  clearImage: () => set({ image: null, originalImage: null, isBackgroundRemoved: false }),

  removeBackground: async () => {
    const state = get();
    if (!state.image || state.isRemovingBackground) return;
    set({ isRemovingBackground: true, backgroundRemovalError: null });
    try {
      const blob = await removeImageBackground(state.image.element.src);
      const url = URL.createObjectURL(blob);
      const element = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
      });
      set({
        image: { element, width: element.naturalWidth, height: element.naturalHeight, name: state.image.name },
        isRemovingBackground: false,
        isBackgroundRemoved: true,
      });
    } catch (e) {
      set({ isRemovingBackground: false, backgroundRemovalError: e instanceof Error ? e.message : String(e) });
    }
  },

  restoreOriginalBackground: () => {
    const state = get();
    if (!state.originalImage) return;
    set({ image: state.originalImage, isBackgroundRemoved: false });
  },

  stack: [],
  selectedInstanceId: null,

  addShaderToStack: (shaderId) => {
    const def = get().allShaderDefs()[shaderId];
    if (!def) return;
    const item: StackItem = { instanceId: uid(), shaderId, enabled: true, params: defaultParams(def) };
    set((s) => ({ stack: [...s.stack, item], selectedInstanceId: item.instanceId }));
  },

  removeStackItem: (instanceId) =>
    set((s) => {
      const stack = s.stack.filter((i) => i.instanceId !== instanceId);
      const selectedInstanceId = s.selectedInstanceId === instanceId ? null : s.selectedInstanceId;
      return { stack, selectedInstanceId };
    }),

  toggleStackItem: (instanceId) =>
    set((s) => ({
      stack: s.stack.map((i) => (i.instanceId === instanceId ? { ...i, enabled: !i.enabled } : i)),
    })),

  duplicateStackItem: (instanceId) =>
    set((s) => {
      const idx = s.stack.findIndex((i) => i.instanceId === instanceId);
      if (idx === -1) return s;
      const clone: StackItem = { ...s.stack[idx], instanceId: uid(), params: { ...s.stack[idx].params } };
      const stack = [...s.stack];
      stack.splice(idx + 1, 0, clone);
      return { stack, selectedInstanceId: clone.instanceId };
    }),

  selectStackItem: (instanceId) => set({ selectedInstanceId: instanceId }),

  setStackOrder: (instanceIds) =>
    set((s) => {
      const byId = new Map(s.stack.map((i) => [i.instanceId, i]));
      const stack = instanceIds.map((id) => byId.get(id)!).filter(Boolean);
      return { stack };
    }),

  updateParam: (instanceId, key, value) =>
    set((s) => ({
      stack: s.stack.map((i) =>
        i.instanceId === instanceId ? { ...i, params: { ...i.params, [key]: value } } : i
      ),
    })),

  resetStackItemParams: (instanceId) =>
    set((s) => {
      const item = s.stack.find((i) => i.instanceId === instanceId);
      if (!item) return s;
      const def = get().allShaderDefs()[item.shaderId];
      if (!def) return s;
      return {
        stack: s.stack.map((i) => (i.instanceId === instanceId ? { ...i, params: defaultParams(def) } : i)),
      };
    }),

  clearStack: () => set({ stack: [], selectedInstanceId: null }),

  loadPreset: (preset) => {
    const defs = get().allShaderDefs();
    const stack: StackItem[] = preset.stack
      .filter((s) => defs[s.shaderId])
      .map((s) => ({
        instanceId: uid(),
        shaderId: s.shaderId,
        enabled: true,
        params: { ...defaultParams(defs[s.shaderId]), ...s.params },
      }));
    set({ stack, selectedInstanceId: stack.length ? stack[0].instanceId : null, activeTab: 'effects' });
  },

  customShaders: [],

  createCustomShader: () => {
    const id = `custom-${uid()}`;
    const def: ShaderDef = {
      id,
      name: 'Custom Shader',
      category: 'Custom',
      description: 'User-defined GLSL fragment shader.',
      thumbnail: 'from-accent-300 via-accent-500 to-accent-700',
      fragmentShader: CUSTOM_SHADER_TEMPLATE,
      custom: true,
      params: [{ key: 'amount', label: 'Amount', type: 'float', default: 0.5, min: 0, max: 1, step: 0.01 }],
    };
    set((s) => ({ customShaders: [...s.customShaders, def] }));
  },

  updateCustomShaderSource: (shaderId, source) =>
    set((s) => ({
      customShaders: s.customShaders.map((d) => (d.id === shaderId ? { ...d, fragmentShader: source } : d)),
    })),

  syncCustomShaderParams: (shaderId, keys) =>
    set((s) => {
      const def = s.customShaders.find((d) => d.id === shaderId);
      if (!def) return s;
      const existing = new Map(def.params.map((p) => [p.key, p]));
      const params = keys.map(
        (key) =>
          existing.get(key) ?? {
            key,
            label: key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()),
            type: 'float' as const,
            default: 0.5,
            min: 0,
            max: 1,
            step: 0.01,
          }
      );
      const customShaders = s.customShaders.map((d) => (d.id === shaderId ? { ...d, params } : d));
      const stack = s.stack.map((i) => {
        if (i.shaderId !== shaderId) return i;
        const merged = { ...i.params };
        for (const p of params) if (merged[p.key] === undefined) merged[p.key] = p.default;
        return { ...i, params: merged };
      });
      return { customShaders, stack };
    }),

  updateCustomShaderMeta: (shaderId, name) =>
    set((s) => ({
      customShaders: s.customShaders.map((d) => (d.id === shaderId ? { ...d, name } : d)),
    })),

  deleteCustomShader: (shaderId) =>
    set((s) => ({
      customShaders: s.customShaders.filter((d) => d.id !== shaderId),
      stack: s.stack.filter((i) => i.shaderId !== shaderId),
    })),

  activeTab: 'effects',
  setActiveTab: (tab) => set({ activeTab: tab }),
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
  activeCategory: 'All',
  setActiveCategory: (c) => set({ activeCategory: c }),

  viewMode: 'split',
  setViewMode: (m) => set({ viewMode: m }),
  splitPosition: 50,
  setSplitPosition: (n) => set({ splitPosition: n }),
  zoom: 1,
  setZoom: (z) => set((s) => ({ zoom: typeof z === 'function' ? z(s.zoom) : z })),

  allShaderDefs: () => ({ ...SHADER_MAP, ...Object.fromEntries(get().customShaders.map((d) => [d.id, d])) }),
  getSelectedItem: () => get().stack.find((i) => i.instanceId === get().selectedInstanceId) ?? null,
}));

export { BUILTIN_SHADERS };
