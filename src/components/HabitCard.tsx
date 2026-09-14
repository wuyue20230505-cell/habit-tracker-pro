import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useStreak } from '../hooks/useStreak';
import type { Habit } from '../types';

interface Props {
  habit: Habit;
  selectedDate: string;
}

export default function HabitCard({ habit, selectedDate }: Props) {
  const { addCheckin, getCheckinCount, isCheckedIn, startPomodoro, state } = useApp();
  const navigate = useNavigate();
  const [conflict, setConflict] = useState(false);
  const date = selectedDate;
  const checked = isCheckedIn(habit.id, date);
  const count = getCheckinCount(habit.id, date);
  const goal = habit.dailyGoal ?? 1;
  // 本习惯进行中的番茄钟 → 卡片下显示与专注页一致的进度条
  const activePomo = state.activePomodoro?.habitId === habit.id ? state.activePomodoro : null;
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!activePomo) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [activePomo?.phaseStartedAt, activePomo?.isBreak]);

  const pomoPhaseDuration = activePomo
    ? (activePomo.isBreak ? activePomo.breakMinutes : activePomo.workMinutes) * 60
    : 0;
  const pomoRemaining = activePomo
    ? Math.max(0, pomoPhaseDuration - Math.floor((now - activePomo.phaseStartedAt) / 1000))
    : 0;
  const pomoPct = pomoPhaseDuration > 0 ? (pomoRemaining / pomoPhaseDuration) * 100 : 0;
  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60), sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };
  const { current } = useStreak(
    state.checkins,
    habit.id,
    checked ? date : new Date(new Date(date).setDate(new Date(date).getDate() - 1)).toISOString().slice(0, 10),
    habit
  );

  // 计算周期进度（每周/每月已完成多少天）
  const periodProgress = useMemo(() => {
    if (habit.frequency.type === 'daily') return null;

    const checkins = state.checkins.filter(c => c.habitId === habit.id);

    if (habit.frequency.type === 'weekly') {
      const dt = new Date(date + 'T00:00:00');
      const day = dt.getDay();
      const monday = new Date(dt);
      monday.setDate(dt.getDate() - (day === 0 ? 6 : day - 1));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const mondayStr = monday.toISOString().slice(0, 10);
      const sundayStr = sunday.toISOString().slice(0, 10);
      const days = new Set(
        checkins.filter(c => c.date >= mondayStr && c.date <= sundayStr).map(c => c.date)
      );
      return { current: Math.min(days.size, (habit.frequency as { type: 'weekly'; count: number }).count), total: (habit.frequency as { type: 'weekly'; count: number }).count, label: '天/周' };
    }

    if (habit.frequency.type === 'monthly') {
      const monthPrefix = date.slice(0, 7);
      const days = new Set(
        checkins.filter(c => c.date.startsWith(monthPrefix)).map(c => c.date)
      );
      return { current: Math.min(days.size, (habit.frequency as { type: 'monthly'; count: number }).count), total: (habit.frequency as { type: 'monthly'; count: number }).count, label: '天/月' };
    }

    return null;
  }, [state.checkins, habit.id, habit.frequency, date]);

  const handleCheckin = () => {
    // 该习惯已有进行中的番茄钟 → 重新进入专注页（不新建、不打卡）
    if (habit.usePomodoro && state.activePomodoro?.habitId === habit.id) {
      navigate('/pomodoro-timer');
      return;
    }

    // 每日打卡次数已达上限（番茄钟和普通打卡都受此限制）
    if (count >= goal) return;

    if (habit.usePomodoro && !checked) {
      if (state.activePomodoro) {
        setConflict(true);
        setTimeout(() => setConflict(false), 2500);
        return;
      }
      startPomodoro(habit, date);
      navigate('/pomodoro-timer');
      return;
    }
    addCheckin(habit.id, date);
  };

  return (
    <div
      className={`rounded-3xl p-4 transition-all duration-200 ${
        checked
          ? 'bg-indigo-50/80 dark:bg-indigo-900/20 border-2 border-indigo-200/60 dark:border-indigo-700/40 shadow-md shadow-indigo-100/50'
          : 'bg-white/20 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md'
      }`}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={handleCheckin}
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-xl sm:text-2xl transition-all active:scale-90 shrink-0 ${
            checked
              ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
              : 'bg-white/10 dark:bg-white/5 hover:bg-white/20 dark:hover:bg-white/15'
          }`}
        >
          {checked ? '✓' : habit.emoji}
        </button>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 truncate text-sm sm:text-base">{habit.name}</h3>
          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-400 dark:text-gray-500 mt-0.5 flex-wrap">
            <span>🔥 {current} 天</span>
            {/* 每日打卡进度，始终显示 */}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              count >= goal ? 'bg-indigo-500/20 dark:bg-indigo-500/20 text-indigo-500' : 'bg-white/10 dark:bg-white/5'
            }`}>
              {Math.min(count, goal)}/{goal}
            </span>
            {/* 周/月周期进度（已完成多少天） */}
            {periodProgress && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                periodProgress.current >= periodProgress.total ? 'bg-indigo-500/20 dark:bg-indigo-500/20 text-indigo-500' : 'bg-white/10 dark:bg-white/5'
              }`}>
                {periodProgress.current}/{periodProgress.total}{periodProgress.label}
              </span>
            )}
            {habit.usePomodoro && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                count >= goal ? 'bg-indigo-500/20 dark:bg-indigo-500/20 text-indigo-500' : 'bg-orange-100 dark:bg-orange-900/30 text-orange-500'
              }`}>
                🍅{count > 0 ? `${Math.min(count, goal)}/${goal}` : ` ${habit.pomodoroMinutes || 25}分钟`}
              </span>
            )}
          </div>
        </div>

      </div>

      {/* 进行中的番茄钟进度条：剩余时间与专注页计时一致 */}
      {activePomo && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className={activePomo.isBreak ? 'text-emerald-500' : 'text-indigo-500'}>
              {activePomo.isBreak ? '☕ 休息中' : '🍅 专注中'}
            </span>
            <span className="text-gray-500 tabular-nums">{fmtTime(pomoRemaining)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/10 dark:bg-white/5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-linear ${activePomo.isBreak ? 'bg-emerald-400' : 'bg-indigo-400'}`}
              style={{ width: `${pomoPct}%` }}
            />
          </div>
        </div>
      )}

      {conflict && (
        <div className="mt-3 bg-white/20 dark:bg-black/25 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-sm text-amber-600 dark:text-amber-400 text-center animate-pulse">
          ⚠️ 上一个打卡还未完成，请等番茄钟结束后再开始新的
        </div>
      )}
    </div>
  );
}
