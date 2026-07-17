import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PomodoroOverlay from './PomodoroOverlay';

const TABS = [
  { to: '/checkin', label: '打卡', icon: '✅' },
  { to: '/pomodoro', label: '番茄', icon: '🍅' },
  { to: '/habits', label: '习惯', icon: '📋' },
  { to: '/history', label: '历史', icon: '📅' },
  { to: '/stats', label: '统计', icon: '📊' },
];

export default function Layout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Top bar with user */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-b dark:border-gray-700">
        <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-2">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">习惯追踪</span>
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

      <main className="flex-1 pb-16">
        <Outlet />
      </main>
      <PomodoroOverlay />
      <nav className="fixed bottom-0 inset-x-0 bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-t dark:border-gray-700 z-30">
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
