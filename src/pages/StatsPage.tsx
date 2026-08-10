import { useState } from 'react';
import { useApp } from '../context/AppContext';
import OverviewCards from '../components/OverviewCards';
import TrendChart from '../components/TrendChart';
import WeeklyChart from '../components/WeeklyChart';
import MonthlyHeatmap from '../components/MonthlyHeatmap';
import YearlyChart from '../components/YearlyChart';
import HabitBreakdown from '../components/HabitBreakdown';
import EmptyState from '../components/EmptyState';

export default function StatsPage() {
  const { state } = useApp();
  const [habitId, setHabitId] = useState<string>('');
  const [year, setYear] = useState(new Date().getFullYear());

  const activeHabits = state.habits.filter((h) => !h.archived);
  const now = new Date();

  return (
    <div className="min-h-dvh relative" style={{ background: 'url(/stats-1.jpg) center/cover no-repeat', backgroundAttachment: 'fixed', minHeight: '100dvh', filter: 'saturate(1.08) brightness(1.04) contrast(1.05)' }}>
<div className="max-w-lg mx-auto px-4 pt-4 sm:pt-6 pb-4 relative z-10">
      <h1 className="text-2xl font-bold text-white mb-1 drop-shadow-lg">数据统计</h1>
      <p className="text-white/80 drop-shadow mb-6">你的打卡数据总览</p>

      {activeHabits.length === 0 ? (
        <EmptyState icon="📊" title="还没有数据" description="创建习惯并开始打卡后，这里会显示统计数据" />
      ) : (
        <div className="space-y-4">
          {/* Filter */}
          <select
            value={habitId}
            onChange={(e) => setHabitId(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border dark:border-gray-600 bg-white/15 dark:bg-black/20 text-sm"
          >
            <option value="">全部习惯</option>
            {activeHabits.map((h) => (
              <option key={h.id} value={h.id}>{h.emoji} {h.name}</option>
            ))}
          </select>

          <OverviewCards
            habits={state.habits}
            checkins={state.checkins}
            pomodoroRecords={state.pomodoroRecords}
            habitId={habitId || undefined}
          />

          {!habitId && (
            <HabitBreakdown habits={state.habits} checkins={state.checkins} />
          )}

          <TrendChart
            checkins={state.checkins}
            habitId={habitId || undefined}
            days={30}
          />

          <WeeklyChart
            checkins={state.checkins}
            habitId={habitId || undefined}
          />

          <MonthlyHeatmap
            checkins={state.checkins}
            habitId={habitId || undefined}
            year={now.getFullYear()}
            month={now.getMonth()}
          />

          <YearlyChart
            checkins={state.checkins}
            habitId={habitId || undefined}
            year={year}
            onYearChange={setYear}
          />
        </div>
      )}
    </div>
    </div>
  );
}
