import { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import RightPanel from './components/RightPanel';
import Canvas from './components/Canvas';
import StackBar from './components/StackBar';
import TopBar from './components/TopBar';
import { RendererContext } from './context/RendererContext';
import type { GLRenderer } from './webgl/renderer';

export default function App() {
  const [renderer, setRenderer] = useState<GLRenderer | null>(null);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('rasterlab-theme') === 'dark';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('rasterlab-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <RendererContext.Provider value={{ renderer }}>
      <div className="flex h-screen w-screen flex-col gap-3 bg-neutral-100 dark:bg-[#0b0b0e] p-3">
        <TopBar isDark={isDark} onToggleDark={() => setIsDark((v) => !v)} />
        <div className="flex min-h-0 flex-1 gap-3">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="min-h-0 flex-1 rounded-2xl">
              <Canvas onRendererReady={setRenderer} />
            </div>
            <StackBar />
          </div>
          <RightPanel />
        </div>
      </div>
    </RendererContext.Provider>
  );
}
