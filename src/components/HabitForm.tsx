import { useState, useEffect } from 'react';
import type { Habit, Frequency } from '../types';
import EmojiPicker from './EmojiPicker';
import FrequencyPicker from './FrequencyPicker';

const COLORS = [
  'bg-indigo-500', 'bg-blue-500', 'bg-cyan-500', 'bg-teal-500',
  'bg-emerald-500', 'bg-green-500', 'bg-lime-500', 'bg-amber-500',
  'bg-orange-500', 'bg-red-500', 'bg-rose-500', 'bg-pink-500',
  'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-slate-500',
];

interface Props {
  open: boolean;
  habit?: Habit | null;
  onSave: (data: {
    name: string;
    emoji: string;
    color: string;
    frequency: Frequency;
    usePomodoro: boolean;
    pomodoroMinutes: number;
    dailyGoal: number;
    excludeHolidays: boolean;
    excludeWeekends: boolean;
  }) => void;
  onClose: () => void;
}

export default function HabitForm({ open, habit, onSave, onClose }: Props) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('💪');
  const [color, setColor] = useState(COLORS[0]);
  const [frequency, setFrequency] = useState<Frequency>({ type: 'daily' });
  const [usePomodoro, setUsePomodoro] = useState(false);
  const [pomodoroMinutes, setPomodoroMinutes] = useState(25);
  const [dailyGoal, setDailyGoal] = useState(1);
  const [excludeRest, setExcludeRest] = useState(false);

  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setEmoji(habit.emoji);
      setColor(habit.color);
      setFrequency(habit.frequency);
      setUsePomodoro(habit.usePomodoro ?? false);
      setPomodoroMinutes(habit.pomodoroMinutes ?? 25);
      setDailyGoal(habit.dailyGoal ?? 1);
      setExcludeRest(!!(habit.excludeHolidays || habit.excludeWeekends));
    } else {
      setName('');
      setEmoji('💪');
      setColor(COLORS[0]);
      setFrequency({ type: 'daily' });
      setUsePomodoro(false);
      setPomodoroMinutes(25);
      setDailyGoal(1);
      setExcludeRest(false);
    }
  }, [habit, open]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), emoji, color, frequency, usePomodoro, pomodoroMinutes, dailyGoal, excludeHolidays: excludeRest, excludeWeekends: excludeRest });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white/15 dark:bg-black/20 backdrop-blur-xl rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-md max-h-[85vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-white mb-6">{habit ? '编辑习惯' : '新建习惯'}</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">名称</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：每天喝8杯水"
              className="w-full px-4 py-2.5 rounded-xl border dark:border-gray-600 bg-white/10 dark:bg-black/20 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
          </div>

          <EmojiPicker value={emoji} onChange={setEmoji} />

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">颜色</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full ${c} transition-all ${
                    color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
                  }`}
                />
              ))}
            </div>
          </div>

          <FrequencyPicker
            value={frequency}
            onChange={setFrequency}
            excludeRest={excludeRest}
            onExcludeRestChange={setExcludeRest}
          />

          {/* Daily goal */}
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">每日打卡次数</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setDailyGoal((p) => Math.max(1, p - 1))}
                className="w-8 h-8 rounded-lg bg-white/10 dark:bg-white/5 hover:bg-white/20 dark:hover:bg-white/15"
              >
                -
              </button>
              <input
                type="number"
                value={dailyGoal}
                onChange={(e) => setDailyGoal(Math.max(1, Math.min(99, Number(e.target.value))))}
                className="w-16 text-center py-1.5 rounded-lg border dark:border-gray-600 bg-white/10 dark:bg-black/20 text-sm appearance-none"
                min={1}
                max={99}
              />
              <button
                type="button"
                onClick={() => setDailyGoal((p) => Math.min(99, p + 1))}
                className="w-8 h-8 rounded-lg bg-white/10 dark:bg-white/5 hover:bg-white/20 dark:hover:bg-white/15"
              >
                +
              </button>
              <span className="text-xs text-gray-400">次/天</span>
            </div>
          </div>

          {/* Pomodoro toggle */}
          <div className="bg-white/10 dark:bg-white/5 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">🍅 番茄钟模式</span>
                <p className="text-xs text-gray-400 mt-0.5">打卡时自动开启专注计时和音乐</p>
              </div>
              <button
                type="button"
                onClick={() => setUsePomodoro(!usePomodoro)}
                className={`relative w-12 h-7 rounded-full shrink-0 transition-colors ${
                  usePomodoro ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-6 h-6 rounded-full bg-white/10 shadow transition-all ${
                    usePomodoro ? 'left-5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            {usePomodoro && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">专注时长：</span>
                <button
                  type="button"
                  onClick={() => setPomodoroMinutes((p) => Math.max(5, p - 5))}
                  className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-gray-600 text-sm"
                >
                  -
                </button>
                <input
                  type="number"
                  value={pomodoroMinutes}
                  onChange={(e) => setPomodoroMinutes(Math.max(5, Math.min(120, Number(e.target.value))))}
                  className="w-14 text-center py-1 rounded-lg border dark:border-gray-600 bg-white/10 dark:bg-black/20 text-sm appearance-none"
                  min={5}
                  max={120}
                  step={5}
                />
                <button
                  type="button"
                  onClick={() => setPomodoroMinutes((p) => Math.min(120, p + 5))}
                  className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-gray-600 text-sm"
                >
                  +
                </button>
                <span className="text-xs text-gray-400">分钟</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 dark:bg-white/5 hover:bg-white/20 dark:hover:bg-white/15 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-500 text-white font-medium hover:bg-indigo-600 transition-colors"
            >
              {habit ? '保存' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
