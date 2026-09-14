// 农历日历选择框：弹出农历月视图（初一~三十），点击日期直接选中
import { useState, useEffect } from 'react';
import {
  lunarToSolar,
  solarToLunar,
  getLunarLeapMonth,
  getLunarMonthDays,
  getLunarMonthName,
  getLunarDayName,
} from '../utils/lunar';

const WEEK_HEADS = ['一', '二', '三', '四', '五', '六', '日'];
const MIN_YEAR = 1900;
const MAX_YEAR = 2100;

interface Props {
  open: boolean;
  initialYear?: number;
  initialMonth?: number;
  initialIsLeap?: boolean;
  onClose: () => void;
  onSelect: (year: number, month: number, day: number, isLeap: boolean, solar: string) => void;
}

function todayLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function LunarCalendarPicker({ open, initialYear, initialMonth, initialIsLeap, onClose, onSelect }: Props) {
  const [year, setYear] = useState(() => solarToLunar(todayLocal()).year);
  const [month, setMonth] = useState(1);
  const [isLeap, setIsLeap] = useState(false);

  // 打开时初始化到已选日期
  useEffect(() => {
    if (!open) return;
    setYear(initialYear || solarToLunar(todayLocal()).year);
    setMonth(initialMonth || 1);
    setIsLeap(!!initialIsLeap);
  }, [open]);

  const leapMonth = getLunarLeapMonth(year);
  const days = getLunarMonthDays(year, month, isLeap);
  // 该月初一对应的公历日 → 计算星期偏移（周一起始）
  const firstSolar = lunarToSolar(year, month, 1, isLeap);
  const offset = firstSolar ? (new Date(firstSolar + 'T00:00:00').getDay() + 6) % 7 : 0;

  const changeMonth = (delta: number) => {
    if (isLeap) {
      setIsLeap(false);
      return;
    }
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setYear(Math.max(MIN_YEAR, Math.min(MAX_YEAR, y)));
    setMonth(m);
  };

  const changeYear = (delta: number) => {
    const y = Math.max(MIN_YEAR, Math.min(MAX_YEAR, year + delta));
    setYear(y);
    if (isLeap && getLunarLeapMonth(y) !== month) setIsLeap(false);
  };

  const handleDay = (day: number) => {
    const solar = lunarToSolar(year, month, day, isLeap);
    if (solar) onSelect(year, month, day, isLeap, solar);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl p-4 w-full max-w-sm shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题 */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-base font-bold text-gray-800 dark:text-gray-200">农历日历</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg leading-none">✕</button>
        </div>

        {/* 年份导航 */}
        <div className="flex items-center justify-center gap-4 mb-2">
          <button onClick={() => changeYear(-1)} className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">◀</button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{year}年</span>
          <button onClick={() => changeYear(1)} className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">▶</button>
        </div>

        {/* 月份导航 + 闰月切换 */}
        <div className="flex items-center justify-center gap-4 mb-3">
          <button onClick={() => changeMonth(-1)} className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">◀</button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {getLunarMonthName(month, isLeap)}
            {leapMonth === month && !isLeap && (
              <button
                type="button"
                onClick={() => setIsLeap(true)}
                className="ml-2 px-1.5 py-0.5 rounded text-xs bg-indigo-100 text-indigo-500 dark:bg-indigo-900/40 dark:text-indigo-300"
              >
                有闰月
              </button>
            )}
            {isLeap && (
              <button
                type="button"
                onClick={() => setIsLeap(false)}
                className="ml-2 px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
              >
                普通月
              </button>
            )}
          </span>
          <button onClick={() => changeMonth(1)} className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">▶</button>
        </div>

        {/* 星期表头 */}
        <div className="grid grid-cols-7 mb-1">
          {WEEK_HEADS.map((w) => (
            <span key={w} className="text-center text-xs text-gray-400 py-1">{w}</span>
          ))}
        </div>

        {/* 日期网格：农历日为主，公历日为辅 */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: offset }).map((_, i) => <span key={`b${i}`} />)}
          {Array.from({ length: days }, (_, i) => i + 1).map((day) => {
            const solar = lunarToSolar(year, month, day, isLeap) || '';
            const isToday = solar === todayLocal();
            return (
              <button
                key={day}
                type="button"
                onClick={() => handleDay(day)}
                className={`flex flex-col items-center py-1.5 rounded-lg transition-colors ${
                  isToday
                    ? 'bg-indigo-500 text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <span className="text-sm">{getLunarDayName(day)}</span>
                <span className={`text-[10px] ${isToday ? 'text-white/70' : 'text-gray-400'}`}>
                  {solar ? solar.slice(5).replace('-', '/') : ''}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
