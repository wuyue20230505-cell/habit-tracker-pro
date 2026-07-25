import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProCtx } from '../context/ProContext';
import PomodoroOverlay from './PomodoroOverlay';

const TABS = [
  { to: '/checkin', label: '打卡', icon: '✅' },
  { to: '/pomodoro', label: '番茄', icon: '🍅' },
  { to: '/leaderboard', label: '排行', icon: '🏆' },
  { to: '/habits', label: '习惯', icon: '📋' },
  { to: '/stats', label: '统计', icon: '📊' },
];

export default function Layout() {
  const { user, signOut } = useAuth();
  const { isPro, setShowPaywall } = useProCtx();
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Top bar with user */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-100/60 dark:border-gray-700/40">
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-2">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">习惯追踪</span>
          <div className="flex items-center gap-2">
            {!isPro && (
              <button
                onClick={() => setShowPaywall(true)}
                className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 font-medium"
              >
                ⭐ Pro
              </button>
            )}
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 truncate max-w-[120px]">{user.email || user.phone}</span>
                <button onClick={signOut} className="text-xs text-gray-400 hover:text-red-500">退出</button>
              </div>
            ) : (
              <button onClick={() => navigate('/auth')} className="text-xs text-indigo-500 font-medium">登录/注册</button>
            )}
          </div>
        </div>
      </div>

      <main className="flex-1 pb-16">
        <Outlet />
      </main>
      <PomodoroOverlay />
      <nav className="fixed bottom-0 inset-x-0 bg-white/85 dark:bg-gray-800/85 backdrop-blur-md border-t border-gray-100/60 dark:border-gray-700/40 z-30">
        <div className="max-w-lg mx-auto flex justify-around py-1">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.to === '/checkin'}
              className={({ isActive }) =>
                `flex flex-col items-center py-1.5 px-2 text-[10px] gap-0.5 transition-colors ${
                  isActive
                    ? 'text-indigo-500'
                    : 'text-gray-400 dark:text-gray-500'
                }`
              }
            >
              <span className="text-lg">{tab.icon}</span>
              <span>{tab.label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
