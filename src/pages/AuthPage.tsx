import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import ImageCarousel from '../components/ImageCarousel';

type Tab = 'login' | 'register';

export default function AuthPage() {
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState<Tab>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('');
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);
  // DiceBear Q版卡通头像
  const CARTOON_STYLES = ['thumbs','bottts','fun-emoji','pixel-art','lorelei','notionists','avataaars','micah'];
  const [cartoonStyle, setCartoonStyle] = useState(0);
  const [cartoonSeed, setCartoonSeed] = useState(Math.random().toString(36).slice(2,8));

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // 压缩到 150x150
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 150;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, 150, 150);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
      setCustomAvatar(dataUrl); setAvatar('');
    };
    img.src = URL.createObjectURL(file);
  };
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false); // 注册需勾选同意隐私政策

  // 从隐私政策页同意后返回时自动勾选，并回到原 tab
  useEffect(() => {
    const s = location.state as { autoAgree?: boolean; tab?: Tab } | null;
    if (s?.autoAgree) {
      setAgreed(true);
      if (s.tab) setTab(s.tab);
      navigate(location.pathname, { replace: true, state: null }); // 清理，避免刷新后重复
    }
  }, [location.state, navigate, location.pathname]);

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
    if (!agreed) { setError('请先阅读并同意《隐私政策》'); return; }
    if (!username.trim()) { setError('请输入昵称'); return; }
    if (!email || !password || password.length < 6) { setError('密码至少6位'); return; }
    setLoading(true);
    const finalAvatar = customAvatar || avatar || `https://api.dicebear.com/7.x/${CARTOON_STYLES[cartoonStyle]}/svg?seed=${cartoonSeed}`;
    const res = await signUpWithEmail(email, password, username, finalAvatar);
    setLoading(false);
    if (res.error) setError(res.error);
    else setMsg('注册成功！请查看邮箱确认链接，然后登录。');
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 relative">
      <ImageCarousel images={['/welcome-1.jpg', '/welcome-2.jpg']} interval={5000} />
      <div className="absolute inset-0 bg-black/30 z-[1]" />
      <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 w-full max-w-sm shadow-sm relative z-10">
        <div className="text-center mb-6">
          <span className="text-4xl">🍅</span>
          <h1 className="text-xl font-bold text-white mt-2 drop-shadow-lg">打卡番茄钟</h1>
        </div>

        {/* Tabs */}
        <div className="flex bg-white/10 dark:bg-white/5 rounded-xl p-1 mb-6">
          {[{ k: 'login' as Tab, l: '登录' }, { k: 'register' as Tab, l: '注册' }].map(({ k, l }) => (
            <button key={k} onClick={() => { setTab(k); setError(''); setMsg(''); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium ${tab === k ? 'bg-white/10 dark:bg-gray-600 shadow-sm text-indigo-300' : 'text-white/50'}`}>
              {l}
            </button>
          ))}
        </div>

        {error && <p className="text-red-300 text-sm mb-3 text-center bg-red-500/20 dark:bg-red-500/20 py-2 rounded-lg">{error}</p>}
        {msg && <p className="text-emerald-300 text-sm mb-3 text-center bg-emerald-500/20 dark:bg-emerald-500/20 py-2 rounded-lg">{msg}</p>}

        <form onSubmit={tab === 'login' ? handleEmailLogin : handleRegister} className="space-y-4">
            {tab === 'register' && (
              <>
                <input value={username} onChange={e => setUsername(e.target.value)} placeholder="昵称" className="w-full px-4 py-3 rounded-xl border dark:border-gray-600 bg-white/10 dark:bg-black/20 text-sm appearance-none" />
                <div>
                  <p className="text-xs text-white/40 mb-2">Q版卡通头像</p>
                  <div className="flex items-center gap-2 mb-2">
                    <button type="button" onClick={() => { setCartoonSeed(Math.random().toString(36).slice(2,8)); setCustomAvatar(null); }}
                      className="text-xs px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/50">🎲 换一个</button>
                    <button type="button" onClick={() => { setCartoonStyle((cartoonStyle+1)%CARTOON_STYLES.length); setCustomAvatar(null); }}
                      className="text-xs px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/50">🎨 换风格</button>
                  </div>
                  <div className="flex gap-2 items-center mb-2">
                    <img src={`https://api.dicebear.com/7.x/${CARTOON_STYLES[cartoonStyle]}/svg?seed=${cartoonSeed}`}
                      className={`w-16 h-16 rounded-full border-2 ${!customAvatar ? 'border-indigo-400' : 'border-transparent'}`}
                      onClick={() => { setAvatar(`https://api.dicebear.com/7.x/${CARTOON_STYLES[cartoonStyle]}/svg?seed=${cartoonSeed}`); setCustomAvatar(null); }} />
                    <p className="text-[10px] text-white/30">点击头像选中</p>
                  </div>
                  <label className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-all ${
                    customAvatar ? 'bg-indigo-500/40 ring-2 ring-indigo-400' : 'bg-white/5 hover:bg-white/10 text-white/50'
                  }`}>
                    📷 或自选图片
                    <input type="file" accept="image/*" onChange={handleAvatarFile} className="hidden" />
                  </label>
                  {customAvatar && <img src={customAvatar} className="w-8 h-8 rounded-full inline-block ml-2 object-cover" />}
                </div>
              </>
            )}
            <input value={email} onChange={e => setEmail(e.target.value)} placeholder="邮箱地址" type="email" autoComplete="email" className="w-full px-4 py-3 rounded-xl border dark:border-gray-600 bg-white/10 dark:bg-black/20 text-sm appearance-none" />
            <input value={password} onChange={e => setPassword(e.target.value)} placeholder="密码（至少6位）" type="password" autoComplete={tab === 'login' ? 'current-password' : 'new-password'} className="w-full px-4 py-3 rounded-xl border dark:border-gray-600 bg-white/10 dark:bg-black/20 text-sm appearance-none" />
            <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-indigo-500 text-white font-semibold text-sm hover:bg-indigo-600 disabled:opacity-50">
              {loading ? '处理中...' : tab === 'login' ? '登录' : '注册'}
            </button>
          </form>

        {/* 隐私政策提示（华为审核 7.5：注册/登录界面须展示） */}
        <div className="mt-4 text-center text-xs text-white/50 space-y-2">
          {tab === 'register' ? (
            <label className="flex items-center justify-center gap-1.5 cursor-pointer select-none">
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} className="accent-indigo-500 w-3.5 h-3.5 shrink-0" />
              <span>我已阅读并同意</span>
              <button type="button" onClick={() => navigate('/privacy', { state: { fromAuth: true, tab } })} className="text-indigo-300 underline underline-offset-2">《隐私政策》</button>
            </label>
          ) : (
            <p>
              登录即表示您已阅读并同意
              <button type="button" onClick={() => navigate('/privacy', { state: { fromAuth: true, tab } })} className="text-indigo-300 underline underline-offset-2">《隐私政策》</button>
            </p>
          )}
        </div>

        <p className="text-xs text-gray-400 text-center mt-3">数据云端同步 · 多设备共享</p>
      </div>
      <button onClick={() => navigate('/')} className="mt-4 text-white/50 hover:text-white text-sm drop-shadow relative z-10">← 返回首页</button>
    </div>
  );
}
