import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProCtx } from '../context/ProContext';
import ProfileModal from './ProfileModal';
import PomodoroOverlay from './PomodoroOverlay';
import ShareModal from './ShareModal';

const TABS = [
  { to: '/checkin', label: '打卡', icon: '✅' },
  { to: '/habits', label: '习惯', icon: '📋' },
  { to: '/goals', label: '目标', icon: '🎯' },
  { to: '/countdowns', label: '倒数日', icon: '📅' },
  { to: '/pomodoro', label: '番茄', icon: '🍅' },
  { to: '/leaderboard', label: '排行', icon: '🏆' },
  { to: '/stats', label: '统计', icon: '📊' },
];

export default function Layout() {
  const { user, getUsername, getAvatar } = useAuth();
  const { isPro, setShowPaywall } = useProCtx();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const [showShare, setShowShare] = useState(false);

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-30">
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent" />
        <div className="max-w-lg mx-auto flex items-center justify-between px-3 py-2 relative">
          {/* 左侧：首页+分享+反馈 */}
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} title="首页"
              className="flex items-center gap-1 text-white/70 hover:text-white transition-colors">
              <span className="text-lg">🏠</span>
              <span className="text-xs font-medium drop-shadow-sm">首页</span>
            </button>
            <button onClick={() => setShowShare(true)} title="分享"
              className="flex items-center gap-1 text-white/70 hover:text-white transition-colors">
              <span className="text-lg">📤</span>
              <span className="text-xs font-medium drop-shadow-sm">分享</span>
            </button>
            <button onClick={() => navigate('/feedback')} title="反馈"
              className="flex items-center gap-1 text-white/70 hover:text-white transition-colors">
              <span className="text-lg">💬</span>
              <span className="text-xs font-medium drop-shadow-sm">反馈</span>
            </button>
          </div>
          {/* 右侧：Pro + 用户 */}
          <div className="flex items-center gap-2">
            {!isPro && (
              <button onClick={() => setShowPaywall(true)}
                className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100/80 text-amber-700 font-medium">⭐ Pro</button>
            )}
            {user ? (
              <button onClick={() => setShowProfile(!showProfile)}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                {(getAvatar().startsWith('data:') || getAvatar().startsWith('http')) ? (
                  <img src={getAvatar()} className="w-9 h-9 rounded-full object-cover ring-2 ring-white/30" />
                ) : (
                  <span className="text-xl">{getAvatar()}</span>
                )}
                <span className="text-sm text-white/95 drop-shadow-sm font-semibold max-w-[100px] truncate">{getUsername()}</span>
              </button>
            ) : (
              <button onClick={() => navigate('/auth')} className="text-sm text-white/80 font-medium">登录</button>
            )}
          </div>
        </div>
      </div>

      {/* 分享弹窗 */}
      {showShare && <ShareModal open={showShare} onClose={() => setShowShare(false)} />}

      {/* 个人信息编辑弹窗 */}
      {showProfile && <ProfileModal user={user} isPro={isPro} onClose={() => setShowProfile(false)} />}

      <main className="flex-1 pb-16">
        <Outlet />
      </main>
      <PomodoroOverlay />
      <nav className="fixed bottom-0 inset-x-0 z-30">
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        <div className="max-w-lg mx-auto flex justify-around py-1 relative">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === '/checkin' || tab.to === '/goals' || tab.to === '/countdowns'}
              className={({ isActive }) =>
                `flex flex-col items-center py-1.5 px-1 text-[9px] gap-0.5 transition-colors drop-shadow-sm ${
                  isActive
                    ? 'text-white scale-110'
                    : 'text-white/60'
                }`
              }
            >
              <span className="text-base">{tab.icon}</span>
              <span>{tab.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
