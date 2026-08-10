import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

type Mode = 'work' | 'break';

export default function PomodoroPage() {
  const navigate = useNavigate();
  const { startPomodoro } = useApp();
  const [mode, setMode] = useState<Mode>('work');
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [sessionCount] = useState(0);

  const handleStart = () => {
    startPomodoro({
      id: 'free-focus',
      name: '自由专注',
      emoji: '🍅',
      color: 'bg-indigo-500',
      frequency: { type: 'daily' },
      createdAt: new Date().toISOString(),
      archived: false,
      usePomodoro: true,
      pomodoroMinutes: workDuration,
      breakMinutes: breakDuration,
    }, new Date().toISOString().slice(0, 10));
    navigate('/pomodoro-timer');
  };

  const switchMode = (m: Mode) => {
    setMode(m);
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    return `${String(m).padStart(2, '0')}:00`;
  };

  return (
    <div className="min-h-dvh relative" style={{ background: 'url(/bg-pomodoro.jpg) center/cover no-repeat', backgroundAttachment: 'fixed', minHeight: '100dvh', filter: 'saturate(1.08) brightness(1.04) contrast(1.05)' }}>
    <div className="max-w-lg mx-auto px-4 pt-4 sm:pt-6 pb-4 relative z-10">
      <h1 className="text-2xl font-bold text-white mb-1 drop-shadow-lg">番茄钟</h1>
      <p className="text-white/80 drop-shadow mb-6">
        {sessionCount > 0 ? `已完成 ${sessionCount} 个番茄钟` : '专注时间，高效完成'}
      </p>

      {/* Mode switch */}
      <div className="flex justify-center mb-8">
        <div className="flex bg-white/10 dark:bg-white/5 rounded-xl p-1">
          <button onClick={() => switchMode('work')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'work' ? 'bg-white/20 dark:bg-black/30 shadow-sm text-indigo-500' : 'text-gray-500'}`}>
            🍅 专注
          </button>
          <button onClick={() => switchMode('break')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'break' ? 'bg-white/20 dark:bg-black/30 shadow-sm text-emerald-500' : 'text-gray-500'}`}>
            ☕ 休息
          </button>
        </div>
      </div>

      {/* Timer ring */}
      <div className="flex justify-center mb-8">
        <div className="relative w-56 h-56">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor"
              className="text-white/20" strokeWidth="12" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-mono font-bold tracking-tight text-indigo-300 drop-shadow-lg">
              {fmt(mode === 'work' ? workDuration * 60 : breakDuration * 60)}
            </span>
            <span className="text-white/60 text-sm mt-1 drop-shadow">
              {mode === 'work' ? '专注时间' : '休息时间'}
            </span>
          </div>
        </div>
      </div>

      {/* Start button */}
      <div className="flex justify-center mb-8">
        <button onClick={handleStart}
          className="px-10 py-3 rounded-2xl font-semibold text-white bg-indigo-500 hover:bg-indigo-600 transition-all active:scale-95 shadow-lg shadow-indigo-500/25">
          ▶ 开始专注
        </button>
      </div>

      {/* Duration settings */}
      <div className="bg-white/15 dark:bg-black/20 backdrop-blur-md rounded-2xl p-4 mb-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">时长设置（分钟）</h3>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-xs text-gray-400 mb-1 block">专注时间</label>
            <div className="flex items-center gap-2">
              <button onClick={() => setWorkDuration((p) => Math.max(1, p - 5))}
                className="w-8 h-8 rounded-lg bg-white/10 dark:bg-white/5 hover:bg-white/15">-</button>
              <input type="number" value={workDuration}
                onChange={(e) => setWorkDuration(Math.max(1, Number(e.target.value)))}
                className="w-14 text-center py-1 rounded-lg border dark:border-gray-600 bg-white/10 dark:bg-black/20 text-sm appearance-none" min={1} />
              <button onClick={() => setWorkDuration((p) => Math.min(120, p + 5))}
                className="w-8 h-8 rounded-lg bg-white/10 dark:bg-white/5 hover:bg-white/15">+</button>
            </div>
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-400 mb-1 block">休息时间</label>
            <div className="flex items-center gap-2">
              <button onClick={() => setBreakDuration((p) => Math.max(1, p - 1))}
                className="w-8 h-8 rounded-lg bg-white/10 dark:bg-white/5 hover:bg-white/15">-</button>
              <input type="number" value={breakDuration}
                onChange={(e) => setBreakDuration(Math.max(1, Number(e.target.value)))}
                className="w-14 text-center py-1 rounded-lg border dark:border-gray-600 bg-white/10 dark:bg-black/20 text-sm appearance-none" min={1} />
              <button onClick={() => setBreakDuration((p) => Math.min(60, p + 1))}
                className="w-8 h-8 rounded-lg bg-white/10 dark:bg-white/5 hover:bg-white/15">+</button>
            </div>
          </div>
        </div>
      </div>

    </div>
    </div>
  );
}
