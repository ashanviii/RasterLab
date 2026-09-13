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
      onClick={onClick ?? onAdd}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-white/[0.02] transition-all duration-150 hover:border-neutral-300 dark:hover:border-white/20 hover:shadow-sm"
    >
      <div className={`relative aspect-square w-full overflow-hidden bg-gradient-to-br ${def.thumbnail}`}>
        {thumbnail && <img src={thumbnail} alt="" draggable={false} className="h-full w-full object-cover" />}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAdd();
          }}
          title={`Add ${def.name} to stack`}
          className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 dark:bg-neutral-900/80 text-neutral-700 dark:text-neutral-200 opacity-0 shadow-sm ring-1 ring-black/5 dark:ring-white/10 transition-all duration-150 group-hover:opacity-100 hover:!bg-neutral-900 hover:!text-white dark:hover:!bg-white dark:hover:!text-neutral-900"
        >
          <Plus size={13} strokeWidth={2.5} />
        </button>
      </div>
      <div className="px-2 py-1.5">
        <div className="truncate text-[12px] font-medium text-neutral-800 dark:text-neutral-100">{def.name}</div>
        <div className="truncate text-[10.5px] text-neutral-400 dark:text-neutral-500">{def.category}</div>
      </div>
    </div>
  );
}
