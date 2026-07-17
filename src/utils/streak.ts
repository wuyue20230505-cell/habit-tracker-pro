import type { Checkin } from '../types';

export function calcStreak(checkins: Checkin[], habitId: string, fromDate: string): number {
  const dates = new Set(
    checkins.filter((c) => c.habitId === habitId).map((c) => c.date)
  );

  let streak = 0;
  const d = new Date(fromDate + 'T00:00:00');

  while (dates.has(d.toISOString().slice(0, 10))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }

  return streak;
}

export function calcLongestStreak(checkins: Checkin[], habitId: string): number {
  const dates = [...new Set(
    checkins.filter((c) => c.habitId === habitId).map((c) => c.date)
  )].sort();

  if (dates.length === 0) return 0;

  let longest = 1;
  let current = 1;

  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1] + 'T00:00:00');
    const curr = new Date(dates[i] + 'T00:00:00');
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

    if (diff === 1) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }

  return longest;
}

export function countCheckins(checkins: Checkin[], habitId?: string, since?: string): number {
  let filtered = checkins;
  if (habitId) filtered = filtered.filter((c) => c.habitId === habitId);
  if (since) filtered = filtered.filter((c) => c.date >= since);
  return filtered.length;
}
