import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase, type User } from '../lib/supabase';

interface AuthState {
  user: User | null;
  loading: boolean;
  signUpWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  signInWithPhone: (phone: string) => Promise<{ error?: string }>;
  verifyOtp: (phone: string, token: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

const notConfigured = { error: '请先配置 Supabase（设置 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY）' };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession()
      .then(({ data: { session } }) => setUser(session?.user ?? null))
      .catch(() => {})
      .finally(() => setLoading(false));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const s = supabase;
  const value: AuthState = {
    user,
    loading,
    signUpWithEmail: s ? (email, password) =>
      s.auth.signUp({ email, password }).then(({ error }) => error ? { error: error.message } : {})
    : async () => notConfigured,
    signInWithEmail: s ? (email, password) =>
      s.auth.signInWithPassword({ email, password }).then(({ error }) => error ? { error: error.message } : {})
    : async () => notConfigured,
    signInWithPhone: s ? (phone) =>
      s.auth.signInWithOtp({ phone }).then(({ error }) => error ? { error: error.message } : {})
    : async () => notConfigured,
    verifyOtp: s ? (phone, token) =>
      s.auth.verifyOtp({ phone, token, type: 'sms' }).then(({ error }) => error ? { error: error.message } : {})
    : async () => notConfigured,
    signOut: async () => {
      if (s) await s.auth.signOut();
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth inside AuthProvider');
  return ctx;
}
