import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useProCtx } from '../context/ProContext';
import type { Habit } from '../types';
import HabitForm from '../components/HabitForm';
import EmptyState from '../components/EmptyState';
import ConfirmDialog from '../components/ConfirmDialog';

export default function HabitsPage() {
  const { state, addHabit, dispatch } = useApp();
  const { isPro, checkHabitLimit } = useProCtx();
  const [formOpen, setFormOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const activeHabits = state.habits.filter((h) => !h.archived);
  const archivedHabits = state.habits.filter((h) => h.archived);

  const handleNew = () => {
    if (!checkHabitLimit(activeHabits.length)) return; // Pro 限制
    setEditingHabit(null);
    setFormOpen(true);
  };

  const handleSave = (data: { name: string; emoji: string; color: string; frequency: { type: 'daily' } | { type: 'weekly'; count: number } | { type: 'monthly'; count: number }; usePomodoro: boolean; pomodoroMinutes: number; dailyGoal: number; excludeHolidays: boolean }) => {
    if (editingHabit) {
      dispatch({ type: 'UPDATE_HABIT', payload: { ...editingHabit, ...data } });
    } else {
      addHabit(data);
    }
    setEditingHabit(null);
  };

  const handleDelete = () => {
    if (deletingId) {
      dispatch({ type: 'DELETE_HABIT', payload: deletingId });
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-dvh relative" style={{ background: 'url(/bg-habits.jpg) center/cover no-repeat', backgroundAttachment: 'fixed', minHeight: '100dvh' }}>
<div className="max-w-lg mx-auto px-4 pt-4 sm:pt-6 pb-4 relative z-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200">习惯管理</h1>
          <p className="text-gray-400 dark:text-gray-500 mt-1">
            {activeHabits.length} 个活跃习惯
            {!isPro && <span className="text-amber-500 ml-1">· 免费版最多3个</span>}
          </p>
        </div>
        <button
          onClick={handleNew}
          className="px-4 py-2 rounded-xl bg-indigo-500 text-white font-medium hover:bg-indigo-600 transition-colors text-sm"
        >
          + 新建
        </button>
      </div>

      {activeHabits.length === 0 && archivedHabits.length === 0 ? (
        <EmptyState
          icon="📋"
          title="还没有习惯"
          description="点击右上角新建按钮创建你的第一个习惯"
        />
      ) : (
        <div className="space-y-2">
          {activeHabits.map((h) => (
            <div
              key={h.id}
              className="bg-white/15 dark:bg-black/20 backdrop-blur-md rounded-2xl p-4 flex items-center gap-3 shadow-sm"
            >
              <span className={`w-3 h-3 rounded-full ${h.color}`} />
              <span className="text-2xl">{h.emoji}</span>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-800 dark:text-gray-200 truncate">{h.name}</h3>
                <p className="text-xs text-gray-400">
                  {h.frequency.type === 'daily' ? '每天' :
                   h.frequency.type === 'weekly' ? `每周 ${(h.frequency as { type: 'weekly'; count: number }).count} 天` :
                   `每月 ${(h.frequency as { type: 'monthly'; count: number }).count} 天`}{h.excludeHolidays ? ' · 除节假日' : ''}
                </p>
              </div>
              <button
                onClick={() => { setEditingHabit(h); setFormOpen(true); }}
                className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                编辑
              </button>
              <button
                onClick={() => dispatch({ type: 'ARCHIVE_HABIT', payload: h.id })}
                className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                归档
              </button>
              <button
                onClick={() => setDeletingId(h.id)}
                className="text-sm px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50"
              >
                删除
              </button>
            </div>
          ))}

          {archivedHabits.length > 0 && (
            <div className="mt-6">
              <h2 className="text-sm font-medium text-gray-400 dark:text-gray-500 mb-2">已归档</h2>
              {archivedHabits.map((h) => (
                <div
                  key={h.id}
                  className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 flex items-center gap-3 opacity-60"
                >
                  <span className="text-2xl">{h.emoji}</span>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-500 line-through">{h.name}</h3>
                  </div>
                  <button
                    onClick={() => dispatch({ type: 'ARCHIVE_HABIT', payload: h.id })}
                    className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    恢复
                  </button>
                  <button
                    onClick={() => setDeletingId(h.id)}
                    className="text-sm px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50"
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <HabitForm
        open={formOpen}
        habit={editingHabit}
        onSave={handleSave}
        onClose={() => { setFormOpen(false); setEditingHabit(null); }}
      />

      <ConfirmDialog
        open={deletingId !== null}
        title="删除习惯"
        message="确定要删除这个习惯吗？相关的打卡记录也会被删除，此操作不可撤销。"
        onConfirm={handleDelete}
        onCancel={() => setDeletingId(null)}
      />
    </div>
    </div>
  );
}
