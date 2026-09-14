// 倒数日工具

import type { CountdownRepeat } from '../types'
import { countWorkdaysBetween } from './holidays'

/** 本地时区今天日期 (YYYY-MM-DD) —— 不用 date.ts 的 UTC 版 */
function todayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** 跳过选项：为 true 时倒数只统计工作日 */
export interface CountdownSkip {
  holidays?: boolean
  weekends?: boolean
}

/** dateStr 偏移 delta 天（本地时区安全） */
function shiftDay(dateStr: string, delta: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + delta)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** (fromDate, toDate] 区间（不含 fromDate、含 toDate）的工作日数 */
function workdaysAfter(fromDate: string, toDate: string): number {
  if (toDate <= fromDate) return 0
  return countWorkdaysBetween(shiftDay(fromDate, 1), toDate)
}

/** [fromDate, toDate) 区间（含 fromDate、不含 toDate）的工作日数 */
function workdaysBefore(fromDate: string, toDate: string): number {
  if (toDate <= fromDate) return 0
  return countWorkdaysBetween(fromDate, shiftDay(toDate, -1))
}

/** 6 种卡片预设颜色 */
export const CARD_COLORS = [
  '#FF8C5A', // 珊瑚橙
  '#5BB5B0', // 青绿
  '#5B8BD0', // 天蓝
  '#96CEB4', // 薄荷绿
  '#DDA0DD', // 淡紫
  '#F59E0B', // 暖金
]

/** 8 种边框颜色 */
export const BORDER_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#DDA0DD', '#F59E0B', '#FF8C5A', '#6366F1',
]

/** 星期文本 */
const WEEKDAY_NAMES = ['日', '一', '二', '三', '四', '五', '六']

/** 计算距离下一次发生的天数（考虑重复规则；skip 开启时只统计工作日） */
export function calcDays(
  targetDate: string,
  repeat?: CountdownRepeat,
  skip?: CountdownSkip,
): { days: number; isPast: boolean; label: string; nextDate: string } {
  const target = new Date(targetDate + 'T00:00:00')
  const now = new Date(todayLocal() + 'T00:00:00')
  const todayStr = todayLocal()
  const skipActive = !!(skip?.holidays || skip?.weekends)

  let nextDate = targetDate
  let diff = Math.floor((target.getTime() - now.getTime()) / 86400000)

  // 对于重复事件，始终计算下一次发生日期
  if (repeat === 'yearly') {
    const tMonth = target.getMonth() + 1
    const tDay = target.getDate()
    let next = new Date(now.getFullYear(), tMonth - 1, tDay)
    if (next.getTime() < now.getTime()) {
      next = new Date(now.getFullYear() + 1, tMonth - 1, tDay)
    }
    // 处理闰年 2/29：如果今年没有这一天，跳到下一年
    if (next.getMonth() + 1 !== tMonth || next.getDate() !== tDay) {
      next = new Date(now.getFullYear() + 1, tMonth - 1, tDay)
    }
    nextDate = toDateStr(next)
    diff = Math.floor((next.getTime() - now.getTime()) / 86400000)
  } else if (repeat === 'monthly') {
    const tDay = target.getDate()
    let next = new Date(now.getFullYear(), now.getMonth(), tDay)
    if (next.getTime() < now.getTime()) {
      next = new Date(now.getFullYear(), now.getMonth() + 1, tDay)
    }
    // 如果日期溢出（如1月31日在2月不存在），使用该月最后一天
    if (next.getDate() !== tDay && next.getMonth() !== now.getMonth() && next.getMonth() !== now.getMonth() + 1) {
      next = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    }
    nextDate = toDateStr(next)
    diff = Math.floor((next.getTime() - now.getTime()) / 86400000)
  } else if (repeat === 'weekly') {
    const tDayOfWeek = target.getDay()
    const nowDay = now.getDay()
    let daysUntil = tDayOfWeek - nowDay
    if (daysUntil < 0) daysUntil += 7
    const next = new Date(now)
    next.setDate(next.getDate() + (daysUntil === 0 ? 0 : daysUntil))
    nextDate = toDateStr(next)
    diff = daysUntil === 0 ? 0 : daysUntil
  }

  const unit = skipActive ? '个工作日' : '天'

  if (diff === 0) {
    return { days: 0, isPast: false, label: '就是今天！', nextDate }
  }
  if (diff > 0) {
    // 未来：跳过模式只统计 (今天, 目标日] 区间的工作日
    const days = skipActive ? workdaysAfter(todayStr, nextDate) : diff
    return { days, isPast: false, label: `还有 ${days} ${unit}`, nextDate }
  }
  // 已过（仅不重复）：跳过模式只统计 [目标日, 今天) 区间的工作日
  const days = skipActive ? workdaysBefore(nextDate, todayStr) : Math.abs(diff)
  return { days, isPast: true, label: `已经 ${days} ${unit}`, nextDate }
}

/** 获取下一次发生日期（用于表单保存时构造 targetDate） */
export function getNextOccurrence(dateStr: string, repeat: CountdownRepeat): string {
  if (!repeat || repeat === 'none') return dateStr
  const result = calcDays(dateStr, repeat)
  return result.nextDate
}

/** 判断下一次发生是否是明天 */
export function isTomorrow(targetDate: string, repeat?: CountdownRepeat): boolean {
  if (!targetDate) return false
  if (repeat && repeat !== 'none') {
    const { days } = calcDays(targetDate, repeat)
    return days === 1
  }
  const target = new Date(targetDate + 'T00:00:00')
  const tomorrow = new Date(todayLocal() + 'T00:00:00')
  tomorrow.setDate(tomorrow.getDate() + 1)
  return target.getTime() === tomorrow.getTime()
}

/** 重复类型文本 */
export function formatRepeat(r: CountdownRepeat): string {
  const map: Record<CountdownRepeat, string> = {
    none: '不重复',
    weekly: '每周重复',
    monthly: '每月重复',
    yearly: '每年重复',
  }
  return map[r]
}

/** 格式化日期 YYYY-MM-DD → YYYY.MM.DD */
export function formatCountdownDate(dateStr: string): string {
  return dateStr.replace(/-/g, '.')
}

/** 获取星期中文名 */
export function getWeekdayName(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return '星期' + WEEKDAY_NAMES[d.getDay()]
}

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
