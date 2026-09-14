// 月/日选择弹框（倒数日「每年」「每月」用）：
// 每年 = 月份网格 + 日期网格；每月 = 仅日期网格；支持公历/农历两种显示
import { useState, useEffect } from 'react';
import { getLunarMonthName, getLunarDayName } from '../utils/lunar';

export type PickerKind = 'yearly' | 'monthly';
export type PickerCalendar = 'solar' | 'lunar';

interface Props {
  open: boolean;
  kind: PickerKind;
  calendar: PickerCalendar;
  month: number; // yearly 时使用
  day: number;
  preview: string; // 下次日期预览（表单实时计算）
  onClose: () => void;
  onSelect: (month: number, day: number) => void;
}

const SOLAR_MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const SOLAR_DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const LUNAR_MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const LUNAR_DAYS = Array.from({ length: 30 }, (_, i) => i + 1);

export default function MonthDayPicker({ open, kind, calendar, month, day, preview, onClose, onSelect }: Props) {
  const [curMonth, setCurMonth] = useState(month || 1);

  useEffect(() => {
    if (open) setCurMonth(month || 1);
  }, [open]);

  const months = calendar === 'solar' ? SOLAR_MONTHS : LUNAR_MONTHS;
  const days = calendar === 'solar' ? SOLAR_DAYS : LUNAR_DAYS;
  const monthLabel = (m: number) => (calendar === 'solar' ? `${m}月` : getLunarMonthName(m, false));
  const dayLabel = (d: number) => (calendar === 'solar' ? `${d}` : getLunarDayName(d));

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl p-4 w-full max-w-sm shadow-2xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题 */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-base font-bold text-gray-800 dark:text-gray-200">
            {kind === 'yearly'
              ? `每年${calendar === 'lunar' ? '农历' : ''}几月几日`
              : `每月${calendar === 'lunar' ? '农历' : ''}几号`}
          </span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
        </div>

        {/* 月份网格（仅每年） */}
        {kind === 'yearly' && (
          <>
            <div className="grid grid-cols-4 gap-1 mb-3">
              {months.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setCurMonth(m)}
                  className={`py-1.5 rounded-lg text-sm transition-colors ${
                    curMonth === m
                      ? 'bg-indigo-500 text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {monthLabel(m)}
                </button>
              ))}
            </div>
            <div className="text-xs text-gray-400 mb-1">选择{monthLabel(curMonth)}的日期</div>
          </>
        )}

        {/* 日期网格 */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((d) => {
            const selected = day === d && (kind === 'monthly' || curMonth === month);
            return (
              <button
                key={d}
                type="button"
                onClick={() => onSelect(curMonth, d)}
                className={`py-1.5 rounded-lg text-sm transition-colors ${
                  selected
                    ? 'bg-indigo-500 text-white'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {dayLabel(d)}
              </button>
            );
          })}
        </div>

        {/* 下次日期预览 */}
        {preview && (
          <p className="text-xs text-gray-400 mt-3 text-center">下次日期：{preview}</p>
        )}
      </div>
    </div>
  );
}
