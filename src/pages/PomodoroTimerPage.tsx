import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  stopSoundscape,
  playWorkCompleteSound,
  playBreakEndSound,
} from '../utils/audio';
import MusicPicker from '../components/MusicPicker';

export default function PomodoroTimerPage() {
  const { state, addCheckin, stopPomodoro, startBreak, incrementCycle } = useApp();
  const navigate = useNavigate();
  const { activePomodoro } = state;

  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const intervalRef = useRef<number | null>(null);
  const hasAlerted = useRef(false);

  // Redirect if no active pomodoro
  useEffect(() => {
    if (!activePomodoro) {
      navigate('/checkin', { replace: true });
    }
  }, [activePomodoro, navigate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Timer logic
  useEffect(() => {
    if (!activePomodoro) return;

    const phaseDuration = activePomodoro.isBreak
      ? activePomodoro.breakMinutes * 60
      : activePomodoro.workMinutes * 60;
    const elapsed = Math.floor((Date.now() - activePomodoro.phaseStartedAt) / 1000);
    const remaining = Math.max(0, phaseDuration - elapsed);
    setTimeLeft(remaining);
    setIsRunning(true);
    hasAlerted.current = false;

    intervalRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          if (intervalRef.current) clearInterval(intervalRef.current);

          if (!hasAlerted.current) {
            hasAlerted.current = true;
            if (activePomodoro.isBreak) {
              playBreakEndSound();
            } else {
              playWorkCompleteSound();
              // Auto-start break
              startBreak();
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activePomodoro?.phaseStartedAt, activePomodoro?.isBreak]);

  const handleContinue = () => {
    incrementCycle();
  };

  const handleFinish = () => {
    navigate('/checkin', { replace: true });
    addCheckin(activePomodoro!.habitId);
    stopPomodoro();
    stopSoundscape();
  };

  const handleCancel = () => {
    navigate('/checkin', { replace: true });
    stopPomodoro();
    stopSoundscape();
  };

  if (!activePomodoro) return null;

  const phaseDuration = activePomodoro.isBreak
    ? activePomodoro.breakMinutes * 60
    : activePomodoro.workMinutes * 60;
  const progress = phaseDuration > 0 ? timeLeft / phaseDuration : 0;
  const circumference = 2 * Math.PI * 110;

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-8 relative"
      style={{ background: 'url(/bg-pomodoro.jpg) center/cover no-repeat fixed' }}
    >
  {/* Header */}
      <div className="text-center mb-8 relative z-10">
        <span className="text-4xl">{activePomodoro.habitEmoji}</span>
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200 mt-2">{activePomodoro.habitName}</h1>
        <p className="text-gray-400 text-sm mt-1">
          {activePomodoro.isBreak ? '☕ 休息时间' : `🍅 工作时间 · 第 ${activePomodoro.totalCycles + 1} 轮`}
        </p>
      </div>

      {/* Timer ring */}
      <div className="relative w-60 h-60 sm:w-72 sm:h-72 mb-6">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 240 240">
          <circle cx="120" cy="120" r="110" fill="none" className="text-gray-100 dark:text-gray-800" stroke="currentColor" strokeWidth="16" />
          <circle
            cx="120" cy="120" r="110" fill="none"
            stroke={activePomodoro.isBreak ? '#10b981' : '#6366f1'}
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-5xl sm:text-6xl font-mono font-bold tracking-tight ${activePomodoro.isBreak ? 'text-emerald-500' : 'text-indigo-500'}`}>
            {fmt(timeLeft)}
          </span>
          <span className="text-sm text-gray-400 mt-2">
            {activePomodoro.isBreak ? '休息' : '专注'}
          </span>
        </div>
      </div>

      {/* Always show end button during active countdown */}
      {isRunning && (
        <button onClick={handleCancel}
          className="mt-4 py-2.5 px-8 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-500 font-medium text-sm border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
        >
          结束
        </button>
      )}

      {/* Break mode: choice buttons */}
      {!isRunning && activePomodoro.isBreak && (
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button onClick={handleContinue}
            className="py-3 rounded-2xl bg-indigo-500 text-white font-semibold hover:bg-indigo-600 transition-colors"
          >
            🍅 继续番茄钟
          </button>
          <button onClick={handleFinish}
            className="py-3 rounded-2xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors"
          >
            ✅ 结束打卡（已完成 {activePomodoro.totalCycles + 1} 轮）
          </button>
        </div>
      )}

      {/* Music picker */}
      <div className="mt-8 w-full max-w-sm">
        <MusicPicker />
      </div>
    </div>
  );
}
