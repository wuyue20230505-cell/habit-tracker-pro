import { useMemo } from 'react';
import type { Checkin } from '../types';
import { calcStreak, calcLongestStreak } from '../utils/streak';

export function useStreak(checkins: Checkin[], habitId: string, fromDate: string) {
  return useMemo(() => {
    const current = calcStreak(checkins, habitId, fromDate);
    const longest = calcLongestStreak(checkins, habitId);
    return { current, longest };
  }, [checkins, habitId, fromDate]);
}
