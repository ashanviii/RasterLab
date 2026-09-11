import { createContext, useContext } from 'react';
import type { GLRenderer } from '../webgl/renderer';

export const RendererContext = createContext<{ renderer: GLRenderer | null }>({ renderer: null });

export function useRenderer() {
  return useContext(RendererContext).renderer;
}
