import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useStreak } from '../hooks/useStreak';
import type { Habit } from '../types';

interface Props {
  habit: Habit;
  selectedDate: string;
}

export default function HabitCard({ habit, selectedDate }: Props) {
  const { addCheckin, removeCheckin, getCheckinCount, isCheckedIn, startPomodoro, state } = useApp();
  const navigate = useNavigate();
  const [conflict, setConflict] = useState(false);
  const date = selectedDate;
  const checked = isCheckedIn(habit.id, date);
  const count = getCheckinCount(habit.id, date);
  const goal = habit.dailyGoal ?? 1;
  const { current } = useStreak(
    state.checkins,
    habit.id,
    checked ? date : new Date(new Date(date).setDate(new Date(date).getDate() - 1)).toISOString().slice(0, 10)
  );

  // Count pomodoro cycles completed today for this habit
  const pomodoroCyclesToday = useMemo(() => {
    // Each checkin represents one completed pomodoro cycle
    return getCheckinCount(habit.id, date);
  }, [state.checkins, habit.id, date]);

  const handleCheckin = () => {
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
    if (!checked) {
      addCheckin(habit.id, date);
    } else {
      removeCheckin(habit.id, date);
    }
  };

  return (
    <div
      className={`rounded-3xl p-4 transition-all duration-200 ${
        checked
          ? 'bg-indigo-50/80 dark:bg-indigo-900/20 border-2 border-indigo-200/60 dark:border-indigo-700/40 shadow-md shadow-indigo-100/50'
          : 'bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-2 border-gray-100 dark:border-gray-700/50 shadow-sm hover:shadow-md'
      }`}
    >
      <div className="flex items-center gap-4">
        <button
          onClick={handleCheckin}
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-xl sm:text-2xl transition-all active:scale-90 shrink-0 ${
            checked
              ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
              : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          {checked ? '✓' : habit.emoji}
        </button>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-800 dark:text-gray-200 truncate text-sm sm:text-base">{habit.name}</h3>
          <div className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-400 dark:text-gray-500 mt-0.5 flex-wrap">
            <span>🔥 {current} 天</span>
            {goal > 1 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                checked ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-500' : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                {count}/{goal}
              </span>
            )}
            {habit.usePomodoro && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-500">
                🍅{pomodoroCyclesToday > 0 ? `×${pomodoroCyclesToday}` : ` ${habit.pomodoroMinutes || 25}分钟`}
              </span>
            )}
          </div>
        </div>

        {goal > 1 && !checked && count > 0 && (
          <button
            onClick={() => removeCheckin(habit.id, date)}
            className="text-sm px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-400"
          >
            −
          </button>
        )}
      </div>

      {conflict && (
        <div className="mt-3 bg-white/20 dark:bg-black/25 border border-amber-200 dark:border-amber-800 rounded-xl p-3 text-sm text-amber-600 dark:text-amber-400 text-center animate-pulse">
          ⚠️ 上一个打卡还未完成，请等番茄钟结束后再开始新的
        </div>
      )}
    </div>
  );
}
