import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { today, formatDate } from '../utils/date';
import { isStatutoryHoliday, isWeekendRest } from '../utils/holidays';
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

  // 跳过日：法定节假日 / 周末休息（调休上班的周末不算休息）→ 隐藏该习惯卡片
  const todaysHabits = activeHabits.filter((h) => {
    if (h.excludeHolidays && isStatutoryHoliday(selectedDate)) return false;
    if (h.excludeWeekends && isWeekendRest(selectedDate)) return false;
    return true; // All habits visible every day, completion tracked by period
  });

  const completedCount = todaysHabits.filter((h) => isCheckedIn(h.id, selectedDate)).length;

  return (
    <div className="min-h-dvh relative" style={{
        background: 'url(/bg-checkin.jpg) center/cover no-repeat', backgroundAttachment: 'fixed', minHeight: '100dvh', filter: 'saturate(1.08) brightness(1.04) contrast(1.05)',
      }}>
<div className="max-w-lg mx-auto px-4 pt-4 sm:pt-6 pb-4 relative z-10">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
          {isToday ? '今日打卡' : '打卡记录'}
        </h1>
        <p className="text-white/80 drop-shadow mt-1">{formatDate(selectedDate)}</p>
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
