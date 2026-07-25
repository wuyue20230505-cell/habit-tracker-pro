import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { today, formatDate } from '../utils/date';
import HabitCard from '../components/HabitCard';
import DateSlider from '../components/DateSlider';
import MusicPicker from '../components/MusicPicker';
import EmptyState from '../components/EmptyState';
import { useNavigate } from 'react-router-dom';

export default function TodayPage() {
  const { state, isCheckedIn } = useApp();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(today());
  const activeHabits = state.habits.filter((h) => !h.archived);

  const isToday = selectedDate === today();

  // Simple Chinese holiday check (major holidays)
  const isHoliday = (dateStr: string) => {
    const holidays = new Set([
      '2026-01-01','2026-01-28','2026-01-29','2026-01-30','2026-01-31','2026-02-01','2026-02-02', // 元旦+春节
      '2026-04-04','2026-04-05','2026-04-06', // 清明
      '2026-05-01','2026-05-02','2026-05-03','2026-05-04','2026-05-05', // 劳动
      '2026-05-31','2026-06-01', // 端午
      '2026-09-25','2026-09-26','2026-09-27', // 中秋+国庆
      '2026-10-01','2026-10-02','2026-10-03','2026-10-04','2026-10-05','2026-10-06','2026-10-07',
    ]);
    return holidays.has(dateStr);
  };

  const todaysHabits = activeHabits.filter((h) => {
    if (h.excludeHolidays && isHoliday(selectedDate)) return false;
    return true; // All habits visible every day, completion tracked by period
  });

  const completedCount = todaysHabits.filter((h) => isCheckedIn(h.id, selectedDate)).length;

  return (
    <div className="min-h-dvh relative" style={{
        background: 'url(/bg-checkin.jpg) center/cover no-repeat fixed',
      }}>
<div className="max-w-lg mx-auto px-4 pt-4 sm:pt-6 pb-4 relative z-10">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
          {isToday ? '今日打卡' : '打卡记录'}
        </h1>
        <p className="text-gray-400 dark:text-gray-500 mt-1">{formatDate(selectedDate)}</p>
      </div>

      <DateSlider selectedDate={selectedDate} onChange={setSelectedDate} />

      <MusicPicker />

      {todaysHabits.length === 0 ? (
        <EmptyState
          icon="🎯"
          title="没有打卡任务"
          description={activeHabits.length === 0 ? '先创建一个习惯吧' : '所选日期没有需要打卡的习惯'}
          action={
            activeHabits.length === 0
              ? { label: '创建习惯', onClick: () => navigate('/habits') }
              : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {todaysHabits.map((h) => (
            <HabitCard key={h.id} habit={h} selectedDate={selectedDate} />
          ))}
        </div>
      )}

      {todaysHabits.length > 0 && (
        <p className="text-center text-sm text-gray-300 dark:text-gray-600 mt-4">
          完成 {completedCount}/{todaysHabits.length}
        </p>
      )}
    </div>
    </div>
  );
}
