import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  startSoundscape,
  getPlayingState,
  playWorkCompleteSound,
  playBreakEndSound,
} from '../utils/audio';

// 后台番茄钟计时器：用户从专注页返回打卡页后，番茄钟继续计时。
// 2026-08-13 起不再显示悬浮框 UI（用户要求去掉），进度改为显示在对应习惯卡片下（见 HabitCard）。
// 专注结束 → 自动打卡 + 记录 + 切休息（与专注页行为一致）。
export default function PomodoroOverlay() {
  const { state, addCheckin, addPomodoroRecord, startBreak } = useApp();
  const location = useLocation();
  const { activePomodoro } = state;
  const intervalRef = useRef<number | null>(null);
  const hasAlerted = useRef(false);

  const isOnTimerPage = location.pathname === '/pomodoro-timer';

  // 背景计时（专注页有自己的计时器，两者互斥）
  useEffect(() => {
    if (!activePomodoro || isOnTimerPage) return;

    const phaseDuration = activePomodoro.isBreak
      ? activePomodoro.breakMinutes * 60
      : activePomodoro.workMinutes * 60;
    const elapsed = Math.floor((Date.now() - activePomodoro.phaseStartedAt) / 1000);
    let left = Math.max(0, phaseDuration - elapsed);
    hasAlerted.current = false;

    intervalRef.current = window.setInterval(() => {
      left -= 1;
      if (left <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        // 副作用在 updater 外（updater 会被 React 重复调用，必须保持纯函数）
        if (!hasAlerted.current) {
          hasAlerted.current = true;
          if (activePomodoro.isBreak) {
            playBreakEndSound();
          } else {
            // 与专注页一致：专注结束 → 自动打卡 + 记录 + 切休息
            addCheckin(activePomodoro.habitId);
            addPomodoroRecord(activePomodoro.workMinutes);
            playWorkCompleteSound();
            startBreak();
          }
        }
      }
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [activePomodoro?.phaseStartedAt, activePomodoro?.isBreak, isOnTimerPage]);

  // 返回打卡页且番茄钟仍在进行时，若没在放音乐则自动播放专注白噪音
  useEffect(() => {
    if (activePomodoro && !isOnTimerPage && !getPlayingState()) {
      startSoundscape('fire');
    }
  }, [activePomodoro, isOnTimerPage]);

  return null;
}
