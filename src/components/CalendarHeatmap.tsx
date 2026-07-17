import { useMemo } from 'react';
import type { Checkin } from '../types';

interface Props {
  checkins: Checkin[];
  habitId?: string;
  year: number;
}

export default function CalendarHeatmap({ checkins, habitId, year }: Props) {
  const data = useMemo(() => {
    const filtered = habitId
      ? checkins.filter((c) => c.habitId === habitId)
      : checkins;

    const dateCount: Record<string, number> = {};
    for (const c of filtered) {
      dateCount[c.date] = (dateCount[c.date] || 0) + 1;
    }

    const weeks: { date: string; count: number }[][] = [];
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);

    let currentWeek: { date: string; count: number }[] = [];
    // pad to Sunday-start
    const firstDay = start.getDay();
    for (let i = 0; i < firstDay; i++) {
      currentWeek.push({ date: '', count: -1 });
    }

    const d = new Date(start);
    while (d <= end) {
      const dateStr = d.toISOString().slice(0, 10);
      currentWeek.push({ date: dateStr, count: dateCount[dateStr] || 0 });
      if (d.getDay() === 6) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      d.setDate(d.getDate() + 1);
    }
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({ date: '', count: -1 });
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }, [checkins, habitId, year]);

  const maxCount = Math.max(1, ...data.flat().map((d) => d.count).filter((c) => c >= 0));

  function colorClass(count: number): string {
    if (count < 0) return 'invisible';
    if (count === 0) return 'bg-gray-100 dark:bg-gray-800';
    const level = Math.ceil((count / maxCount) * 4);
    const colors = [
      'bg-gray-100 dark:bg-gray-800',
      'bg-indigo-200 dark:bg-indigo-900',
      'bg-indigo-300 dark:bg-indigo-700',
      'bg-indigo-400 dark:bg-indigo-500',
      'bg-indigo-500 dark:bg-indigo-400',
    ];
    return colors[level];
  }

  const months = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

  return (
    <div className="overflow-x-auto">
      <div className="flex gap-1 text-xs text-gray-400 mb-1 ml-8">
        {months.map((m, i) => (
          <div key={i} style={{ width: `${Math.max(1, data.filter((_, wi) => {
            const mid = data[Math.min(wi + 1, data.length - 1)];
            if (!mid) return false;
            const d = mid.find((x) => x.date.startsWith(`${year}-${String(i+1).padStart(2,'0')}`));
            return !!d;
          }).length * 14)}px` }}>{m}</div>
        ))}
      </div>
      <div className="flex gap-1">
        <div className="flex flex-col gap-1 text-xs text-gray-400 mr-1">
          {['', '一', '', '三', '', '五', ''].map((t, i) => (
            <span key={i} className="h-3">{t}</span>
          ))}
        </div>
        {data.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day, di) => (
              <div
                key={di}
                title={day.date || ''}
                className={`w-3 h-3 rounded-sm ${colorClass(day.count)}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
