import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import type { ShaderDef } from '../types';
import { ensureThumbnail, getCachedThumbnail, subscribeThumbnails, thumbnailCacheKey } from '../lib/shaderThumbnails';

interface Props {
  def: ShaderDef;
  onAdd: () => void;
  onClick?: () => void;
}

export default function ShaderListItem({ def, onAdd, onClick }: Props) {
  const cacheKey = thumbnailCacheKey(def);
  const [thumbnail, setThumbnail] = useState(() => getCachedThumbnail(cacheKey));

  useEffect(() => {
    setThumbnail(getCachedThumbnail(cacheKey));
    const unsubscribe = subscribeThumbnails(() => setThumbnail(getCachedThumbnail(cacheKey)));
    ensureThumbnail(def);
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  return (
    <div
      onClick={onClick}
      className="group flex items-center gap-3 rounded-xl px-2 py-2.5 hover:bg-black/[0.035] dark:hover:bg-white/[0.05] transition-colors duration-150 cursor-pointer"
    >
      <div
        className={`h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br ${def.thumbnail} shadow-inner ring-1 ring-black/5 dark:ring-white/10`}
      >
        {thumbnail && <img src={thumbnail} alt="" draggable={false} className="h-full w-full object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13.5px] font-medium text-neutral-800 dark:text-neutral-100">{def.name}</div>
        <div className="truncate text-[11.5px] text-neutral-400 dark:text-neutral-500">{def.category}</div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAdd();
        }}
        title={`Add ${def.name} to stack`}
        className="shrink-0 flex h-6 w-6 items-center justify-center rounded-full bg-black/[0.05] dark:bg-white/10 text-neutral-500 dark:text-neutral-300 opacity-0 group-hover:opacity-100 hover:bg-accent-500 hover:text-white transition-all duration-150"
      >
        <Plus size={13} strokeWidth={2.5} />
      </button>
    </div>
  );
}
