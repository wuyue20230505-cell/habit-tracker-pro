// 倒数日详情页

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import ConfirmDialog from '../components/ConfirmDialog';
import { formatDate } from '../utils/date';
import { calcDays, formatRepeat, formatCountdownDate } from '../utils/countdown';
import { solarToLunar, formatLunarDate } from '../utils/lunar';

export default function CountdownDetailPage() {
  const { state, deleteCountdown } = useApp();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const cd = state.countdowns.find((c) => c.id === id);
  const [showDelete, setShowDelete] = useState(false);

  if (!cd) {
    return (
      <div className="min-h-dvh relative">
        <div className="fixed inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/bg-leaderboard.jpg')" }} />
        <div className="relative flex flex-col items-center justify-center min-h-dvh gap-4">
          <span className="text-5xl">🔍</span>
          <p className="text-gray-500">事件不存在</p>
          <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-xl bg-indigo-500 text-white">返回</button>
        </div>
      </div>
    );
  }

  const { days, label, nextDate } = calcDays(cd.targetDate, cd.repeat, { holidays: cd.skipHolidays, weekends: cd.skipWeekends });
  const displayDate = cd.repeat !== 'none' ? nextDate : cd.targetDate;
  const skipActive = !!(cd.skipHolidays || cd.skipWeekends);

  // 农历显示
  let lunarText = '';
  if (cd.calendarType === 'lunar') {
    try {
      const lunar = solarToLunar(displayDate);
      lunarText = formatLunarDate(lunar);
    } catch { /* ignore */ }
  }

  const handleDelete = () => {
    deleteCountdown(cd.id);
    navigate(-1);
  };

  // Hero 样式
  const heroStyle: React.CSSProperties = { background: cd.color };
  if (cd.image) {
    heroStyle.backgroundImage = `url(${cd.image})`;
    heroStyle.backgroundSize = 'cover';
    heroStyle.backgroundPosition = 'center';
  }

  return (
    <div className="min-h-dvh relative">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/bg-leaderboard.jpg')", filter: 'saturate(1.08) brightness(1.04) contrast(1.05)' }}
      />
      <div className="fixed inset-0 bg-black/5 dark:bg-black/20" />

      <div className="relative max-w-lg mx-auto px-4 pt-4 sm:pt-6 pb-24">
        {/* 返回 */}
        <button onClick={() => navigate(-1)} className="text-gray-600 dark:text-gray-300 text-sm mb-4 hover:underline">← 返回</button>

        {/* Hero 区 */}
        <div
          className={`rounded-2xl p-8 mb-5 shadow-lg text-center ${cd.image ? 'text-white' : 'text-white'}`}
          style={heroStyle}
        >
          <div className="mb-2">
            <span className="text-6xl font-extrabold">{days}</span>
            <span className={`${skipActive ? 'text-base' : 'text-2xl'} ml-1 opacity-80`}>
              {skipActive ? '个工作日' : '天'}
            </span>
          </div>
          <h1 className="text-xl font-bold mb-1">{cd.name}</h1>
          <p className="text-sm opacity-70">{label}</p>
        </div>

        {/* 信息卡片 */}
        <div
          className="bg-white/15 dark:bg-black/20 backdrop-blur-md rounded-2xl p-4 mb-5 space-y-3"
          style={cd.borderColor ? { borderColor: cd.borderColor, borderWidth: '3px' } : {}}
        >
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">目标日期</span>
            <span className="text-gray-800 dark:text-gray-200">
              {cd.calendarType === 'lunar' && lunarText
                ? `${formatCountdownDate(displayDate)}（公历）`
                : formatCountdownDate(displayDate)}
            </span>
          </div>
          {cd.calendarType === 'lunar' && lunarText && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">农历日期</span>
              <span className="text-gray-800 dark:text-gray-200">{lunarText}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">日历类型</span>
            <span className="text-gray-800 dark:text-gray-200">{cd.calendarType === 'lunar' ? '农历' : '公历'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">重复</span>
            <span className="text-gray-800 dark:text-gray-200">{formatRepeat(cd.repeat)}</span>
          </div>
          {skipActive && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">跳过休息日</span>
              <span className="text-gray-800 dark:text-gray-200">
                {[cd.skipHolidays && '法定节假日', cd.skipWeekends && '周末'].filter(Boolean).join('、')}
              </span>
            </div>
          )}
          {cd.note && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">备注</span>
              <span className="text-gray-800 dark:text-gray-200">{cd.note}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">创建于</span>
            <span className="text-gray-800 dark:text-gray-200">{formatDate(cd.createdAt.slice(0, 10))}</span>
          </div>
          {cd.pinned && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">📌 已置顶</span>
            </div>
          )}
          {cd.remindEnabled && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">⏰ 已开启提醒</span>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate(`/countdowns/${cd.id}/edit`)}
            className="flex-1 py-2.5 rounded-xl bg-indigo-500 text-white font-medium hover:bg-indigo-600 transition-colors"
          >
            编辑
          </button>
          <button
            onClick={() => setShowDelete(true)}
            className="flex-1 py-2.5 rounded-xl bg-white/10 dark:bg-white/5 text-red-400 hover:bg-white/20 transition-colors"
          >
            删除
          </button>
        </div>

        <ConfirmDialog
          open={showDelete}
          title="删除倒数日"
          message={`确定删除「${cd.name}」吗？不可恢复。`}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
        />
      </div>
    </div>
  );
}
