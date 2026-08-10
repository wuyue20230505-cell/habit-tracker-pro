import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase, type User } from '../lib/supabase';

interface AuthState {
  user: User | null;
  loading: boolean;
  signUpWithEmail: (email: string, password: string, username?: string, avatar?: string) => Promise<{ error?: string }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error?: string }>;
  getUsername: () => string;
  getAvatar: () => string;
  signInWithPhone: (phone: string) => Promise<{ error?: string }>;
  verifyOtp: (phone: string, token: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ error?: string }>;
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
    signUpWithEmail: s ? (email, password, username, avatar) =>
      s.auth.signUp({ email, password, options: { data: { username: username || email.split('@')[0], avatar: avatar || '🏃' } } }).then(({ error }) => error ? { error: error.message } : {})
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
    getUsername: () => user?.user_metadata?.username || user?.email?.split('@')[0] || '用户',
    getAvatar: () => user?.user_metadata?.avatar || '🏃',
    signOut: async () => {
      if (s) await s.auth.signOut();
      setUser(null);
    },
    // 删除账号：调用云端 Edge Function（service role 删除 auth 用户，业务数据级联清除）
    deleteAccount: async () => {
      if (!s) return { error: '请先配置 Supabase' };
      if (!user) return { error: '请先登录' };

      // 网络层失败时自动重试一次（中国网络访问 supabase.co 偶发不稳定）
      let result: { error?: string } = {};
      for (let attempt = 0; attempt < 2; attempt++) {
        const { error } = await s.functions.invoke('delete-account', { body: { userId: user.id } });
        if (!error) { result = {}; break; }
        const ctx = (error as { context?: { status?: number; data?: { error?: string } } })?.context;
        const status = ctx?.status;
        if (status === 401) { result = { error: '登录已过期，请重新登录后再试' }; break; }
        if (status === 404) { result = { error: '云端删除服务未部署，请先在 Supabase 部署 delete-account 函数' }; break; }
        if (status === 500) { result = { error: `删除失败：${ctx?.data?.error || '云端服务异常'}` }; break; }
        // 网络层错误（无状态码）：最后尝试仍失败才提示
        result = { error: '删除失败：网络连接服务器不稳定，请检查网络后重试' };
      }
      if (result.error) return result;
      // 清除本地数据
      try {
        Object.keys(localStorage).forEach((k) => {
          if (k.startsWith('habit-')) localStorage.removeItem(k);
        });
      } catch { /* 忽略存储错误 */ }
      await s.auth.signOut();
      setUser(null);
      return {};
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth inside AuthProvider');
  return ctx;
}
