import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import DownloadModal from '../components/DownloadModal';

const FEATURES = [
  {
    icon: '✅',
    title: '习惯打卡',
    desc: '自由创建任意习惯，每日/每周/间隔灵活设置频率，一天多次打卡，进度一目了然。',
    color: 'from-indigo-500 to-blue-500',
  },
  {
    icon: '🍅',
    title: '番茄钟专注',
    desc: '工作25分钟+休息5分钟，专注时间自动播放雨声/海浪/舒缓音乐，计时结束提示音提醒。',
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: '📊',
    title: '数据统计',
    desc: '周/月/年完成率趋势图，打卡热力图，连续天数追踪，让进步看得见。',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: '🎵',
    title: '专注音乐',
    desc: '雨声、海浪、舒缓白噪音 + 本地音乐导入，打造专属专注环境。',
    color: 'from-violet-500 to-purple-500',
  },
  {
    icon: '📱',
    title: '全平台支持',
    desc: '网页即开即用，支持一键安装到手机桌面，像原生APP一样流畅。',
    color: 'from-cyan-500 to-blue-500',
  },
  {
    icon: '🔒',
    title: '隐私优先',
    desc: '数据存储在本地设备，无需注册登录，无需网络，你的习惯只有你知道。',
    color: 'from-rose-500 to-pink-500',
  },
];

export default function WelcomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showDownload, setShowDownload] = useState(false);

  return (
    <div className="min-h-dvh relative"
      style={{ background: 'url(/bg-welcome.jpg) center/cover no-repeat fixed' }}
    >
      {/* Hero */}
      <div className="relative z-10 px-5 pt-10 pb-6 text-center">
        {user && (
          <p className="text-xs text-indigo-400 mb-2">👋 {user.email || user.phone || '已登录'}</p>
        )}
        <div className="text-5xl mb-4 animate-bounce">🍅</div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">
          习惯追踪
        </h1>
        <p className="text-base text-gray-500 dark:text-gray-400 mb-1.5">
          让每一个好习惯，都开花结果
        </p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mb-6 leading-relaxed">
          习惯打卡 + 番茄钟专注 + 数据统计，一站式自律工具
        </p>

        <div className="flex flex-col gap-2.5 max-w-xs mx-auto">
          <button
            onClick={() => navigate('/checkin')}
            className="w-full py-3 rounded-2xl bg-indigo-500 text-white font-bold text-base shadow-lg shadow-indigo-500/25 hover:bg-indigo-600 transition-all active:scale-95"
          >
            🚀 立即开始
          </button>
          <div className="flex gap-2.5">
            <button
              onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              className="flex-1 py-2.5 rounded-2xl bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm font-medium border dark:border-gray-700 active:bg-gray-50"
            >
              了解更多
            </button>
            <button
              onClick={() => setShowDownload(true)}
              className="flex-1 py-2.5 rounded-2xl bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-sm font-medium border dark:border-gray-700 active:bg-gray-50"
            >
              📱 安装APP
            </button>
          </div>
          {!user && (
            <button onClick={() => navigate('/auth')} className="text-sm text-indigo-500 hover:text-indigo-600 mt-1">
              登录/注册 → 云端同步数据
            </button>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="px-5 pb-6">
        <div className="flex justify-center gap-6 text-center">
          {[
            { n: '🔥', l: '坚持打卡' },
            { n: '🏆', l: '排行榜' },
            { n: '📊', l: '数据统计' },
          ].map((s) => (
            <div key={s.l}>
              <div className="text-lg font-bold text-indigo-500">{s.n}</div>
              <div className="text-xs text-gray-400">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature cards */}
      <div id="features" className="px-4 pb-6">
        <h2 className="text-xl font-bold text-center text-gray-800 dark:text-gray-200 mb-5">
          强大功能，简单上手
        </h2>
        <div className="grid grid-cols-1 gap-3 max-w-sm mx-auto">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl px-4 py-3.5 shadow-sm border border-gray-100/60 dark:border-gray-700/40 flex items-center gap-3 active:scale-[0.98] transition-transform"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-lg shrink-0 shadow-sm`}>
                {f.icon}
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{f.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mt-0.5">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pro upsell */}
      <div className="px-4 pb-6">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-3xl px-6 py-6 text-center max-w-sm mx-auto">
          <span className="text-3xl block mb-2">⭐</span>
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">升级 Pro，解锁全部功能</h2>
          <div className="text-left space-y-2 mb-5 text-sm">
            {[
              { free: '3个习惯', pro: '无限习惯', icon: '📋' },
              { free: '7天统计', pro: '全部历史统计', icon: '📊' },
              { free: '雨声', pro: '全部专注音乐', icon: '🎵' },
              { free: '本地存储', pro: '云端同步', icon: '☁️' },
              { free: '基础排行', pro: '排名徽章', icon: '🏅' },
            ].map((row) => (
              <div key={row.icon} className="flex items-center gap-2">
                <span className="text-base">{row.icon}</span>
                <span className="text-gray-400 dark:text-gray-500 line-through text-xs flex-1">{row.free}</span>
                <span className="text-amber-600 dark:text-amber-400 font-medium text-xs">{row.pro}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => alert('Pro 订阅即将上线！')}
            className="w-full py-3 rounded-2xl bg-amber-500 text-white font-bold text-sm hover:bg-amber-600 transition-all active:scale-95 shadow-lg shadow-amber-500/25"
          >
            ⭐ 解锁 Pro · 即将上线
          </button>
          <p className="text-[11px] text-gray-400 mt-2">年付 ¥12（月均¥1）· 终身 ¥48（永久使用）</p>
        </div>
      </div>

      {/* How it works */}
      <div className="px-5 pb-6">
        <h2 className="text-xl font-bold text-center text-gray-800 dark:text-gray-200 mb-5">
          三步开始
        </h2>
        <div className="flex gap-3 max-w-sm mx-auto">
          {[
            { step: '1', title: '创建习惯', desc: '选图标、定频率，30秒搞定' },
            { step: '2', title: '每日打卡', desc: '一键打卡或番茄钟专注' },
            { step: '3', title: '追踪成长', desc: '数据统计看见进步' },
          ].map((item, i) => (
            <div key={i} className="flex-1 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-3xl p-3 text-center shadow-sm">
              <div className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center font-bold text-sm mx-auto mb-2">
                {item.step}
              </div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{item.title}</h3>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Download CTA */}
      <div className="px-4 pb-6">
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl px-6 py-7 text-center text-white shadow-lg max-w-sm mx-auto">
          <h2 className="text-xl font-bold mb-2">📱 安装到手机</h2>
          <p className="text-indigo-100 text-sm mb-5 leading-relaxed">
            浏览器打开 → 菜单 → 添加到主屏幕，像原生APP一样使用！
          </p>
          <button
            onClick={() => setShowDownload(true)}
            className="w-full py-3 rounded-2xl bg-white text-indigo-600 font-bold text-sm hover:bg-indigo-50 transition-all active:scale-95"
          >
            查看安装教程
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pb-10 px-4">
        <p className="text-xs text-gray-300 dark:text-gray-600">
          习惯追踪 © 2026 · 纯本地 · 无网络 · 隐私安全
        </p>
        <button
          onClick={() => navigate('/checkin')}
          className="text-sm text-indigo-500 hover:text-indigo-600 font-medium mt-2"
        >
          进入打卡 →
        </button>
      </div>

      <DownloadModal open={showDownload} onClose={() => setShowDownload(false)} />
    </div>
  );
}
