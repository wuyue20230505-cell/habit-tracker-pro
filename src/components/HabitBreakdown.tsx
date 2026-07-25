import { useMemo } from 'react';
import type { Checkin, Habit } from '../types';
import { calcStreak, calcLongestStreak } from '../utils/streak';
import { today } from '../utils/date';

interface Props {
  habits: Habit[];
  checkins: Checkin[];
}

export default function HabitBreakdown({ habits, checkins }: Props) {
  const data = useMemo(() => {
    const active = habits.filter((h) => !h.archived);
    const d = today();

    return active
      .map((h) => {
        const habitCheckins = checkins.filter((c) => c.habitId === h.id);
        const total = habitCheckins.length;
        const currentStreak = calcStreak(habitCheckins, h.id, d);
        const longestStreak = calcLongestStreak(habitCheckins, h.id);
        // Completion rate this week
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay() + (weekStart.getDay() === 0 ? -6 : 1));
        const weekStartStr = weekStart.toISOString().slice(0, 10);
        const weekCheckins = habitCheckins.filter((c) => c.date >= weekStartStr).length;

        return { habit: h, total, currentStreak, longestStreak, weekCheckins };
      })
      .sort((a, b) => b.total - a.total);
  }, [habits, checkins]);

  if (data.length === 0) return null;

  return (
    <div className="bg-white/15 dark:bg-black/20 backdrop-blur-md rounded-2xl p-4">
      <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">各习惯统计</h3>
      <div className="space-y-2">
        {data.map(({ habit, total, currentStreak, longestStreak, weekCheckins }) => (
          <div
            key={habit.id}
            className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50"
          >
            <span className="text-xl">{habit.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">{habit.name}</div>
              <div className="flex gap-3 text-xs text-gray-400 mt-0.5">
                <span>总 {total} 次</span>
                <span>本周 {weekCheckins} 次</span>
                <span>🔥 {currentStreak} 天</span>
                <span>🏆 {longestStreak} 天</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
