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

// ── 本周 / 本月打卡数 ──────────────────────────────
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

// ── 重置周/月计数器（跨周期时调用） ───────────
function shouldResetWeekly(lastDate: string | null): boolean {
  if (!lastDate) return false;
  const now = new Date();
  const last = new Date(lastDate + 'T00:00:00');
  const nowMonday = new Date(now);
  const day = now.getDay();
  nowMonday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  const lastMonday = new Date(last);
  const lastDay = last.getDay();
  lastMonday.setDate(last.getDate() - (lastDay === 0 ? 6 : lastDay - 1));
  return nowMonday.toISOString().slice(0, 10) !== lastMonday.toISOString().slice(0, 10);
}

function shouldResetMonthly(lastDate: string | null): boolean {
  if (!lastDate) return false;
  const now = new Date().toISOString().slice(0, 7);
  const last = (lastDate || '').slice(0, 7);
  return now !== last;
}

// ── 主入口：同步当前用户数据到排行榜 ──────────
export async function syncToLeaderboard(
  habits: Habit[],
  checkins: Checkin[],
  totalPomodoro: number,
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
  const resetWeekly = shouldResetWeekly(existing.data?.last_checkin_date ?? null);
  const resetMonthly = shouldResetMonthly(existing.data?.last_checkin_date ?? null);

  const newStreak = calcStreak(checkins);
  const newLongest = Math.max(prevLongest, calcLongestStreak(checkins));

  const payload = {
    user_id: user.id,
    display_name: displayName || user.email?.split('@')[0] || '匿名用户',
    avatar_emoji: '🏃',
    total_checkins: checkins.length,
    current_streak: newStreak,
    longest_streak: newLongest,
    weekly_checkins: resetWeekly ? thisWeekCount(checkins) : thisWeekCount(checkins),
    month_checkins: resetMonthly ? thisMonthCount(checkins) : thisMonthCount(checkins),
    habit_count: habits.filter((h) => !h.archived).length,
    total_pomodoro: totalPomodoro,
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
  habit_count: number;
  total_pomodoro: number;
  last_checkin_date: string | null;
  updated_at: string;
};

export type RankBy = 'total_checkins' | 'weekly_checkins' | 'month_checkins' | 'current_streak';

export async function fetchLeaderboard(
  rankBy: RankBy = 'weekly_checkins',
  limit = 50,
): Promise<LeaderboardEntry[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .order(rankBy, { ascending: false })
    .limit(limit);

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

  const { data: all } = await supabase
    .from('leaderboard')
    .select('user_id')
    .order(rankBy, { ascending: false });

  if (!all) return null;
  const idx = all.findIndex((r) => r.user_id === user.id);
  return idx === -1 ? null : idx + 1;
}
