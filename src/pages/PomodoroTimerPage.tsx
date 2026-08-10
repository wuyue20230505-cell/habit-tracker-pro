import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  stopSoundscape,
  setVolume,
  startSoundscape,
  playDingSound,
} from '../utils/audio';
import MusicPicker from '../components/MusicPicker';

export default function PomodoroTimerPage() {
  const { state, stopPomodoro, startBreak, addCheckin, addPomodoroRecord } = useApp();
  const navigate = useNavigate();
  const { activePomodoro } = state;

  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedTime, setPausedTime] = useState(0);
  const intervalRef = useRef<number | null>(null);
  const pomoRef = useRef(activePomodoro);
  pomoRef.current = activePomodoro;
  // 剩余秒数用 ref 追踪：副作用（打卡/记录/切休息）必须放在 setState updater 之外，
  // 否则 React（StrictMode/并发重渲染）会重复执行 updater 导致记录双倍
  const timeLeftRef = useRef(0);

  useEffect(() => {
    if (!activePomodoro) navigate('/checkin', { replace: true });
  }, [activePomodoro, navigate]);

  useEffect(() => {
    if (!activePomodoro) return;
    if (isPaused) return;

    const phaseDuration = activePomodoro.isBreak
      ? activePomodoro.breakMinutes * 60
      : activePomodoro.workMinutes * 60;
    // 暂停恢复用冻结时间
    const remaining = pausedTime > 0 ? pausedTime
      : Math.max(0, phaseDuration - Math.floor((Date.now() - activePomodoro.phaseStartedAt) / 1000));
    timeLeftRef.current = remaining;
    setTimeLeft(remaining);
    if (pausedTime > 0) setPausedTime(0);
    setIsRunning(true);

    const id = window.setInterval(() => {
      const next = timeLeftRef.current - 1;
      timeLeftRef.current = next;
      setTimeLeft(Math.max(0, next));
      if (next <= 0) {
        clearInterval(id);
        setIsRunning(false);
        // 副作用在 updater 外，只执行一次
        const p = pomoRef.current;
        if (!p) return;
        if (!p.isBreak) {
          addCheckin(p.habitId);
          addPomodoroRecord(p.workMinutes);
          playDingSound();
          startBreak();
          startSoundscape('mariage');
        } else {
          // 休息结束 → 停音乐
          stopSoundscape();
        }
      }
    }, 1000);
    intervalRef.current = id;
    return () => clearInterval(id);
  }, [activePomodoro?.phaseStartedAt, activePomodoro?.isBreak, isPaused]);

  const handlePause = () => {
    if (isPaused) {
      setTimeLeft(pausedTime);
      setIsPaused(false);
      setVolume(0.4);
    } else {
      setPausedTime(timeLeft);
      setIsPaused(true);
      setVolume(0);
    }
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
            {activePomodoro.isBreak ? '☕ 休息时间' : '🍅 专注时间'}
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

        {/* 按钮：暂停/继续切换 + 结束 */}
        {!(!isRunning && !isPaused && activePomodoro.isBreak) && (
          <div className="flex gap-3 relative z-10">
            <button onClick={handlePause}
              className={`py-2.5 px-6 rounded-2xl text-white font-medium text-sm transition-all ${
                isPaused ? 'bg-indigo-500/80 hover:bg-indigo-500' : 'bg-amber-500/80 hover:bg-amber-500'
              }`}
            >
              {isPaused ? '▶ 继续' : '⏸ 暂停'}
            </button>
            <button onClick={handleCancel}
              className="py-2.5 px-6 rounded-2xl bg-white/15 backdrop-blur-md text-white font-medium text-sm border border-white/20 hover:bg-white/25 transition-all"
            >
              结束
            </button>
          </div>
        )}

        {/* 休息结束：停留在页面 */}
        {!isRunning && !isPaused && activePomodoro.isBreak && (
          <div className="flex flex-col gap-3 relative z-10">
            <p className="text-white/60 text-sm drop-shadow text-center">✅ 专注完成</p>
            <button onClick={handleCancel}
              className="py-2.5 px-8 rounded-2xl bg-white/15 backdrop-blur-md text-white font-medium text-sm border border-white/20 hover:bg-white/25 transition-all">
              返回打卡页
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
