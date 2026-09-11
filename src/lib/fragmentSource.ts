import type { ShaderDef, StackItem } from '../types';
import { wrapCustomSource } from '../shaders/common';

export function getFragmentSource(_item: StackItem, def: ShaderDef): string {
  if (def.custom) return wrapCustomSource(def.fragmentShader);
  return def.fragmentShader;
}
