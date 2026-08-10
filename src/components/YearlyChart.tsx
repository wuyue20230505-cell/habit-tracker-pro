import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Checkin } from '../types';
import { getMonthName } from '../utils/date';

interface Props {
  checkins: Checkin[];
  habitId?: string;
  year: number;
  onYearChange: (year: number) => void;
}

export default function YearlyChart({ checkins, habitId, year, onYearChange }: Props) {
  const data = useMemo(() => {
    const filtered = habitId
      ? checkins.filter((c) => c.habitId === habitId)
      : checkins;

    return Array.from({ length: 12 }, (_, i) => {
      const monthStr = `${year}-${String(i + 1).padStart(2, '0')}`;
      const count = filtered.filter((c) => c.date.startsWith(monthStr)).length;
      return { name: getMonthName(i), count };
    });
  }, [checkins, habitId, year]);

  return (
    <div className="bg-white/15 dark:bg-black/20 backdrop-blur-md rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-700 dark:text-gray-300">年度打卡</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onYearChange(year - 1)}
            className="text-sm px-2 py-1 rounded-lg hover:bg-white/15 dark:hover:bg-white/10"
          >
            ←
          </button>
          <span className="text-sm font-medium">{year}</span>
          <button
            onClick={() => onYearChange(year + 1)}
            className="text-sm px-2 py-1 rounded-lg hover:bg-white/15 dark:hover:bg-white/10"
          >
            →
          </button>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="count" name="打卡数" fill="#f59e0b" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
