// 目标表单组件 —— 创建/编辑共用

import { useState, useEffect, useRef } from 'react';
import EmojiPicker from './EmojiPicker';
import { CATEGORY_COLORS } from '../utils/goals';
import type { Goal, GoalCategory } from '../types';

export interface GoalFormData {
  name: string;
  emoji: string;
  iconImage?: string;
  category: GoalCategory;
  targetValue: number;
  unit: string;
  endDate?: string;
}

const CATEGORIES: GoalCategory[] = ['学习', '健康', '财务', '生活', '其他'];

interface Props {
  open: boolean;
  initial?: Goal | null;
  onClose: () => void;
  onSubmit: (data: GoalFormData) => void;
}

export default function GoalForm({ open, initial, onClose, onSubmit }: Props) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('📖');
  const [iconImage, setIconImage] = useState('');
  const [category, setCategory] = useState<GoalCategory>('学习');
  const [targetValue, setTargetValue] = useState(10);
  const [unit, setUnit] = useState('');
  const [useEndDate, setUseEndDate] = useState(false);
  const [endDate, setEndDate] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setName(initial.name);
      setEmoji(initial.emoji);
      setCategory(initial.category);
      setTargetValue(initial.targetValue);
      setUnit(initial.unit);
      setIconImage(initial.iconImage || '');
      setUseEndDate(!!initial.endDate);
      setEndDate(initial.endDate || '');
    } else {
      setName('');
      setEmoji('📖');
      setIconImage('');
      setCategory('学习');
      setTargetValue(10);
      setUnit('');
      setUseEndDate(false);
      setEndDate('');
    }
  }, [open, initial]);

  // 清理 object URL
  useEffect(() => {
    return () => { if (iconImage && iconImage.startsWith('blob:')) URL.revokeObjectURL(iconImage); };
  }, [iconImage]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      emoji,
      iconImage: iconImage || undefined,
      category,
      targetValue: Math.max(1, targetValue),
      unit: unit.trim(),
      endDate: useEndDate && endDate ? endDate : undefined,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (iconImage && iconImage.startsWith('blob:')) URL.revokeObjectURL(iconImage);
    setIconImage(URL.createObjectURL(file));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white/15 dark:bg-black/20 backdrop-blur-xl rounded-t-2xl sm:rounded-2xl p-6 w-full sm:max-w-md max-h-[85vh] overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-white mb-6">{initial ? '编辑目标' : '新建目标'}</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 名称 */}
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">名称</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：读完10本书"
              maxLength={16}
              className="w-full px-4 py-2.5 rounded-xl border dark:border-gray-600 bg-white/10 dark:bg-black/20 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
          </div>

          {/* 预设图标 */}
          <EmojiPicker value={emoji} onChange={(e) => { setEmoji(e); setIconImage(''); }} />

          {/* 自选图标 */}
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">自选图标</label>
            <div className="flex gap-3">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 dark:bg-white/5 hover:bg-white/20 dark:hover:bg-white/15 text-sm"
              >
                <span>📷</span>
                <span>选图片</span>
              </button>
              {iconImage && (
                <button
                  type="button"
                  onClick={() => setIconImage('')}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 dark:bg-white/5 hover:bg-white/20 dark:hover:bg-white/15 text-sm"
                >
                  <img src={iconImage} className="w-5 h-5 rounded object-cover" alt="" />
                  <span>✕ 清除</span>
                </button>
              )}
            </div>
          </div>

          {/* 分类 */}
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">分类</label>
            <div className="flex gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategory(c)}
                  className="flex-1 text-center py-2 rounded-xl text-sm font-medium transition-all"
                  style={category === c ? { background: CATEGORY_COLORS[c], color: '#fff' } : {}}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* 目标值 */}
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">目标值</label>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTargetValue(Math.max(1, targetValue - 1))}
                  className="w-8 h-8 rounded-lg bg-white/10 dark:bg-white/5 hover:bg-white/20 dark:hover:bg-white/15"
                >
                  -
                </button>
                <input
                  type="number"
                  value={targetValue}
                  onChange={(e) => setTargetValue(Math.max(1, Math.min(9999, Number(e.target.value) || 1)))}
                  className="w-20 text-center py-1.5 rounded-lg border dark:border-gray-600 bg-white/10 dark:bg-black/20 text-sm appearance-none"
                  min={1}
                />
                <button
                  type="button"
                  onClick={() => setTargetValue(targetValue + 1)}
                  className="w-8 h-8 rounded-lg bg-white/10 dark:bg-white/5 hover:bg-white/20 dark:hover:bg-white/15"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* 单位 */}
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">单位</label>
            <input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="本 / 元 / 小时 / 天"
              maxLength={4}
              className="w-full px-4 py-2.5 rounded-xl border dark:border-gray-600 bg-white/10 dark:bg-black/20 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* 截止日期开关 */}
          <div className="bg-white/10 dark:bg-white/5 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">设置截止日期</span>
                <p className="text-xs text-gray-400 mt-0.5">{useEndDate && endDate ? endDate : '可选'}</p>
              </div>
              <button
                type="button"
                onClick={() => setUseEndDate(!useEndDate)}
                className={`relative w-12 h-7 rounded-full shrink-0 transition-colors ${
                  useEndDate ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-6 h-6 rounded-full bg-white/10 shadow transition-all ${
                    useEndDate ? 'left-5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            {useEndDate && (
              <div className="mt-3">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border dark:border-gray-600 bg-white/10 dark:bg-black/20 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 [color-scheme:dark]"
                />
              </div>
            )}
          </div>

          {/* 操作按钮 */}
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
              {initial ? '保存' : '创建'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
