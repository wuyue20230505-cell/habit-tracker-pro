import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ImageCarousel from '../components/ImageCarousel';
import DownloadModal from '../components/DownloadModal';

const FEATURES = [
  { icon: '✅', title: '习惯打卡', desc: '自由创建任意习惯，每日/每周/间隔灵活设置频率', color: 'from-indigo-500 to-blue-500' },
  { icon: '🍅', title: '番茄钟专注', desc: '工作25分钟+休息5分钟，专注时间自动播放音乐', color: 'from-orange-500 to-red-500' },
  { icon: '📊', title: '数据统计', desc: '周/月/年完成率趋势图，打卡热力图，进步看得见', color: 'from-emerald-500 to-teal-500' },
  { icon: '🎵', title: '专注音乐', desc: '雨声、海浪、卡农、梦中的婚礼等内置音乐', color: 'from-violet-500 to-purple-500' },
  { icon: '📱', title: '全平台支持', desc: '网页即开即用，支持一键安装到手机桌面', color: 'from-cyan-500 to-blue-500' },
  { icon: '🔒', title: '隐私优先', desc: '数据存储在本地设备，无需网络，你的习惯只有你知道', color: 'from-rose-500 to-pink-500' },
];

export default function WelcomePage() {
  const navigate = useNavigate();
  const [showDownload, setShowDownload] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);

  return (
    <div style={{ minHeight: '150vh' }}>
      {/* 固定背景 */}
      <div className="fixed inset-0">
        <ImageCarousel images={['/welcome-1.jpg', '/welcome-2.jpg']} interval={6000} />
        <div className="absolute inset-0 bg-black/25" />
      </div>

      {/* 可滚动内容 — 独立滚动 */}
      <div className="relative z-10 h-dvh overflow-y-auto flex flex-col items-center">
        <div className="text-center px-5 pt-12 mt-auto">
          <h1 className="text-xl font-bold text-white tracking-tight drop-shadow-lg">习惯追踪</h1>
          <p className="text-xs text-white/50 mt-1 drop-shadow">习惯打卡 + 番茄钟专注 + 数据统计</p>
        </div>

        <div className="flex flex-col gap-2 max-w-[220px] mx-auto px-5 mt-3">
          <button onClick={() => navigate('/checkin')}
            className="w-full py-3 rounded-2xl bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/25 hover:bg-indigo-600 transition-all active:scale-95">
            🚀 立即开始
          </button>
          <div className="flex gap-2">
            <button onClick={() => setShowFeatures(true)}
              className="flex-1 py-2 rounded-xl bg-white/10 backdrop-blur-sm text-white/70 text-xs border border-white/15 hover:bg-white/15 transition-all">
              了解更多
            </button>
            <button onClick={() => setShowDownload(true)}
              className="flex-1 py-2 rounded-xl bg-white/10 backdrop-blur-sm text-white/70 text-xs border border-white/15 hover:bg-white/15 transition-all">
              📱 安装APP
            </button>
          </div>
          <button onClick={() => navigate('/auth')}
            className="py-2.5 rounded-xl bg-white/10 backdrop-blur-sm text-white/80 text-sm font-medium border border-white/15 hover:bg-white/15 transition-all">
            🔐 登录 / 注册
          </button>

          {/* Pro */}
          <div className="pt-2">
            <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl px-4 py-3 text-center">
              <span className="text-lg block mb-1">⭐</span>
              <h2 className="text-xs font-bold text-white mb-2 drop-shadow">升级 Pro</h2>
              <div className="space-y-1 mb-3 text-[10px] text-left px-2">
                <div className="flex justify-between"><span className="text-white/50">📋 3习惯</span><span className="text-amber-300">→无限</span></div>
                <div className="flex justify-between"><span className="text-white/50">📊 7天统计</span><span className="text-amber-300">→全部</span></div>
                <div className="flex justify-between"><span className="text-white/50">☁️ 本地</span><span className="text-amber-300">→云同步</span></div>
              </div>
              <button onClick={() => alert('Pro 订阅即将上线！')}
                className="w-full py-2 rounded-xl bg-amber-500 text-white font-bold text-[10px] hover:bg-amber-600 transition-all">
                ⭐ 年付¥9 · 终身¥18（限时折扣）
              </button>
            </div>
          </div>
        </div>
        <button onClick={() => navigate('/privacy')}
          className="mt-6 text-[10px] text-white/35 hover:text-white/70 transition-all">
          隐私政策
        </button>
        <div className="h-16" />
      </div>

      {/* 了解更多弹窗 */}
      {showFeatures && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowFeatures(false)}>
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 max-w-sm w-full max-h-[80vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-bold text-center text-white mb-4 drop-shadow-lg">强大功能，简单上手</h2>
            <div className="grid grid-cols-2 gap-2">
              {FEATURES.map((f) => (
                <div key={f.title} className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 text-center">
                  <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-sm mx-auto mb-1.5`}>
                    {f.icon}
                  </div>
                  <h3 className="font-semibold text-white text-[11px] drop-shadow">{f.title}</h3>
                  <p className="text-[10px] text-white/40 leading-relaxed mt-1">{f.desc}</p>
                </div>
              ))}
            </div>
            <button onClick={() => setShowFeatures(false)}
              className="w-full mt-4 py-2.5 rounded-xl bg-white/10 text-white/60 text-sm hover:bg-white/15 transition-all">
              关闭
            </button>
          </div>
        </div>
      )}

      <DownloadModal open={showDownload} onClose={() => setShowDownload(false)} />
    </div>
  );
}
