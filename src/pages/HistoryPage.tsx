import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import CalendarHeatmap from '../components/CalendarHeatmap';
import EmptyState from '../components/EmptyState';
import { daysBetween } from '../utils/date';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

type ViewMode = 'heatmap' | 'weekly' | 'monthly' | 'yearly';

export default function HistoryPage() {
  const { state } = useApp();
  const [habitId, setHabitId] = useState<string>('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<ViewMode>('weekly');

  const activeHabits = state.habits.filter((h) => !h.archived);

  // Find first check-in date
  const firstCheckinDate = useMemo(() => {
    const filtered = habitId
      ? state.checkins.filter((c) => c.habitId === habitId)
      : state.checkins;
    if (filtered.length === 0) return null;
    return filtered.map((c) => c.date).sort()[0];
  }, [state.checkins, habitId]);

  const checkins = useMemo(() => {
    let c = habitId ? state.checkins.filter((x) => x.habitId === habitId) : state.checkins;
    if (firstCheckinDate) {
      c = c.filter((x) => x.date >= firstCheckinDate);
    }
    return c;
  }, [state.checkins, habitId, firstCheckinDate]);

  // Build weekly stats
  const weeklyData = useMemo(() => {
    if (!firstCheckinDate) return [];
    const end = new Date();
    const days = daysBetween(firstCheckinDate, end.toISOString().slice(0, 10));
    if (days.length === 0) return [];

    const checkinSet = new Set(checkins.map((c) => c.date));

    // Group by ISO week
    const weeks: { label: string; daysChecked: number; totalDays: number }[] = [];
    let weekStart = new Date(days[0] + 'T00:00:00');
    // align to Monday
    const day = weekStart.getDay();
    const offset = day === 0 ? -6 : 1 - day;
    weekStart.setDate(weekStart.getDate() + offset);

    let currentWeek = { label: '', daysChecked: 0, totalDays: 0 };
    for (const dateStr of days) {
      const d = new Date(dateStr + 'T00:00:00');
      // start new week if we crossed monday boundary
      if (d >= weekStart && currentWeek.totalDays > 0 && d.getDay() === 1) {
        weeks.push(currentWeek);
        currentWeek = { label: '', daysChecked: 0, totalDays: 0 };
        weekStart = new Date(d);
      }
      currentWeek.totalDays++;
      if (checkinSet.has(dateStr)) currentWeek.daysChecked++;
    }
    weeks.push(currentWeek);

    return weeks.map((w, i) => ({
      name: `W${i + 1}`,
      完成率: Math.round((w.daysChecked / Math.max(1, w.totalDays)) * 100),
    }));
  }, [checkins, firstCheckinDate]);

  // Monthly stats
  const monthlyData = useMemo(() => {
    if (!firstCheckinDate) return [];
    const checkinSet = new Set(checkins.map((c) => c.date));
    const [fy, fm] = firstCheckinDate.split('-').map(Number);
    const now = new Date();
    const result: { name: string; 完成率: number }[] = [];

    for (let y = fy; y <= now.getFullYear(); y++) {
      const startM = y === fy ? fm : 1;
      const endM = y === now.getFullYear() ? now.getMonth() + 1 : 12;
      for (let m = startM; m <= endM; m++) {
        const monthStr = `${y}-${String(m).padStart(2, '0')}`;
        const totalDays = daysBetween(
          `${monthStr}-01`,
          `${monthStr}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`
        ).length;
        const checked = daysBetween(
          `${monthStr}-01`,
          `${monthStr}-${String(new Date(y, m, 0).getDate()).padStart(2, '0')}`
        ).filter((d) => checkinSet.has(d)).length;
        result.push({
          name: `${y}年${m}月`,
          完成率: Math.round((checked / Math.max(1, totalDays)) * 100),
        });
      }
    }
    return result;
  }, [checkins, firstCheckinDate]);

  // Yearly stats
  const yearlyData = useMemo(() => {
    if (!firstCheckinDate) return [];
    const checkinSet = new Set(checkins.map((c) => c.date));
    const fy = parseInt(firstCheckinDate.slice(0, 4));
    const now = new Date();
    const result: { name: string; 完成率: number }[] = [];

    for (let y = fy; y <= now.getFullYear(); y++) {
      const isFullYear = y > fy && y < now.getFullYear();
      const totalDays = isFullYear ? 365 : daysBetween(
        `${y}-01-01`,
        y === now.getFullYear() ? now.toISOString().slice(0, 10) : `${y}-12-31`
      ).length;
      const checked = daysBetween(
        `${y}-01-01`,
        y === now.getFullYear() ? now.toISOString().slice(0, 10) : `${y}-12-31`
      ).filter((d) => checkinSet.has(d)).length;
      result.push({
        name: `${y}年`,
        完成率: Math.round((checked / Math.max(1, totalDays)) * 100),
      });
    }
    return result;
  }, [checkins, firstCheckinDate]);

  const chartData = viewMode === 'weekly' ? weeklyData : viewMode === 'monthly' ? monthlyData : yearlyData;
  const chartColor = viewMode === 'weekly' ? '#6366f1' : viewMode === 'monthly' ? '#10b981' : '#f59e0b';

  return (
    <div className="min-h-dvh relative" style={{ background: 'linear-gradient(180deg, #ffe8d0 0%, #fde4cc 10%, #fef0e4 30%, #fef8f2 55%, #fefcf8 100%)' }}>
      <div className="absolute top-4 right-6 w-16 h-16 rounded-full opacity-25 pointer-events-none" style={{ background: 'radial-gradient(circle, #ffcc80, transparent 70%)' }} />
    <div className="max-w-lg mx-auto px-4 pt-4 sm:pt-6 pb-4 relative z-10">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-1">历史记录</h1>
      <p className="text-gray-400 dark:text-gray-500 mb-6">打卡记录与完成率统计</p>

      {activeHabits.length === 0 ? (
        <EmptyState icon="📅" title="还没有习惯" description="先创建习惯才能查看历史记录" />
      ) : !firstCheckinDate ? (
        <EmptyState icon="📅" title="还没有打卡记录" description="开始打卡后这里会显示历史数据" />
      ) : (
        <div className="space-y-4">
          {/* Filter */}
          <div className="flex items-center gap-3">
            <select
              value={habitId}
              onChange={(e) => setHabitId(e.target.value)}
              className="flex-1 px-4 py-2 rounded-xl border dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
            >
              <option value="">全部习惯</option>
              {activeHabits.map((h) => (
                <option key={h.id} value={h.id}>{h.emoji} {h.name}</option>
              ))}
            </select>
          </div>

          {/* View mode tabs */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            {([
              { key: 'weekly' as ViewMode, label: '本周率' },
              { key: 'monthly' as ViewMode, label: '月完成率' },
              { key: 'yearly' as ViewMode, label: '年完成率' },
              { key: 'heatmap' as ViewMode, label: '热力图' },
            ]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setViewMode(key)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                  viewMode === key
                    ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-500'
                    : 'text-gray-500'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Chart or Heatmap */}
          {viewMode === 'heatmap' ? (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4">
              <div className="flex justify-end mb-2">
                <div className="flex items-center gap-1">
                  <button onClick={() => setYear(y => y - 1)} className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">←</button>
                  <span className="text-sm font-medium w-12 text-center">{year}</span>
                  <button onClick={() => setYear(y => y + 1)} className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-sm">→</button>
                </div>
              </div>
              <CalendarHeatmap checkins={checkins} habitId={habitId || undefined} year={year} />
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-4">
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3">
                {viewMode === 'weekly' ? '每周打卡完成率 (%)' :
                 viewMode === 'monthly' ? '每月打卡完成率 (%)' : '每年打卡完成率 (%)'}
              </h3>
              <p className="text-xs text-gray-400 mb-3">
                统计范围：{firstCheckinDate} ~ {new Date().toISOString().slice(0, 10)}
              </p>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    interval={viewMode === 'weekly' ? Math.max(0, Math.floor(chartData.length / 8) - 1) : 0}
                    angle={viewMode === 'monthly' ? -45 : 0}
                    textAnchor={viewMode === 'monthly' ? 'end' : 'middle'}
                    height={viewMode === 'monthly' ? 60 : 30}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => `${v}%`} />
                  <Bar dataKey="完成率" fill={chartColor} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 text-center">
              <div className="text-2xl font-bold text-indigo-500">
                {weeklyData.length > 0 ? Math.round(weeklyData.reduce((s, w) => s + w.完成率, 0) / weeklyData.length) : 0}%
              </div>
              <div className="text-xs text-gray-400 mt-1">平均周完成率</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 text-center">
              <div className="text-2xl font-bold text-emerald-500">
                {monthlyData.length > 0 ? Math.round(monthlyData.reduce((s, m) => s + m.完成率, 0) / monthlyData.length) : 0}%
              </div>
              <div className="text-xs text-gray-400 mt-1">平均月完成率</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-3 text-center">
              <div className="text-2xl font-bold text-amber-500">{checkins.length}</div>
              <div className="text-xs text-gray-400 mt-1">总打卡次数</div>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
