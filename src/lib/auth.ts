import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';

export interface AuthSession {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  provider: 'password' | 'google' | 'both';
}

export interface RegistrationResult {
  user: AuthSession | null;
  confirmationRequired: boolean;
}

function toAuthSession(user: User): AuthSession {
  const providers = user.app_metadata.providers as string[] | undefined;
  const hasGoogle = providers?.includes('google') ?? user.app_metadata.provider === 'google';
  const hasEmail = providers?.includes('email') ?? user.app_metadata.provider === 'email';
  const provider = hasGoogle && hasEmail ? 'both' : hasGoogle ? 'google' : 'password';
  const email = user.email ?? '';

  return {
    id: user.id,
    email,
    name: user.user_metadata.full_name || user.user_metadata.name || email.split('@')[0] || 'Stencil user',
    avatar: user.user_metadata.avatar_url || user.user_metadata.picture || null,
    provider,
  };
}

export async function register(input: { name: string; email: string; password: string }): Promise<RegistrationResult> {
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: { name: input.name, full_name: input.name },
      emailRedirectTo: window.location.origin,
    },
  });

  if (error) throw error;
  return {
    user: data.session && data.user ? toAuthSession(data.user) : null,
    confirmationRequired: !data.session,
  };
}

export async function login(input: { email: string; password: string }) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });
  if (error) throw error;
  return toAuthSession(data.user);
}

export async function loginWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
}

export async function recover(email: string) {
  const redirectTo = new URL(window.location.origin);
  redirectTo.searchParams.set('reset-password', '1');
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: redirectTo.toString() });
  if (error) throw error;
}

export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;
}

export async function getCurrentUser(): Promise<AuthSession | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.user) return null;
  return toAuthSession(data.session.user);
}

export function onAuthStateChange(listener: (event: AuthChangeEvent, session: AuthSession | null) => void) {
  return supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
    listener(event, session?.user ? toAuthSession(session.user) : null);
  }).data.subscription;
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
