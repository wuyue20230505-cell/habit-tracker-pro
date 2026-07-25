import { useState, useEffect, useRef, useCallback } from 'react';
import MusicPicker from '../components/MusicPicker';

type Mode = 'work' | 'break';

const DEFAULT_WORK = 25 * 60;

export default function PomodoroPage() {
  const [mode, setMode] = useState<Mode>('work');
  const [timeLeft, setTimeLeft] = useState(DEFAULT_WORK);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);

  const intervalRef = useRef<number | null>(null);

  const total = mode === 'work' ? workDuration * 60 : breakDuration * 60;
  const progress = timeLeft / total;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const stop = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const tick = useCallback(() => {
    setTimeLeft((prev) => {
      if (prev <= 1) {
        stop();
        // notification
        if (Notification.permission === 'granted') {
          new Notification(mode === 'work' ? '🍅 工作时间结束！休息一下吧' : '☕ 休息结束！开始新的番茄钟');
        }
        if (mode === 'work') {
          setSessionCount((c) => c + 1);
        }
        return 0;
      }
      return prev - 1;
    });
  }, [mode, stop]);

  const start = useCallback(() => {
    if (timeLeft <= 0) {
      const newTotal = mode === 'work' ? workDuration * 60 : breakDuration * 60;
      setTimeLeft(newTotal);
    }
    setIsRunning(true);
    intervalRef.current = window.setInterval(tick, 1000);
  }, [tick, timeLeft, mode, workDuration, breakDuration]);

  const togglePause = () => {
    if (isRunning) {
      stop();
    } else {
      start();
    }
  };

  const reset = () => {
    stop();
    const newTotal = mode === 'work' ? workDuration * 60 : breakDuration * 60;
    setTimeLeft(newTotal);
  };

  const switchMode = (m: Mode) => {
    stop();
    setMode(m);
    setTimeLeft(m === 'work' ? workDuration * 60 : breakDuration * 60);
  };

  // cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="min-h-dvh relative" style={{ background: 'url(/bg-pomodoro.jpg) center/cover no-repeat', backgroundAttachment: 'fixed', minHeight: '100dvh' }}>
<div className="max-w-lg mx-auto px-4 pt-4 sm:pt-6 pb-4 relative z-10">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-1">番茄钟</h1>
      <p className="text-gray-400 dark:text-gray-500 mb-6">
        {sessionCount > 0 ? `已完成 ${sessionCount} 个番茄钟` : '专注工作，高效完成'}
      </p>

      {/* Mode switch */}
      <div className="flex justify-center mb-8">
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          <button
            onClick={() => switchMode('work')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'work'
                ? 'bg-white/20 dark:bg-black/30 shadow-sm text-indigo-500'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            🍅 工作
          </button>
          <button
            onClick={() => switchMode('break')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
              mode === 'break'
                ? 'bg-white/20 dark:bg-black/30 shadow-sm text-emerald-500'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            ☕ 休息
          </button>
        </div>
      </div>

      {/* Timer ring */}
      <div className="flex justify-center mb-8">
        <div className="relative w-56 h-56">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
            {/* Background circle */}
            <circle
              cx="100" cy="100" r="90"
              fill="none"
              stroke="currentColor"
              className="text-gray-100 dark:text-gray-800"
              strokeWidth="12"
            />
            {/* Progress circle */}
            <circle
              cx="100" cy="100" r="90"
              fill="none"
              stroke={mode === 'work' ? '#6366f1' : '#10b981'}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-5xl font-mono font-bold tracking-tight ${mode === 'work' ? 'text-indigo-500' : 'text-emerald-500'}`}>
              {formatTime(timeLeft)}
            </span>
            <span className="text-sm text-gray-400 mt-1">
              {mode === 'work' ? '工作时间' : '休息时间'}
            </span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4 mb-8">
        <button
          onClick={togglePause}
          className={`px-8 py-3 rounded-2xl font-semibold text-white transition-all active:scale-95 ${
            isRunning
              ? 'bg-amber-500 hover:bg-amber-600'
              : 'bg-indigo-500 hover:bg-indigo-600'
          }`}
        >
          {isRunning ? '⏸ 暂停' : timeLeft <= 0 ? '🔄 重新开始' : '▶ 开始'}
        </button>
        <button
          onClick={reset}
          className="px-6 py-3 rounded-2xl font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-95"
        >
          ↩ 重置
        </button>
      </div>

      {/* Duration settings */}
      <div className="bg-white/15 dark:bg-black/20 backdrop-blur-md rounded-2xl p-4 mb-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">时长设置（分钟）</h3>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-xs text-gray-400 mb-1 block">工作时间</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWorkDuration((p) => Math.max(1, p - 5))}
                className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                -
              </button>
              <input
                type="number"
                value={workDuration}
                onChange={(e) => {
                  const v = Math.max(1, Number(e.target.value));
                  setWorkDuration(v);
                  if (mode === 'work' && !isRunning) setTimeLeft(v * 60);
                }}
                className="w-14 text-center py-1 rounded-lg border dark:border-gray-600 bg-white/20 dark:bg-black/30 text-sm"
                min={1}
              />
              <button
                onClick={() => setWorkDuration((p) => Math.min(120, p + 5))}
                className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                +
              </button>
            </div>
          </div>
          <div className="flex-1">
            <label className="text-xs text-gray-400 mb-1 block">休息时间</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setBreakDuration((p) => Math.max(1, p - 1))}
                className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                -
              </button>
              <input
                type="number"
                value={breakDuration}
                onChange={(e) => {
                  const v = Math.max(1, Number(e.target.value));
                  setBreakDuration(v);
                  if (mode === 'break' && !isRunning) setTimeLeft(v * 60);
                }}
                className="w-14 text-center py-1 rounded-lg border dark:border-gray-600 bg-white/20 dark:bg-black/30 text-sm"
                min={1}
              />
              <button
                onClick={() => setBreakDuration((p) => Math.min(60, p + 1))}
                className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                +
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Music */}
      <MusicPicker />
    </div>
    </div>
  );
}
