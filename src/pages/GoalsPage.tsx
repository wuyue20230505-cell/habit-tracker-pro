// 目标列表页：标签切换 + 目标卡片 + 新建表单

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import GoalForm from '../components/GoalForm';
import { showToast } from '../utils/toast';
import { today } from '../utils/date';
import { CATEGORY_COLORS, goalProgress, formatGoalRange, isOverdue } from '../utils/goals';
import type { GoalFormData } from '../components/GoalForm';
import type { GoalStatus } from '../types';

export default function GoalsPage() {
  const { state, addGoal } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState<GoalStatus>('active');
  const [showForm, setShowForm] = useState(false);

  const goals = state.goals.filter((g) => g.status === tab);

  const activeCount = state.goals.filter((g) => g.status === 'active').length;
  const completedCount = state.goals.filter((g) => g.status === 'completed').length;
  const abandonedCount = state.goals.filter((g) => g.status === 'abandoned').length;

  const handleCreate = (data: GoalFormData) => {
    addGoal({ ...data, startDate: today() });
    setShowForm(false);
    showToast('已创建');
  };

  const tabs: { key: GoalStatus; label: string; count: number }[] = [
    { key: 'active', label: '进行中', count: activeCount },
    { key: 'completed', label: '已完成', count: completedCount },
    { key: 'abandoned', label: '已放弃', count: abandonedCount },
  ];

  return (
    <div className="min-h-dvh relative">
      <div
        className="fixed inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/bg-habits.jpg')", filter: 'saturate(1.08) brightness(1.04) contrast(1.05)' }}
      />
      <div className="fixed inset-0 bg-black/5 dark:bg-black/20" />

      <div className="relative max-w-lg mx-auto px-4 pt-4 sm:pt-6 pb-20">
        {/* 头部 */}
        <div className="flex items-center gap-4 mb-5">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">我的目标</h1>
          <span className="text-sm text-gray-500 flex-1">{activeCount} 个进行中</span>
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-500 text-white text-sm font-semibold rounded-xl px-5 py-2 hover:bg-indigo-600 transition-colors"
          >
            + 新建
          </button>
        </div>

        {/* 状态标签 */}
        <div className="flex gap-2 mb-5">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 text-center py-2.5 rounded-xl text-sm font-medium transition-all ${
                tab === t.key
                  ? 'bg-indigo-500 text-white'
                  : 'bg-white/10 backdrop-blur text-gray-600 dark:text-gray-300 hover:bg-white/20'
              }`}
            >
              {t.label} {t.count}
            </button>
          ))}
        </div>

        {/* 目标列表 */}
        {goals.length === 0 ? (
          <div className="flex flex-col items-center gap-3 mt-20">
            <span className="text-5xl opacity-60">🎯</span>
            <span className="text-gray-500">
              {tab === 'active' ? '还没有进行中的目标' : tab === 'completed' ? '还没有完成的目标' : '还没有放弃的目标'}
            </span>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {goals.map((g) => {
              const pct = goalProgress(g);
              const overdue = isOverdue(g);
              return (
                <button
                  key={g.id}
                  onClick={() => navigate(`/goals/${g.id}`)}
                  className={`flex items-center gap-4 p-4 rounded-2xl text-left transition-all ${
                    g.status === 'abandoned'
                      ? 'bg-white/5 dark:bg-white/5 opacity-60'
                      : 'bg-white/15 dark:bg-black/20 backdrop-blur-md hover:bg-white/25 dark:hover:bg-white/15'
                  }`}
                >
                  {/* 图标 */}
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl shrink-0 overflow-hidden"
                    style={{ background: CATEGORY_COLORS[g.category] + '22' }}
                  >
                    {g.iconImage ? (
                      <img src={g.iconImage} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <span>{g.emoji}</span>
                    )}
                  </div>

                  {/* 信息 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">{g.name}</span>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full text-white shrink-0"
                        style={{ background: CATEGORY_COLORS[g.category] }}
                      >
                        {g.category}
                      </span>
                    </div>

                    {/* 进度条 */}
                    <div className="h-2 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden mb-1">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: CATEGORY_COLORS[g.category] }}
                      />
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>{g.currentValue}/{g.targetValue}{g.unit} · {pct}%</span>
                      <div className="flex items-center gap-1">
                        {overdue && <span className="text-red-400 text-xs px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30">已到期</span>}
                        <span>{formatGoalRange(g)}</span>
                      </div>
                    </div>
                  </div>

                  <span className="text-gray-400 text-xl">›</span>
                </button>
              );
            })}
          </div>
        )}

        {/* 新建表单 */}
        <GoalForm open={showForm} onClose={() => setShowForm(false)} onSubmit={handleCreate} />
      </div>
    </div>
  );
}
