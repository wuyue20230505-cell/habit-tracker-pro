import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Checkin } from '../types';
import { getWeekdayName } from '../utils/date';

interface Props {
  checkins: Checkin[];
  habitId?: string;
}

export default function WeeklyChart({ checkins, habitId }: Props) {
  const data = useMemo(() => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(now);
    monday.setDate(now.getDate() + mondayOffset);

    const filtered = habitId
      ? checkins.filter((c) => c.habitId === habitId)
      : checkins;

    const dayCount: Record<string, number> = {};
    for (const c of filtered) {
      dayCount[c.date] = (dayCount[c.date] || 0) + 1;
    }

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().slice(0, 10);
      return {
        name: getWeekdayName(d.getDay()),
        count: dayCount[dateStr] || 0,
        isToday: dateStr === now.toISOString().slice(0, 10),
      };
    });
  }, [checkins, habitId]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4">
      <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">本周打卡</h3>
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Bar dataKey="count" name="打卡数" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
