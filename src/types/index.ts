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
  dailyGoal?: number;
  excludeHolidays?: boolean;
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
}

export type AppState = {
  habits: Habit[];
  checkins: Checkin[];
  activePomodoro: ActivePomodoro | null;
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
  | { type: 'INCREMENT_CYCLE' };
