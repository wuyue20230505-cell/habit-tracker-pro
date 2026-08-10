import { useState, useEffect } from 'react';
import { supabase, type User } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface Props {
  user: User | null;
  isPro: boolean;
  onClose: () => void;
}

const CARTOON_STYLES = ['thumbs','bottts','fun-emoji','pixel-art','lorelei','notionists','avataaars','micah'];

export default function ProfileModal({ user, isPro, onClose }: Props) {
  const { signOut, deleteAccount } = useAuth();
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState('');
  const [saved, setSaved] = useState(false);
  const [cartoonStyle, setCartoonStyle] = useState(0);
  const [cartoonSeed, setCartoonSeed] = useState(Math.random().toString(36).slice(2,8));
  const editKey = 'profile-edit-count';
  // 删除账号流程：idle → confirm(输入"删除"确认) → deleting → done/error
  const [delStep, setDelStep] = useState<'idle' | 'confirm' | 'deleting' | 'done' | 'error'>('idle');
  const [delInput, setDelInput] = useState('');
  const [delError, setDelError] = useState('');

  const handleDelete = async () => {
    setDelStep('deleting');
    setDelError('');
    const res = await deleteAccount();
    if (res.error) { setDelError(res.error); setDelStep('error'); return; }
    setDelStep('done');
    setTimeout(() => { onClose(); window.location.href = '/'; }, 1200);
  };

  useEffect(() => {
    if (user) {
      setNickname(user.user_metadata?.username || '');
      setAvatar(user.user_metadata?.avatar || '');
      if (user.user_metadata?.avatar?.includes('dicebear')) {
        setCartoonSeed(user.user_metadata.avatar.split('seed=')[1] || cartoonSeed);
      }
    }
  }, [user]);

  const editCount = parseInt(localStorage.getItem(editKey) || '0');
  const canEdit = isPro || editCount < 1;

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 150;
      canvas.getContext('2d')!.drawImage(img, 0, 0, 150, 150);
      setAvatar(canvas.toDataURL('image/jpeg', 0.6));
    };
    img.src = URL.createObjectURL(file);
  };

  const handleSave = async () => {
    if (!supabase || !user) return;
    const { error } = await supabase.auth.updateUser({
      data: { username: nickname || user.email?.split('@')[0], avatar }
    });
    if (!error) {
      if (!isPro) localStorage.setItem(editKey, String(editCount + 1));
      setSaved(true);
      setTimeout(() => { onClose(); window.location.reload(); }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-white mb-4 text-center drop-shadow">编辑资料</h2>

        {saved ? (
          <p className="text-emerald-300 text-center py-8">✅ 已保存！</p>
        ) : !canEdit ? (
          <div className="text-center py-6">
            <p className="text-amber-300 text-sm mb-3">免费用户只能修改一次</p>
            <p className="text-white/40 text-xs mb-4">升级 Pro 可无限修改</p>
            <button onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-white/10 text-white/60 text-sm">关闭</button>
          </div>
        ) : (
          <>
            {/* 头像 — 同注册页 */}
            <p className="text-xs text-white/40 mb-2">Q版卡通头像</p>
            <div className="flex items-center gap-2 mb-2">
              <button type="button" onClick={() => setCartoonSeed(Math.random().toString(36).slice(2,8))}
                className="text-xs px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/50">🎲 换一个</button>
              <button type="button" onClick={() => setCartoonStyle((cartoonStyle+1)%CARTOON_STYLES.length)}
                className="text-xs px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/50">🎨 换风格</button>
            </div>
            <div className="flex gap-2 items-center mb-2" onClick={() => setAvatar(`https://api.dicebear.com/7.x/${CARTOON_STYLES[cartoonStyle]}/svg?seed=${cartoonSeed}`)}>
              <img src={`https://api.dicebear.com/7.x/${CARTOON_STYLES[cartoonStyle]}/svg?seed=${cartoonSeed}`}
                className={`w-14 h-14 rounded-full border-2 ${avatar.includes('dicebear') ? 'border-indigo-400' : 'border-transparent'}`} />
              <p className="text-[10px] text-white/30">点击选中</p>
            </div>
            <label className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs cursor-pointer bg-white/5 hover:bg-white/10 text-white/50 mb-3">
              📷 或自选图片
              <input type="file" accept="image/*" onChange={handleAvatarFile} className="hidden" />
            </label>
            {(avatar.startsWith('data:') || avatar.startsWith('http')) && (
              <img src={avatar} className="w-12 h-12 rounded-full ring-2 ring-indigo-400 object-cover mb-3" />
            )}

            {/* 昵称 */}
            <input value={nickname} onChange={e => setNickname(e.target.value)}
              placeholder="输入昵称" maxLength={12}
              className="w-full px-4 py-3 rounded-xl bg-white/10 text-white text-sm text-center mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-400" />

            {!isPro && <p className="text-[10px] text-white/30 text-center mb-3">免费用户剩余 {1 - editCount} 次修改机会</p>}

            <button onClick={handleSave}
              className="w-full py-2.5 rounded-xl bg-indigo-500 text-white font-semibold text-sm hover:bg-indigo-600 mb-2">
              保存
            </button>
            <button onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-white/10 text-white/60 text-sm">取消</button>
            <button onClick={() => { signOut(); onClose(); }}
              className="w-full py-2 mt-2 rounded-xl text-red-300/50 text-xs hover:text-red-300">退出登录</button>
            {delStep === 'idle' && (
              <button onClick={() => setDelStep('confirm')}
                className="w-full py-2 mt-1 rounded-xl text-red-400/50 text-xs hover:text-red-400">
                删除账号
              </button>
            )}

            {/* 删除账号确认区 */}
            {delStep !== 'idle' && (
              <div className="mt-3 pt-3 border-t border-white/10 space-y-3">
                {(delStep === 'confirm' || delStep === 'deleting') && (
                  <>
                    <p className="text-xs text-red-300/90 leading-relaxed">
                      ⚠️ 删除账号后，您的所有云端数据（习惯、打卡记录、番茄钟、排行榜）将被
                      <strong className="text-red-300">永久删除</strong>，且无法恢复。
                    </p>
                    <input
                      value={delInput}
                      onChange={e => setDelInput(e.target.value)}
                      placeholder={'输入"删除"以确认'}
                      className="w-full px-3 py-2.5 rounded-xl bg-white/10 text-white text-sm text-center focus:outline-none focus:ring-2 focus:ring-red-400"
                    />
                    {delError && <p className="text-red-300 text-xs text-center">{delError}</p>}
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setDelStep('idle'); setDelInput(''); setDelError(''); }}
                        className="flex-1 py-2.5 rounded-xl bg-white/10 text-white/60 text-xs">
                        取消
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={delInput !== '删除' || delStep === 'deleting'}
                        className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-xs font-bold disabled:opacity-40">
                        {delStep === 'deleting' ? '删除中...' : '确认删除'}
                      </button>
                    </div>
                  </>
                )}
                {delStep === 'done' && (
                  <p className="text-emerald-300 text-center text-sm py-4">✅ 账号已删除，感谢使用！</p>
                )}
                {delStep === 'error' && (
                  <>
                    <p className="text-red-300 text-xs text-center">{delError}</p>
                    <button onClick={() => { setDelStep('confirm'); setDelError(''); }}
                      className="w-full py-2.5 rounded-xl bg-white/10 text-white/60 text-xs">
                      重试
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
