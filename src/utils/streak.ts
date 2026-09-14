import type { Checkin } from '../types';
import { isStatutoryHoliday, isWeekendRest } from './holidays';

/** 跳过日判断：返回 true 表示该日不要求打卡、不中断连续 */
export type SkipDayPredicate = (dateStr: string) => boolean;

/**
 * 由习惯的跳过设置构造"跳过日"判断函数（仅每天频率在表单中展示这两个开关）
 */
export function buildSkipPredicate(
  habit?: { excludeHolidays?: boolean; excludeWeekends?: boolean } | null
): SkipDayPredicate | undefined {
  if (!habit || (!habit.excludeHolidays && !habit.excludeWeekends)) return undefined;
  return (d: string) =>
    (!!habit.excludeHolidays && isStatutoryHoliday(d)) ||
    (!!habit.excludeWeekends && isWeekendRest(d));
}

/** UTC 格式 YYYY-MM-DD（与打卡日期字符串一致） */
function fmtUTC(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function calcStreak(
  checkins: Checkin[],
  habitId: string,
  fromDate: string,
  isSkippedDay?: SkipDayPredicate
): number {
  const dates = new Set(
    checkins.filter((c) => c.habitId === habitId).map((c) => c.date)
  );

  let streak = 0;
  const d = new Date(fromDate + 'T00:00:00Z'); // 与打卡日期的 UTC 表示对齐（避免东八区差一天）

  while (true) {
    const ds = fmtUTC(d);
    if (dates.has(ds)) {
      streak++;
      d.setUTCDate(d.getUTCDate() - 1);
      continue;
    }
    // 跳过日（法定节假日/周末）不打卡也不中断连续
    if (isSkippedDay && isSkippedDay(ds)) {
      d.setUTCDate(d.getUTCDate() - 1);
      continue;
    }
    break;
  }

  return streak;
}

export function calcLongestStreak(
  checkins: Checkin[],
  habitId: string,
  isSkippedDay?: SkipDayPredicate
): number {
  const dates = [...new Set(
    checkins.filter((c) => c.habitId === habitId).map((c) => c.date)
  )].sort();

  if (dates.length === 0) return 0;

  let longest = 1;
  let current = 1;

  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1] + 'T00:00:00Z');
    const curr = new Date(dates[i] + 'T00:00:00Z');
    const diff = Math.round((curr.getTime() - prev.getTime()) / 86400000);

    if (diff === 1) {
      current++;
    } else if (isSkippedDay && diff > 1) {
      // 中间全是跳过日 → 视为连续不断
      let allSkipped = true;
      const d = new Date(prev);
      for (let k = 1; k < diff; k++) {
        d.setUTCDate(d.getUTCDate() + 1);
        if (!isSkippedDay(fmtUTC(d))) {
          allSkipped = false;
          break;
        }
      }
      if (allSkipped) {
        current++;
      } else {
        current = 1;
      }
    } else {
      current = 1;
    }
    longest = Math.max(longest, current);
  }

  return longest;
}

export function countCheckins(checkins: Checkin[], habitId?: string, since?: string): number {
  let filtered = checkins;
  if (habitId) filtered = filtered.filter((c) => c.habitId === habitId);
  if (since) filtered = filtered.filter((c) => c.date >= since);
  return filtered.length;
}
