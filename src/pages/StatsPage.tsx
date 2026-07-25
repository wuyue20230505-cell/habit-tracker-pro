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
    <div className="min-h-dvh relative" style={{ background: 'linear-gradient(180deg, #d4eaf7 0%, #e0f0f8 12%, #edf6fb 35%, #f7fafd 60%, #fdfefe 100%)' }}>
      {/* 波浪底边 */}
      <div className="absolute bottom-0 left-0 right-0 h-1/4 pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-full" style={{ background: 'linear-gradient(180deg, transparent, rgba(130,190,220,0.08), rgba(100,170,210,0.12))', clipPath: 'polygon(0% 70%, 10% 60%, 25% 68%, 40% 55%, 55% 65%, 70% 52%, 85% 62%, 100% 58%, 100% 100%, 0% 100%)' }} />
      </div>
    <div className="max-w-lg mx-auto px-4 pt-4 sm:pt-6 pb-4 relative z-10">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-1">数据统计</h1>
      <p className="text-gray-400 dark:text-gray-500 mb-6">你的打卡数据总览</p>

      {activeHabits.length === 0 ? (
        <EmptyState icon="📊" title="还没有数据" description="创建习惯并开始打卡后，这里会显示统计数据" />
      ) : (
        <div className="space-y-4">
          {/* Filter */}
          <select
            value={habitId}
            onChange={(e) => setHabitId(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
          >
            <option value="">全部习惯</option>
            {activeHabits.map((h) => (
              <option key={h.id} value={h.id}>{h.emoji} {h.name}</option>
            ))}
          </select>

          <OverviewCards
            habits={state.habits}
            checkins={state.checkins}
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
