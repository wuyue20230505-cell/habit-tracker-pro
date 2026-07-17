import { useMemo } from 'react';
import type { Checkin } from '../types';
import { daysInMonth } from '../utils/date';

interface Props {
  checkins: Checkin[];
  habitId?: string;
  year: number;
  month: number;
}

export default function MonthlyHeatmap({ checkins, habitId, year, month }: Props) {
  const data = useMemo(() => {
    const total = daysInMonth(`${year}-${String(month + 1).padStart(2, '0')}-01`);
    const filtered = habitId
      ? checkins.filter((c) => c.habitId === habitId)
      : checkins;

    const dayCount: Record<string, number> = {};
    for (const c of filtered) {
      dayCount[c.date] = (dayCount[c.date] || 0) + 1;
    }

    const days: { day: number; count: number }[] = [];
    for (let i = 1; i <= total; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      days.push({ day: i, count: dayCount[dateStr] || 0 });
    }

    // pad to start on correct weekday (Mon=0)
    const firstDay = new Date(year, month, 1).getDay();
    const padStart = firstDay === 0 ? 6 : firstDay - 1;
    for (let i = 0; i < padStart; i++) {
      days.unshift({ day: 0, count: -1 });
    }

    return days;
  }, [checkins, habitId, year, month]);

  const maxCount = Math.max(1, ...data.map((d) => d.count).filter((c) => c >= 0));

  function colorClass(count: number): string {
    if (count < 0) return 'invisible';
    if (count === 0) return 'bg-gray-100 dark:bg-gray-700';
    const level = Math.ceil((count / maxCount) * 4);
    const colors = [
      'bg-gray-100 dark:bg-gray-700',
      'bg-emerald-200 dark:bg-emerald-900',
      'bg-emerald-300 dark:bg-emerald-700',
      'bg-emerald-400 dark:bg-emerald-500',
      'bg-emerald-500 dark:bg-emerald-400',
    ];
    return colors[level];
  }

  const weekHeaders = ['一', '二', '三', '四', '五', '六', '日'];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4">
      <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">本月打卡</h3>
      <div className="grid grid-cols-7 gap-1">
        {weekHeaders.map((w) => (
          <div key={w} className="text-center text-xs text-gray-400 mb-1">{w}</div>
        ))}
        {data.map((d, i) => (
          <div
            key={i}
            title={d.day > 0 ? `${month + 1}月${d.day}日` : ''}
            className={`aspect-square rounded-sm flex items-center justify-center text-xs ${colorClass(d.count)} ${
              d.day > 0 ? '' : 'invisible'
            }`}
          >
            {d.day > 0 ? d.day : ''}
          </div>
        ))}
      </div>
    </div>
  );
}
