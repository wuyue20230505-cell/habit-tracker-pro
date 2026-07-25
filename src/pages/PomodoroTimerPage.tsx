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

  useEffect(() => {
    if (!activePomodoro) navigate('/checkin', { replace: true });
  }, [activePomodoro, navigate]);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  useEffect(() => {
    if (!activePomodoro) return;
    const phaseDuration = activePomodoro.isBreak
      ? activePomodoro.breakMinutes * 60
      : activePomodoro.workMinutes * 60;
    const elapsed = Math.floor((Date.now() - activePomodoro.phaseStartedAt) / 1000);
    setTimeLeft(Math.max(0, phaseDuration - elapsed));
    setIsRunning(true);
    hasAlerted.current = false;

    intervalRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          if (intervalRef.current) clearInterval(intervalRef.current);
          if (!hasAlerted.current) {
            hasAlerted.current = true;
            if (activePomodoro.isBreak) { playBreakEndSound(); }
            else { playWorkCompleteSound(); startBreak(); }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [activePomodoro?.phaseStartedAt, activePomodoro?.isBreak]);

  const handleContinue = () => { incrementCycle(); };
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
    ? activePomodoro.breakMinutes * 60 : activePomodoro.workMinutes * 60;
  const progress = phaseDuration > 0 ? timeLeft / phaseDuration : 0;
  const circumference = 2 * Math.PI * 110;
  const fmt = (s: number) => {
    const m = Math.floor(s / 60), sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 py-8 relative">
      {/* 视频背景 */}
      <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0">
        <source src="/focus-video.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/30 z-[1]" />

      {/* 内容在视频之上 */}
      <div className="relative z-10 flex flex-col items-center w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <span className="text-4xl">{activePomodoro.habitEmoji}</span>
          <h1 className="text-xl font-bold text-white mt-2 drop-shadow-lg">{activePomodoro.habitName}</h1>
          <p className="text-white/70 text-sm mt-1 drop-shadow">
            {activePomodoro.isBreak ? '☕ 休息时间' : `🍅 工作时间 · 第 ${activePomodoro.totalCycles + 1} 轮`}
          </p>
        </div>

        {/* Timer ring */}
        <div className="relative w-60 h-60 sm:w-72 sm:h-72 mb-6">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 240 240">
            <circle cx="120" cy="120" r="110" fill="none" className="text-white/20" stroke="currentColor" strokeWidth="16" />
            <circle cx="120" cy="120" r="110" fill="none"
              stroke={activePomodoro.isBreak ? '#10b981' : '#818cf8'}
              strokeWidth="16" strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-5xl sm:text-6xl font-mono font-bold tracking-tight drop-shadow-lg ${activePomodoro.isBreak ? 'text-emerald-400' : 'text-indigo-300'}`}>
              {fmt(timeLeft)}
            </span>
            <span className="text-white/60 text-sm mt-2 drop-shadow">{activePomodoro.isBreak ? '休息' : '专注'}</span>
          </div>
        </div>

        {/* 按钮：计时中显示结束 */}
        {isRunning && (
          <button onClick={handleCancel}
            className="relative z-10 py-2.5 px-8 rounded-2xl bg-white/15 backdrop-blur-md text-white font-medium text-sm border border-white/20 hover:bg-white/25 transition-all"
          >
            结束计时
          </button>
        )}

        {/* 休息结束：继续或完成 */}
        {!isRunning && activePomodoro.isBreak && (
          <div className="flex flex-col gap-3 w-full max-w-xs relative z-10">
            <button onClick={handleContinue}
              className="py-3 rounded-2xl bg-indigo-500/90 text-white font-semibold hover:bg-indigo-600 transition-all"
            >
              🍅 继续番茄钟
            </button>
            <button onClick={handleFinish}
              className="py-3 rounded-2xl bg-emerald-500/90 text-white font-semibold hover:bg-emerald-600 transition-all"
            >
              ✅ 结束打卡（已完成 {activePomodoro.totalCycles + 1} 轮）
            </button>
          </div>
        )}

        {/* 音乐 */}
        <div className="mt-6 w-full max-w-sm relative z-10">
          <MusicPicker />
        </div>
      </div>
    </div>
  );
}
