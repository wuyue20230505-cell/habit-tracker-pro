import { useMemo } from 'react';
import type { Checkin, Habit } from '../types';
import { today } from '../utils/date';

interface Props {
  habits: Habit[];
  checkins: Checkin[];
  habitId?: string;
}

// Calculate streak on dates that have ANY checkin (for all-habits view)
function calcDateStreak(dates: Set<string>, fromDate: string): number {
  let streak = 0;
  const d = new Date(fromDate + 'T00:00:00');
  while (dates.has(d.toISOString().slice(0, 10))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function calcLongestDateStreak(dates: Set<string>): number {
  const sorted = [...dates].sort();
  if (sorted.length === 0) return 0;
  let longest = 1;
  let current = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + 'T00:00:00');
    const curr = new Date(sorted[i] + 'T00:00:00');
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) { current++; longest = Math.max(longest, current); }
    else { current = 1; }
  }
  return longest;
}

export default function OverviewCards({ habits, checkins, habitId }: Props) {
  const stats = useMemo(() => {
    const filtered = habitId ? checkins.filter((c) => c.habitId === habitId) : checkins;
    const filteredHabits = habitId
      ? habits.filter((h) => h.id === habitId)
      : habits.filter((h) => !h.archived);

    const total = filtered.length;
    const date = today();

    let currentStreak = 0;
    let bestStreak = 0;

    if (habitId) {
      // Single habit: streak for that habit
      const dates = new Set(filtered.map((c) => c.date));
      currentStreak = calcDateStreak(dates, date);
      bestStreak = calcLongestDateStreak(dates);
    } else {
      // All habits: streak on days with ANY checkin
      const allDates = new Set(filtered.map((c) => c.date));
      currentStreak = calcDateStreak(allDates, date);
      bestStreak = calcLongestDateStreak(allDates);
    }

    return { total, bestStreak, currentStreak, habitCount: filteredHabits.length };
  }, [habits, checkins, habitId]);

  const cards = [
    { label: '总打卡', value: stats.total, icon: '✅', unit: '次' },
    { label: '当前连续', value: stats.currentStreak, icon: '🔥', unit: '天' },
    { label: '最长连续', value: stats.bestStreak, icon: '🏆', unit: '天' },
    { label: '活跃习惯', value: stats.habitCount, icon: '📋', unit: '个' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((c) => (
        <div key={c.label} className="bg-white dark:bg-gray-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
            <span>{c.icon}</span>
            <span>{c.label}</span>
          </div>
          <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">
            {c.value}
            <span className="text-sm font-normal text-gray-400 ml-1">{c.unit}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
