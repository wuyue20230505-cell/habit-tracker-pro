import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Checkin } from '../types';
import { daysBetween } from '../utils/date';

interface Props {
  checkins: Checkin[];
  habitId?: string;
  days?: number;
}

export default function TrendChart({ checkins, habitId, days = 30 }: Props) {
  const data = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days + 1);
    const startStr = start.toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);
    const allDays = daysBetween(startStr, endStr);

    const filtered = habitId
      ? checkins.filter((c) => c.habitId === habitId)
      : checkins;

    const dayCount: Record<string, number> = {};
    for (const c of filtered) {
      dayCount[c.date] = (dayCount[c.date] || 0) + 1;
    }

    return allDays.map((d) => ({
      date: d.slice(5),
      count: dayCount[d] || 0,
    }));
  }, [checkins, habitId, days]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4">
      <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">近{days}天打卡趋势</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={Math.floor(days / 6)} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="count"
            name="打卡数"
            stroke="#6366f1"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
