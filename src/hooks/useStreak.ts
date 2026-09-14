import { useMemo } from 'react';
import type { Checkin, Habit } from '../types';
import { calcStreak, calcLongestStreak, buildSkipPredicate } from '../utils/streak';

export function useStreak(checkins: Checkin[], habitId: string, fromDate: string, habit?: Habit | null) {
  const skip = buildSkipPredicate(habit);
  return useMemo(() => {
    const current = calcStreak(checkins, habitId, fromDate, skip);
    const longest = calcLongestStreak(checkins, habitId, skip);
    return { current, longest };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkins, habitId, fromDate, habit?.excludeHolidays, habit?.excludeWeekends]);
}
