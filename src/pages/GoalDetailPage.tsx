// 目标详情页：进度追踪 + 编辑 + 完成/放弃/删除

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import GoalForm from '../components/GoalForm';
import GoalCompleteModal from '../components/GoalCompleteModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { showToast } from '../utils/toast';
import { formatDate } from '../utils/date';
import { CATEGORY_COLORS, goalProgress, formatGoalRange, isOverdue } from '../utils/goals';
import type { GoalFormData } from '../components/GoalForm';

export default function GoalDetailPage() {
  const { state, updateGoal, incrementGoal, deleteGoal, startGoalPomodoro } = useApp();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const goal = state.goals.find((g) => g.id === id);

  const [showEdit, setShowEdit] = useState(false);
  const [showComplete, setShowComplete] = useState(false);
  const [delta, setDelta] = useState(1);
  const [confirmType, setConfirmType] = useState<'complete' | 'abandon' | 'delete' | null>(null);

  if (!goal) {
    return (
      <div className="min-h-dvh relative">
        <div className="fixed inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/bg-habits.jpg')" }} />
        <div className="relative flex flex-col items-center justify-center min-h-dvh gap-4">
          <span className="text-5xl">🔍</span>
          <p className="text-gray-500">目标不存在</p>
          <button onClick={() => navigate(-1)} className="px-4 py-2 rounded-xl bg-indigo-500 text-white">返回</button>
        </div>
      </div>
    );
  }

  const pct = goalProgress(goal);
  const overdue = isOverdue(goal);
  const remaining = Math.max(0, goal.targetValue - goal.currentValue);
  const catColor = CATEGORY_COLORS[goal.category];

  const previewVal = Math.min(goal.targetValue, goal.currentValue + delta);
  const previewPct = goal.targetValue > 0 ? Math.round((previewVal / goal.targetValue) * 100) : 0;

  const handleEdit = (data: GoalFormData) => {
    updateGoal(goal.id, data);
    setShowEdit(false);
    showToast('已保存');
  };

  const handleIncrement = () => {
    if (delta < 1) return;
    const completed = incrementGoal(goal.id, delta);
    if (completed) {
      try { navigator.vibrate(50); } catch {}
      setShowComplete(true);
    } else {
      showToast(`+${delta}！继续加油`);
    }
  };

  const handleFocus = () => {
    if (state.activePomodoro) {
      showToast('已有进行中的番茄钟');
      return;
    }
    startGoalPomodoro(goal);
    navigate('/pomodoro-timer');
  };

  const handleConfirmAction = () => {
    if (confirmType === 'complete') {
      updateGoal(goal.id, { status: 'completed', currentValue: goal.targetValue, completedAt: new Date().toISOString() });
      try { navigator.vibrate(50); } catch {}
      setShowComplete(true);
    } else if (confirmType === 'abandon') {
      updateGoal(goal.id, { status: 'abandoned' });
      showToast('已放弃');
    } else if (confirmType === 'delete') {
      deleteGoal(goal.id);
      navigate(-1);
    }
    setConfirmType(null);
  };

  const currentGoal = state.goals.find((g) => g.id === id) || goal;

  return (
    <div className="min-h-dvh relative">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/bg-habits.jpg')", filter: 'saturate(1.08) brightness(1.04) contrast(1.05)' }}
      />
      <div className="fixed inset-0 bg-black/5 dark:bg-black/20" />

      <div className="relative max-w-lg mx-auto px-4 pt-4 sm:pt-6 pb-24">
        {/* 返回 */}
        <button onClick={() => navigate(-1)} className="text-gray-600 dark:text-gray-300 text-sm mb-4 hover:underline">← 返回</button>

        {/* 头部信息 */}
        <div className="bg-white/15 dark:bg-black/20 backdrop-blur-md rounded-2xl p-4 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0 overflow-hidden"
              style={{ background: catColor + '22' }}
            >
              {goal.iconImage ? (
                <img src={goal.iconImage} className="w-full h-full object-cover" alt="" />
              ) : (
                <span>{goal.emoji}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200 truncate">{goal.name}</h1>
                <span className="text-xs px-2 py-0.5 rounded-full text-white shrink-0" style={{ background: catColor }}>
                  {goal.category}
                </span>
              </div>
              <p className="text-xs text-gray-500">{formatGoalRange(goal)}</p>
            </div>
            {goal.status === 'active' && (
              <button onClick={() => setShowEdit(true)} className="text-sm text-indigo-500 hover:text-indigo-400 shrink-0">编辑</button>
            )}
          </div>

          {/* 进度区 */}
          <div className="text-center mb-3">
            <div className="flex items-center justify-center gap-1 text-3xl font-bold">
              <span style={{ color: catColor }}>{goal.currentValue}</span>
              {delta > 0 && goal.status === 'active' && (
                <>
                  <span className="text-lg text-green-500">+{delta}</span>
                  <span className="text-lg text-gray-400">→</span>
                  <span style={{ color: catColor }}>{previewVal}</span>
                </>
              )}
              <span className="text-gray-400 text-xl mx-1">/</span>
              <span className="text-gray-600 dark:text-gray-300">{goal.targetValue}</span>
              <span className="text-base text-gray-500 ml-1">{goal.unit}</span>
            </div>
            <p className="text-lg font-semibold mt-1" style={{ color: catColor }}>{previewPct}%</p>

            <div className="h-2.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden relative mt-2">
              <div className="h-full rounded-full absolute left-0 top-0 transition-all" style={{ width: `${pct}%`, background: catColor }} />
              {delta > 0 && goal.status === 'active' && (
                <div
                  className="h-full rounded-full absolute top-0 transition-all opacity-60"
                  style={{ width: `${previewPct - pct}%`, left: `${pct}%`, background: catColor }}
                />
              )}
            </div>
          </div>

          {goal.status === 'active' && remaining > 0 && (
            <p className="text-center text-sm text-gray-500">还差 {Math.max(0, goal.targetValue - previewVal)} {goal.unit}</p>
          )}
          {goal.status === 'active' && remaining <= 0 && (
            <p className="text-center text-sm text-green-500">🎉 目标达成！</p>
          )}
          {goal.status === 'completed' && (
            <div className="text-center">
              <p className="text-green-500 font-medium">🎉 目标已完成</p>
              <div className="mt-2 space-y-1 text-xs text-gray-500">
                <p>开始时间：{formatDate(goal.startDate)}</p>
                <p>完成时间：{goal.completedAt ? formatDate(goal.completedAt.slice(0, 10)) : '-'}</p>
                <p>完成用时：{(() => {
                  const start = new Date(goal.startDate + 'T00:00:00');
                  const end = goal.completedAt ? new Date(goal.completedAt.slice(0, 10) + 'T00:00:00') : new Date();
                  const d = Math.max(1, Math.floor((end.getTime() - start.getTime()) / 86400000));
                  return d >= 30 ? `${Math.floor(d / 30)} 个月 ${d % 30} 天` : `${d} 天`;
                })()}</p>
              </div>
            </div>
          )}
          {goal.status === 'abandoned' && <p className="text-center text-gray-400">已放弃</p>}
          {overdue && <p className="text-center text-red-400 text-sm">已超过截止日期</p>}
        </div>

        {/* 操作按钮区 */}
        {goal.status === 'active' && (
          <div className="space-y-3">
            {/* 步进器 */}
            <div className="bg-white/15 dark:bg-black/20 backdrop-blur-md rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDelta(Math.max(1, delta - 1))}
                  className="w-10 h-10 rounded-xl bg-white/10 dark:bg-white/5 hover:bg-white/20 dark:hover:bg-white/15 text-lg"
                >
                  −
                </button>
                <span className="text-xl font-bold text-gray-800 dark:text-gray-200 min-w-[3ch] text-center">{delta}</span>
                <button
                  onClick={() => setDelta(delta + 1)}
                  className="w-10 h-10 rounded-xl bg-white/10 dark:bg-white/5 hover:bg-white/20 dark:hover:bg-white/15 text-lg"
                >
                  +
                </button>
                <button
                  onClick={handleIncrement}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-500 text-white font-medium hover:bg-indigo-600 transition-colors"
                >
                  确认
                </button>
              </div>
            </div>

            {/* 专注按钮 */}
            <button
              onClick={handleFocus}
              className="w-full py-3 rounded-xl bg-white/15 dark:bg-black/20 backdrop-blur-md text-gray-800 dark:text-gray-200 font-medium hover:bg-white/25 dark:hover:bg-white/15 transition-colors"
            >
              🧘 专注
            </button>

            {/* 截止提醒 */}
            {goal.endDate && (
              <div className="bg-white/15 dark:bg-black/20 backdrop-blur-md rounded-xl p-4 flex items-center gap-3">
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">⏰ 截止前一天提醒</span>
                  <p className="text-xs text-gray-400 mt-0.5">12:00 和 18:00</p>
                </div>
                <button
                  type="button"
                  onClick={() => updateGoal(goal.id, { remindEnabled: !goal.remindEnabled })}
                  className={`relative w-12 h-7 rounded-full shrink-0 transition-colors ${
                    goal.remindEnabled ? 'bg-indigo-500' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-6 h-6 rounded-full bg-white/10 shadow transition-all ${
                      goal.remindEnabled ? 'left-5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
            )}

            {/* 完成/放弃 */}
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmType('complete')}
                className="flex-1 py-2.5 rounded-xl bg-green-500/20 text-green-600 dark:text-green-400 font-medium hover:bg-green-500/30 transition-colors"
              >
                ✅ 完成目标
              </button>
              <button
                onClick={() => setConfirmType('abandon')}
                className="flex-1 py-2.5 rounded-xl bg-white/10 dark:bg-white/5 text-gray-500 hover:bg-white/20 transition-colors"
              >
                放弃
              </button>
            </div>

            <button
              onClick={() => setConfirmType('delete')}
              className="w-full py-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-white/10 transition-colors text-sm"
            >
              删除目标
            </button>
          </div>
        )}

        {goal.status !== 'active' && (
          <button
            onClick={() => setConfirmType('delete')}
            className="w-full py-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-white/10 transition-colors text-sm"
          >
            删除目标
          </button>
        )}

        {/* 编辑表单 */}
        <GoalForm open={showEdit} initial={goal} onClose={() => setShowEdit(false)} onSubmit={handleEdit} />

        {/* 完成弹窗 */}
        <GoalCompleteModal open={showComplete} goal={showComplete ? currentGoal : null} onClose={() => setShowComplete(false)} />

        {/* 确认对话框 */}
        <ConfirmDialog
          open={confirmType === 'complete'}
          title="完成目标"
          message="确定完成此目标吗？进度将设为 100%。"
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmType(null)}
        />
        <ConfirmDialog
          open={confirmType === 'abandon'}
          title="放弃目标"
          message="确定放弃此目标吗？"
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmType(null)}
        />
        <ConfirmDialog
          open={confirmType === 'delete'}
          title="删除目标"
          message={`确定删除「${goal.name}」吗？不可恢复。`}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmType(null)}
        />
      </div>
    </div>
  );
}
