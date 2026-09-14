// 目标完成书签弹窗 —— 展示完成时间、进度详情、励志名言

import { getRandomQuote } from '../utils/goals';
import { formatDate } from '../utils/date';
import type { Goal } from '../types';

interface Props {
  open: boolean;
  goal: Goal | null;
  onClose: () => void;
}

export default function GoalCompleteModal({ open, goal, onClose }: Props) {
  if (!open || !goal) return null;

  const now = new Date();
  const timeStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const start = new Date(goal.startDate + 'T00:00:00');
  const days = Math.max(1, Math.floor((now.getTime() - start.getTime()) / 86400000));
  const durStr = days >= 30
    ? `${Math.floor(days / 30)} 个月 ${days % 30} 天`
    : `${days} 天`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white/15 dark:bg-black/20 backdrop-blur-xl rounded-2xl p-6 mx-4 max-w-sm w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
        {/* 书签顶部装饰 */}
        <div className="h-1.5 rounded-full bg-indigo-500 mb-4" />

        <div className="text-center mb-4">
          <span className="text-5xl">🏆</span>
          <h2 className="text-xl font-bold text-white mt-2">🎉 目标达成！</h2>
        </div>

        <p className="text-center text-white/90 font-medium text-lg mb-4">
          {goal.emoji} {goal.name}
        </p>

        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-white/50">完成进度</span>
            <span className="text-white/90">{goal.targetValue} / {goal.targetValue} {goal.unit}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/50">完成用时</span>
            <span className="text-white/90">{durStr}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/50">完成时间</span>
            <span className="text-white/90">{timeStr}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/50">开始日期</span>
            <span className="text-white/90">{formatDate(goal.startDate)}</span>
          </div>
        </div>

        {/* 名人名言 */}
        <div className="bg-white/10 dark:bg-white/5 rounded-xl p-3 mb-4 text-center">
          <span className="text-indigo-400 text-2xl leading-none">"</span>
          <p className="text-white/70 text-sm italic">{getRandomQuote()}</p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-indigo-500 text-white font-medium hover:bg-indigo-600 transition-colors"
        >
          知道了
        </button>
      </div>
    </div>
  );
}
