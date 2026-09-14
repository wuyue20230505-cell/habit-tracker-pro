// 目标工具函数

import type { Goal, GoalCategory } from '../types'

/** 本地时区今天日期 (YYYY-MM-DD) —— 不用 date.ts 的 UTC 版 */
function todayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const CATEGORY_COLORS: Record<GoalCategory, string> = {
  '学习': '#6366f1',
  '健康': '#10b981',
  '财务': '#f59e0b',
  '生活': '#ec4899',
  '其他': '#8b5cf6',
}

// 励志名人名言 —— 目标完成时随机展示
export const QUOTES = [
  '不积跬步，无以至千里。—— 荀子',
  '千里之行，始于足下。—— 老子',
  '世上无难事，只要肯登攀。—— 毛泽东',
  '坚持就是胜利。',
  '每一个伟大的成就都始于一个决定去尝试。',
  '成功的秘诀在于坚持自己的目标。',
  '自律给我自由。',
  '种一棵树最好的时间是十年前，其次是现在。',
  '每天进步一点点，终将抵达远方。',
  '不是因为看到希望才坚持，而是坚持了才看到希望。',
  '你的日积月累，终会成为别人的望尘莫及。',
  '优秀是一种习惯。—— 亚里士多德',
  '天行健，君子以自强不息。—— 《周易》',
  '宝剑锋从磨砺出，梅花香自苦寒来。',
  '只要功夫深，铁杵磨成针。',
]

export function getRandomQuote(): string {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)]
}

export function goalProgress(g: Goal): number {
  if (g.targetValue <= 0) return 0
  return Math.min(100, Math.round((g.currentValue / g.targetValue) * 100))
}

export function isOverdue(g: Goal): boolean {
  return g.status === 'active' && !!g.endDate && g.endDate < todayLocal()
}

export function formatGoalRange(g: Goal): string {
  const fmt = (s: string) => s.slice(5).replace('-', '-')
  const start = fmt(g.startDate)
  return g.endDate ? `${start} ~ ${fmt(g.endDate)}` : `${start} ~ 不限时`
}
