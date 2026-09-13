import { useEffect, useState } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import Sidebar from './components/Sidebar';
import RightPanel from './components/RightPanel';
import Canvas from './components/Canvas';
import StackBar from './components/StackBar';
import TopBar from './components/TopBar';
import AuthFlow from './components/AuthFlow';
import { getCurrentUser, logout, onAuthStateChange, type AuthSession } from './lib/auth';
import { isSupabaseConfigured } from './lib/supabase';
import { RendererContext } from './context/RendererContext';
import type { GLRenderer } from './webgl/renderer';

/** Used only when running locally without Supabase credentials configured (see isSupabaseConfigured). */
const DEV_FALLBACK_SESSION: AuthSession = {
  id: 'local-dev',
  email: 'dev@localhost',
  name: 'Local Dev',
  avatar: null,
  provider: 'password',
};

export default function App() {
  const [renderer, setRenderer] = useState<GLRenderer | null>(null);
  const [session, setSession] = useState<AuthSession | null>(isSupabaseConfigured ? null : DEV_FALLBACK_SESSION);
  const [isSessionLoading, setIsSessionLoading] = useState(isSupabaseConfigured);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(() => (
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('reset-password') === '1'
  ));
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('stencil-theme') === 'dark';
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('stencil-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let active = true;
    const subscription = onAuthStateChange((event, user) => {
      if (!active) return;
      if (event === 'PASSWORD_RECOVERY') setIsPasswordRecovery(true);
      setSession(user);
      setIsSessionLoading(false);
    });

    getCurrentUser()
      .then((user) => {
        if (active) setSession(user);
      })
      .finally(() => {
        if (active) setIsSessionLoading(false);
      });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    if (!isSupabaseConfigured) return;
    await logout();
    setSession(null);
  }

  async function handlePasswordUpdated() {
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete('reset-password');
    window.history.replaceState({}, '', `${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`);
    setIsPasswordRecovery(false);
    setSession(await getCurrentUser());
  }

  if (isSupabaseConfigured && isSessionLoading) {
    return (
      <div className="auth-loading" role="status" aria-label="Loading Stencil">
        <SparkleLogo />
      </div>
    );
  }

  if (isSupabaseConfigured && isPasswordRecovery) {
    return (
      <AuthFlow
        initialView="update-password"
        onAuthenticate={setSession}
        onPasswordUpdated={() => void handlePasswordUpdated()}
      />
    );
  }

  if (isSupabaseConfigured && !session) {
    return <AuthFlow onAuthenticate={setSession} />;
  }

  return (
    <RendererContext.Provider value={{ renderer }}>
      <div className="flex h-screen w-screen flex-col gap-3 bg-neutral-50 dark:bg-[#0a0a0a] p-3">
        <TopBar
          isDark={isDark}
          onToggleDark={() => setIsDark((v) => !v)}
          userName={(session ?? DEV_FALLBACK_SESSION).name}
          onLogout={handleLogout}
        />
        <div className="flex min-h-0 flex-1 gap-3">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="min-h-0 flex-1 rounded-xl">
              <Canvas onRendererReady={setRenderer} />
            </div>
            <StackBar />
          </div>
          <RightPanel />
        </div>
      </div>
      <Analytics />
      <SpeedInsights />
    </RendererContext.Provider>
  );
}

function SparkleLogo() {
  return <span aria-hidden="true">✦</span>;
}
