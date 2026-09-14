export interface Habit {
  id: string;
  name: string;
  emoji: string;
  color: string;
  frequency: Frequency;
  createdAt: string;
  archived: boolean;
  usePomodoro?: boolean;
  pomodoroMinutes?: number;
  breakMinutes?: number;
  dailyGoal?: number;
  excludeHolidays?: boolean; // 每天频率：法定节假日跳过打卡
  excludeWeekends?: boolean; // 每天频率：周末休息跳过打卡
}

export type Frequency =
  | { type: 'daily' }
  | { type: 'weekly'; count: number }
  | { type: 'monthly'; count: number };

export interface Checkin {
  id: string;
  habitId: string;
  date: string;
  note?: string;
}

export interface ActivePomodoro {
  habitId: string;
  habitName: string;
  habitEmoji: string;
  workMinutes: number;
  breakMinutes: number;
  startedAt: number;
  totalCycles: number;  // completed work cycles
  isBreak: boolean;
  phaseStartedAt: number;
  goalId?: string;
}

export interface PomodoroRecord {
  id: string;
  date: string;
  minutes: number;
  habitId?: string;
}

// ====== 目标 ======
export type GoalStatus = 'active' | 'completed' | 'abandoned';
export type GoalCategory = '学习' | '健康' | '财务' | '生活' | '其他';

export interface Goal {
  id: string;
  name: string;
  emoji: string;
  iconImage?: string;
  category: GoalCategory;
  targetValue: number;
  currentValue: number;
  unit: string;
  startDate: string;
  endDate?: string;
  status: GoalStatus;
  createdAt: string;
  completedAt?: string;
  remindEnabled?: boolean;
}

// ====== 倒数日 ======
export type CountdownRepeat = 'none' | 'weekly' | 'monthly' | 'yearly';
export type CalendarType = 'solar' | 'lunar';

export interface Countdown {
  id: string;
  name: string;
  color: string;
  targetDate: string;
  calendarType: CalendarType;
  repeat: CountdownRepeat;
  note?: string;
  image?: string;
  borderColor?: string;
  pinned?: boolean;
  remindEnabled?: boolean;
  skipHolidays?: boolean; // 倒数只统计工作日（跳过法定节假日）
  skipWeekends?: boolean; // 倒数只统计工作日（跳过周末休息）
  createdAt: string;
}

// ====== 全局状态 ======
export type AppState = {
  habits: Habit[];
  checkins: Checkin[];
  activePomodoro: ActivePomodoro | null;
  pomodoroRecords: PomodoroRecord[];
  goals: Goal[];
  countdowns: Countdown[];
  deletedHabitIds: string[]; // 已删除习惯的墓碑 id，同步云端防止复活
};

export type AppAction =
  | { type: 'ADD_HABIT'; payload: Habit }
  | { type: 'UPDATE_HABIT'; payload: Habit }
  | { type: 'DELETE_HABIT'; payload: string }
  | { type: 'ARCHIVE_HABIT'; payload: string }
  | { type: 'ADD_CHECKIN'; payload: { habitId: string; date: string } }
  | { type: 'REMOVE_CHECKIN'; payload: { habitId: string; date: string } }
  | { type: 'START_POMODORO'; payload: ActivePomodoro }
  | { type: 'STOP_POMODORO' }
  | { type: 'START_BREAK' }
  | { type: 'INCREMENT_CYCLE' }
  | { type: 'ADD_POMODORO_RECORD'; payload: PomodoroRecord }
  | { type: 'ADD_GOAL'; payload: Goal }
  | { type: 'UPDATE_GOAL'; payload: Goal }
  | { type: 'INCREMENT_GOAL'; payload: { id: string; delta: number } }
  | { type: 'DELETE_GOAL'; payload: string }
  | { type: 'ADD_COUNTDOWN'; payload: Countdown }
  | { type: 'UPDATE_COUNTDOWN'; payload: Countdown }
  | { type: 'DELETE_COUNTDOWN'; payload: string }
  | { type: 'CLOUD_SYNC'; payload: { habits: Habit[]; checkins: Checkin[]; records: PomodoroRecord[]; goals: Goal[]; countdowns: Countdown[]; deletedHabitIds: string[] } };
