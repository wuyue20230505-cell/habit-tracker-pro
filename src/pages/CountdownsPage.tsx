// 倒数日列表页：彩色卡片 + FAB 新建按钮 + 已过倒数日切换

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { calcDays, formatCountdownDate, isTomorrow } from '../utils/countdown';
import { solarToLunar, formatLunarDate } from '../utils/lunar';
import type { Countdown } from '../types';

export default function CountdownsPage() {
  const { state } = useApp();
  const navigate = useNavigate();
  const [showPast, setShowPast] = useState(false);

  // 跳过设置 → calcDays 参数
  const skipOf = (c: Countdown) => ({ holidays: c.skipHolidays, weekends: c.skipWeekends });

  // 分类：进行中（未来+重复） vs 已过（仅不重复且已过期）
  const activeList: Countdown[] = [];
  const pastList: Countdown[] = [];

  for (const c of state.countdowns) {
    const { isPast } = calcDays(c.targetDate, c.repeat, skipOf(c));
    if (isPast && c.repeat === 'none') {
      pastList.push(c);
    } else {
      activeList.push(c);
    }
  }

  // 各自排序
  const sortActive = (list: Countdown[]) => [...list].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    const da = calcDays(a.targetDate, a.repeat, skipOf(a));
    const db = calcDays(b.targetDate, b.repeat, skipOf(b));
    return da.days - db.days;
  });

  const sortPast = (list: Countdown[]) => [...list].sort((a, b) => {
    const da = calcDays(a.targetDate, a.repeat, skipOf(a));
    const db = calcDays(b.targetDate, b.repeat, skipOf(b));
    return db.days - da.days;
  });

  const activeSorted = sortActive(activeList);
  const pastSorted = sortPast(pastList);
  const displayList = showPast ? pastSorted : activeSorted;

  const renderCard = (c: Countdown) => {
    const { days, isPast, label, nextDate } = calcDays(c.targetDate, c.repeat, skipOf(c));
    const tomorrow = !isPast && isTomorrow(c.targetDate, c.repeat);
    const skipActive = !!(c.skipHolidays || c.skipWeekends);

    const displayDate = c.repeat !== 'none' ? nextDate : c.targetDate;
    let dateDisplay = formatCountdownDate(displayDate);
    if (c.calendarType === 'lunar') {
      try {
        const lunar = solarToLunar(displayDate);
        dateDisplay = formatLunarDate(lunar);
      } catch { /* fallback */ }
    }

    return (
      <button
        key={c.id}
        onClick={() => navigate(`/countdowns/${c.id}`)}
        className={`relative rounded-2xl p-5 text-white shadow-lg text-left w-full transition-all hover:scale-[1.02] ${
          isPast ? 'opacity-70' : ''
        } ${c.pinned ? 'shadow-indigo-500/30' : ''}`}
        style={{
          background: c.image ? undefined : c.color,
          backgroundImage: c.image ? `url(${c.image})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderColor: c.borderColor || 'transparent',
          borderWidth: c.borderColor ? '4px' : '0',
          borderStyle: 'solid',
        }}
      >
        {/* Badges */}
        {c.pinned && <span className="absolute top-3 right-3 text-sm">📌</span>}
        {tomorrow && c.remindEnabled && <span className="absolute top-3 left-3 text-sm">⚠️</span>}

        <div className="mb-3">
          <span className="text-5xl font-extrabold">{days}</span>
          <span className={`${skipActive ? 'text-sm' : 'text-xl'} ml-1 opacity-80`}>
            {skipActive ? '个工作日' : '天'}
          </span>
        </div>

        <div>
          <p className="font-semibold text-base truncate">{c.name}</p>
          <p className="text-sm opacity-70 mt-0.5">
            {showPast ? label : (isPast ? label : dateDisplay)}
          </p>
        </div>
      </button>
    );
  };

  return (
    <div className="min-h-dvh relative">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/bg-leaderboard.jpg')", filter: 'saturate(1.08) brightness(1.04) contrast(1.05)' }}
      />
      <div className="fixed inset-0 bg-black/5 dark:bg-black/20" />

      <div className="relative max-w-lg mx-auto px-4 pt-4 sm:pt-6 pb-24">
        {/* 头部 */}
        <div className="mb-5">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-3">倒数日</h1>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPast(false)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                !showPast
                  ? 'bg-indigo-500 text-white'
                  : 'bg-white/10 backdrop-blur text-gray-600 dark:text-gray-300 hover:bg-white/20'
              }`}
            >
              进行中 {activeSorted.length}
            </button>
            <button
              onClick={() => setShowPast(true)}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                showPast
                  ? 'bg-indigo-500 text-white'
                  : 'bg-white/10 backdrop-blur text-gray-600 dark:text-gray-300 hover:bg-white/20'
              }`}
            >
              已过 {pastSorted.length}
            </button>
          </div>
        </div>

        {/* 列表 */}
        {displayList.length === 0 ? (
          <div className="flex flex-col items-center gap-3 mt-20">
            <span className="text-5xl opacity-60">{showPast ? '📭' : '📅'}</span>
            <span className="text-gray-500">{showPast ? '没有已过的倒数日' : '还没有倒数日'}</span>
            {!showPast && <span className="text-gray-400 text-sm">点击右下角 + 创建</span>}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {displayList.map(renderCard)}
          </div>
        )}

        {/* FAB */}
        {!showPast && (
          <button
            onClick={() => navigate('/countdowns/new')}
            className="fixed bottom-24 right-6 z-20 w-14 h-14 rounded-full bg-indigo-500 text-white text-3xl flex items-center justify-center shadow-lg shadow-indigo-500/30 hover:bg-indigo-600 transition-colors"
          >
            +
          </button>
        )}
      </div>
    </div>
  );
}
