import { supabase } from '../lib/supabase';
import type { Habit, Checkin } from '../types';

// ── 计算连续打卡天数 ──────────────────────────────
function calcStreak(checkins: Checkin[], habitId?: string): number {
  const dates = checkins
    .filter((c) => !habitId || c.habitId === habitId)
    .map((c) => c.date);

  const unique = [...new Set(dates)].sort().reverse();
  if (unique.length === 0) return 0;

  let streak = 0;
  const today = new Date().toISOString().slice(0, 10);
  let expected = new Date(today + 'T00:00:00');

  for (const d of unique) {
    const actual = new Date(d + 'T00:00:00');
    const diff = (expected.getTime() - actual.getTime()) / 86400000;

    if (diff === 0) {
      streak++;
      expected.setDate(expected.getDate() - 1);
    } else if (diff === 1 && streak === 0) {
      // today not checked in yet, check yesterday
      streak++;
      expected = new Date(actual.getTime() - 86400000);
    } else if (diff > 1) {
      break;
    } else {
      // skip duplicate dates
      continue;
    }
  }
  return streak;
}

function calcLongestStreak(checkins: Checkin[], habitId?: string): number {
  const dates = checkins
    .filter((c) => !habitId || c.habitId === habitId)
    .map((c) => c.date);

  const unique = [...new Set(dates)].sort();
  if (unique.length === 0) return 0;

  let longest = 1;
  let current = 1;
  for (let i = 1; i < unique.length; i++) {
    const prev = new Date(unique[i - 1] + 'T00:00:00');
    const curr = new Date(unique[i] + 'T00:00:00');
    const diff = (curr.getTime() - prev.getTime()) / 86400000;
    if (diff === 1) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }
  return longest;
}

// ── 今日 / 本周 / 本月打卡数 ──────────────────────
function thisDayCount(checkins: Checkin[]): number {
  const today = new Date().toISOString().slice(0, 10);
  return checkins.filter(c => c.date === today).length;
}

function thisWeekCount(checkins: Checkin[]): number {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  const mondayStr = monday.toISOString().slice(0, 10);
  return checkins.filter((c) => c.date >= mondayStr).length;
}

function thisMonthCount(checkins: Checkin[]): number {
  const prefix = new Date().toISOString().slice(0, 7); // "2026-07"
  return checkins.filter((c) => c.date.startsWith(prefix)).length;
}

// ── 主入口：同步当前用户数据到排行榜 ──────────
export async function syncToLeaderboard(
  habits: Habit[],
  checkins: Checkin[],
  pomodoroRecords: { date: string; minutes: number }[],
  displayName?: string,
) {
  if (!supabase) return; // Supabase 未配置
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return; // 未登录不上报

  const lastDate = checkins.length > 0
    ? [...checkins].sort((a, b) => b.date.localeCompare(a.date))[0].date
    : null;

  const existing = await supabase
    .from('leaderboard')
    .select('weekly_checkins, month_checkins, last_checkin_date, longest_streak')
    .eq('user_id', user.id)
    .maybeSingle();

  const prevLongest = existing.data?.longest_streak ?? 0;

  const newStreak = calcStreak(checkins);
  const newLongest = Math.max(prevLongest, calcLongestStreak(checkins));

  // 专注时长统计
  const todayStr = new Date().toISOString().slice(0, 10);
  const weekStart = (() => { const d=new Date(); d.setDate(d.getDate()-(d.getDay()||7)+1); return d.toISOString().slice(0,10); })();
  const monthStart = new Date().toISOString().slice(0, 7);
  const totalPomodoro = pomodoroRecords.reduce((s,r)=>s+r.minutes,0);
  const dailyPomodoro = pomodoroRecords.filter(r=>r.date===todayStr).reduce((s,r)=>s+r.minutes,0);
  const weeklyPomodoro = pomodoroRecords.filter(r=>r.date>=weekStart).reduce((s,r)=>s+r.minutes,0);
  const monthlyPomodoro = pomodoroRecords.filter(r=>r.date.startsWith(monthStart)).reduce((s,r)=>s+r.minutes,0);

  const md = user.user_metadata || {};
  const payload = {
    user_id: user.id,
    display_name: displayName || md?.username || user.email?.split('@')[0] || '匿名用户',
    avatar_emoji: md?.avatar || '🏃',
    total_checkins: checkins.length,
    daily_checkins: thisDayCount(checkins),
    current_streak: newStreak,
    longest_streak: newLongest,
    weekly_checkins: thisWeekCount(checkins),
    month_checkins: thisMonthCount(checkins),
    habit_count: habits.filter((h) => !h.archived).length,
    total_pomodoro: totalPomodoro,
    daily_pomodoro: dailyPomodoro,
    weekly_pomodoro: weeklyPomodoro,
    monthly_pomodoro: monthlyPomodoro,
    last_checkin_date: lastDate,
    updated_at: new Date().toISOString(),
  };

  // Upsert: insert if new, update if exists
  const { error } = await supabase
    .from('leaderboard')
    .upsert(payload, { onConflict: 'user_id' });

  if (error) {
    console.warn('[leaderboard] sync failed:', error.message);
  }
}

// ── 拉取排行榜 ──────────────────────────────────
export type LeaderboardEntry = {
  id: string;
  user_id: string;
  display_name: string;
  avatar_emoji: string;
  total_checkins: number;
  current_streak: number;
  longest_streak: number;
  weekly_checkins: number;
  month_checkins: number;
  daily_checkins: number;
  habit_count: number;
  total_pomodoro: number;
  weekly_pomodoro: number;
  monthly_pomodoro: number;
  daily_pomodoro: number;
  last_checkin_date: string | null;
  updated_at: string;
};

export type RankBy = 'daily_pomodoro' | 'weekly_pomodoro' | 'monthly_pomodoro' | 'total_pomodoro';

// ── 时间过滤辅助 ──────────────────────────────
function getPeriodStart(rankBy: RankBy): string | null {
  const now = new Date();
  switch (rankBy) {
    case 'daily_pomodoro':   // 今日 0 点
      return now.toISOString().slice(0, 10);
    case 'weekly_pomodoro': { // 本周一
      const day = now.getDay();
      const mon = new Date(now);
      mon.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
      return mon.toISOString().slice(0, 10);
    }
    case 'monthly_pomodoro': // 本月 1 号
      return now.toISOString().slice(0, 7) + '-01';
    default:                 // total — 永不重置
      return null;
  }
}

export async function fetchLeaderboard(
  rankBy: RankBy = 'daily_pomodoro',
  limit = 50,
): Promise<LeaderboardEntry[]> {
  if (!supabase) return [];

  let query = supabase.from('leaderboard').select('*');

  // 日榜 / 周榜 / 月榜：只显示当前周期内同步过的用户
  const periodStart = getPeriodStart(rankBy);
  if (periodStart) {
    query = query.gte('updated_at', periodStart);
  }
  // 总榜：不过滤，永不重置

  query = query.order(rankBy, { ascending: false }).limit(limit);

  const { data, error } = await query;

  if (error) {
    console.warn('[leaderboard] fetch failed:', error.message);
    return [];
  }
  return data as LeaderboardEntry[];
}

// ── 获取当前用户排名 ────────────────────────────
export async function fetchMyRank(rankBy: RankBy): Promise<number | null> {
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  let query = supabase.from('leaderboard').select('user_id');

  // 日榜 / 周榜 / 月榜：只用当前周期内的数据
  const periodStart = getPeriodStart(rankBy);
  if (periodStart) {
    query = query.gte('updated_at', periodStart);
  }
  // 总榜：不过滤

  query = query.order(rankBy, { ascending: false });

  const { data: all } = await query;
  if (!all) return null;
  const idx = all.findIndex((r) => r.user_id === user.id);
  return idx === -1 ? null : idx + 1;
}
