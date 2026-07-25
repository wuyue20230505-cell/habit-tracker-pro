import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  startSoundscape,
  stopSoundscape,
  getPlayingState,
  playWorkCompleteSound,
  playBreakEndSound,
  type SoundscapeType,
} from '../utils/audio';

export default function PomodoroOverlay() {
  const { state, addCheckin, stopPomodoro, startBreak, incrementCycle } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const { activePomodoro } = state;
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [musicType, setMusicType] = useState<SoundscapeType>('fire');
  const intervalRef = useRef<number | null>(null);
  const hasAlerted = useRef(false);

  const isOnTimerPage = location.pathname === '/pomodoro-timer';

  // Don't show overlay on timer page (full screen version is there)
  if (!activePomodoro || isOnTimerPage) return null;

  // Timer logic (same as timer page)
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

  // Start music if not playing
  useEffect(() => {
    if (!getPlayingState()) {
      startSoundscape('fire');
      setMusicType('fire');
    }
  }, []);

  const handleContinue = () => {
    incrementCycle();
  };

  const handleFinish = () => {
    addCheckin(activePomodoro!.habitId);
    stopPomodoro();
    stopSoundscape();
  };

  const handleCancel = () => {
    stopPomodoro();
    stopSoundscape();
    navigate('/checkin');
  };

  const handleMusicChange = (type: SoundscapeType) => {
    setMusicType(type);
    if (type === 'none') stopSoundscape();
    else startSoundscape(type);
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-20 inset-x-0 z-40 flex justify-center pointer-events-none">
      <div className="pointer-events-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border dark:border-gray-700 mx-4 p-4 w-full max-w-sm">
        {/* Click to go to timer page */}
        <button
          onClick={() => navigate('/pomodoro-timer')}
          className="w-full text-left"
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xl">{activePomodoro.habitEmoji}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                {activePomodoro.isBreak ? '☕ 休息中' : `🍅 ${activePomodoro.habitName}`}
              </div>
              <div className="text-xs text-gray-400">
                第 {activePomodoro.totalCycles + 1} 轮 · {fmt(timeLeft)}
              </div>
            </div>
          </div>
        </button>

        {/* Break: action buttons */}
        {!isRunning && activePomodoro.isBreak && (
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleContinue}
              className="flex-1 py-1.5 rounded-lg bg-indigo-500 text-white text-xs font-medium"
            >
              继续
            </button>
            <button
              onClick={handleFinish}
              className="flex-1 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-medium"
            >
              完成打卡
            </button>
          </div>
        )}

        {/* Music + cancel */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t dark:border-gray-700">
          <div className="flex gap-1">
            {(['fire', 'ocean', 'canon', 'mariage', 'fivehundred', 'none'] as SoundscapeType[]).map((type) => (
              <button
                key={type}
                onClick={() => handleMusicChange(type)}
                className={`text-xs px-1 py-0.5 rounded ${musicType === type ? 'bg-indigo-100 dark:bg-indigo-900/30' : ''}`}
              >
                {type === 'fire' ? '🌧' : type === 'ocean' ? '🌊' : type === 'canon' ? '🎻' : type === 'mariage' ? '💒' : type === 'fivehundred' ? '🚂' : '🔇'}
              </button>
            ))}
          </div>
          <button onClick={handleCancel} className="text-xs text-red-400 hover:text-red-600 font-medium">
            结束
          </button>
        </div>
      </div>
    </div>
  );
}
