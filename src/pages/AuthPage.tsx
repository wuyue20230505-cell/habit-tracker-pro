import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

type Tab = 'login' | 'register' | 'phone';

export default function AuthPage() {
  const { signInWithEmail, signUpWithEmail, signInWithPhone, verifyOtp } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setMsg('');
    if (!email || !password) { setError('请填写邮箱和密码'); return; }
    setLoading(true);
    const res = await signInWithEmail(email, password);
    setLoading(false);
    if (res.error) setError(res.error);
    else navigate('/checkin');
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setMsg('');
    if (!email || !password || password.length < 6) { setError('密码至少6位'); return; }
    setLoading(true);
    const res = await signUpWithEmail(email, password);
    setLoading(false);
    if (res.error) setError(res.error);
    else setMsg('注册成功！请查看邮箱确认链接，然后登录。');
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setMsg('');
    if (!phone) { setError('请输入手机号'); return; }
    setLoading(true);
    const res = await signInWithPhone(phone);
    setLoading(false);
    if (res.error) setError(res.error);
    else { setShowOtp(true); setMsg('验证码已发送'); }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await verifyOtp(phone, otp);
    setLoading(false);
    if (res.error) setError(res.error);
    else navigate('/checkin');
  };

  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="bg-white/15 dark:bg-black/20 backdrop-blur-md rounded-3xl p-8 w-full max-w-sm shadow-sm">
        <div className="text-center mb-6">
          <span className="text-4xl">🍅</span>
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200 mt-2">习惯追踪</h1>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1 mb-6">
          {[{ k: 'login' as Tab, l: '登录' }, { k: 'register' as Tab, l: '注册' }, { k: 'phone' as Tab, l: '手机' }].map(({ k, l }) => (
            <button key={k} onClick={() => { setTab(k); setError(''); setMsg(''); setShowOtp(false); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium ${tab === k ? 'bg-white dark:bg-gray-600 shadow-sm text-indigo-500' : 'text-gray-500'}`}>
              {l}
            </button>
          ))}
        </div>

        {error && <p className="text-red-500 text-sm mb-3 text-center bg-red-50 dark:bg-red-900/20 py-2 rounded-lg">{error}</p>}
        {msg && <p className="text-emerald-500 text-sm mb-3 text-center bg-emerald-50 dark:bg-emerald-900/20 py-2 rounded-lg">{msg}</p>}

        {tab === 'phone' && !showOtp ? (
          <form onSubmit={handlePhoneLogin} className="space-y-4">
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="手机号（如 +8613800138000）" type="tel" className="w-full px-4 py-3 rounded-xl border dark:border-gray-600 bg-white/20 dark:bg-black/30 text-sm" />
            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-indigo-500 text-white font-semibold text-sm hover:bg-indigo-600 disabled:opacity-50">
              {loading ? '发送中...' : '发送验证码'}
            </button>
          </form>
        ) : tab === 'phone' && showOtp ? (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <input value={otp} onChange={e => setOtp(e.target.value)} placeholder="输入6位验证码" className="w-full px-4 py-3 rounded-xl border dark:border-gray-600 bg-white/20 dark:bg-black/30 text-sm text-center text-lg tracking-widest" maxLength={6} />
            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-indigo-500 text-white font-semibold text-sm hover:bg-indigo-600 disabled:opacity-50">
              {loading ? '验证中...' : '验证登录'}
            </button>
            <button type="button" onClick={() => setShowOtp(false)} className="w-full text-sm text-gray-400">← 重发验证码</button>
          </form>
        ) : (
          <form onSubmit={tab === 'login' ? handleEmailLogin : handleRegister} className="space-y-4">
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="邮箱地址" type="email" autoComplete="email" className="w-full px-4 py-3 rounded-xl border dark:border-gray-600 bg-white/20 dark:bg-black/30 text-sm" />
            <input value={password} onChange={e => setPassword(e.target.value)} placeholder="密码（至少6位）" type="password" autoComplete={tab === 'login' ? 'current-password' : 'new-password'} className="w-full px-4 py-3 rounded-xl border dark:border-gray-600 bg-white/20 dark:bg-black/30 text-sm" />
            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-indigo-500 text-white font-semibold text-sm hover:bg-indigo-600 disabled:opacity-50">
              {loading ? '处理中...' : tab === 'login' ? '登录' : '注册'}
            </button>
          </form>
        )}

        <p className="text-xs text-gray-400 text-center mt-6">数据云端同步 · 多设备共享</p>
      </div>
    </div>
  );
}
