import { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { AppState, AppAction, Habit, Checkin, ActivePomodoro } from '../types';
import { generateId, today } from '../utils/date';
import { useLocalStorage } from '../hooks/useLocalStorage';

const initialState: AppState = {
  habits: [],
  checkins: [],
  activePomodoro: null,
};

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'ADD_HABIT':
      return { ...state, habits: [...state.habits, action.payload] };

    case 'UPDATE_HABIT':
      return {
        ...state,
        habits: state.habits.map((h) =>
          h.id === action.payload.id ? action.payload : h
        ),
      };

    case 'DELETE_HABIT':
      return {
        habits: state.habits.filter((h) => h.id !== action.payload),
        checkins: state.checkins.filter((c) => c.habitId !== action.payload),
        activePomodoro: state.activePomodoro?.habitId === action.payload ? null : state.activePomodoro,
      };

    case 'ARCHIVE_HABIT':
      return {
        ...state,
        habits: state.habits.map((h) =>
          h.id === action.payload ? { ...h, archived: !h.archived } : h
        ),
      };

    case 'ADD_CHECKIN': {
      const { habitId, date } = action.payload;
      const newCheckin: Checkin = { id: generateId(), habitId, date };
      return { ...state, checkins: [...state.checkins, newCheckin] };
    }

    case 'REMOVE_CHECKIN': {
      const { habitId, date } = action.payload;
      const idx = [...state.checkins].reverse().findIndex(
        (c) => c.habitId === habitId && c.date === date
      );
      if (idx === -1) return state;
      const realIdx = state.checkins.length - 1 - idx;
      return {
        ...state,
        checkins: state.checkins.filter((_, i) => i !== realIdx),
      };
    }

    case 'START_POMODORO':
      return { ...state, activePomodoro: action.payload };

    case 'STOP_POMODORO':
      return { ...state, activePomodoro: null };

    case 'START_BREAK':
      if (!state.activePomodoro) return state;
      return {
        ...state,
        activePomodoro: {
          ...state.activePomodoro,
          isBreak: true,
          phaseStartedAt: Date.now(),
        },
      };

    case 'INCREMENT_CYCLE':
      if (!state.activePomodoro) return state;
      return {
        ...state,
        activePomodoro: {
          ...state.activePomodoro,
          totalCycles: state.activePomodoro.totalCycles + 1,
          isBreak: false,
          phaseStartedAt: Date.now(),
        },
      };

    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  addHabit: (habit: Omit<Habit, 'id' | 'createdAt' | 'archived'>) => void;
  addCheckin: (habitId: string, date?: string) => void;
  removeCheckin: (habitId: string, date?: string) => void;
  getCheckinCount: (habitId: string, date?: string) => number;
  isCheckedIn: (habitId: string, date?: string) => boolean;
  startPomodoro: (habit: Habit, date: string) => void;
  stopPomodoro: () => void;
  startBreak: () => void;
  incrementCycle: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useLocalStorage<AppState>('habit-tracker', initialState);
  const [stateSnapshot, dispatch] = useReducer(reducer, state);

  const persistDispatch = (action: AppAction) => {
    const newState = reducer(stateSnapshot, action);
    dispatch(action);
    setState(newState);
  };

  const addHabit = (data: Omit<Habit, 'id' | 'createdAt' | 'archived'>) => {
    const habit: Habit = {
      ...data,
      id: generateId(),
      createdAt: new Date().toISOString(),
      archived: false,
    };
    persistDispatch({ type: 'ADD_HABIT', payload: habit });
  };

  const addCheckin = (habitId: string, date?: string) => {
    persistDispatch({
      type: 'ADD_CHECKIN',
      payload: { habitId, date: date || today() },
    });
  };

  const removeCheckin = (habitId: string, date?: string) => {
    persistDispatch({
      type: 'REMOVE_CHECKIN',
      payload: { habitId, date: date || today() },
    });
  };

  const getCheckinCount = (habitId: string, date?: string): number => {
    const d = date || today();
    return stateSnapshot.checkins.filter(
      (c) => c.habitId === habitId && c.date === d
    ).length;
  };

  const isCheckedIn = (habitId: string, date?: string): boolean => {
    const habit = stateSnapshot.habits.find((h) => h.id === habitId);
    if (!habit) return false;
    const d = date || today();

    if (habit.frequency.type === 'daily') {
      return getCheckinCount(habitId, d) >= (habit.dailyGoal ?? 1);
    }

    if (habit.frequency.type === 'weekly') {
      const dt = new Date(d + 'T00:00:00');
      const day = dt.getDay();
      const monday = new Date(dt);
      monday.setDate(dt.getDate() - (day === 0 ? 6 : day - 1));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const weekCheckins = stateSnapshot.checkins.filter(
        c => c.habitId === habitId && c.date >= monday.toISOString().slice(0,10) && c.date <= sunday.toISOString().slice(0,10)
      ).length;
      return weekCheckins >= habit.frequency.count;
    }

    if (habit.frequency.type === 'monthly') {
      const monthPrefix = d.slice(0, 7);
      const monthCheckins = stateSnapshot.checkins.filter(
        c => c.habitId === habitId && c.date.startsWith(monthPrefix)
      ).length;
      return monthCheckins >= habit.frequency.count;
    }

    return getCheckinCount(habitId, d) >= (habit.dailyGoal ?? 1);
  };

  const startPomodoro = (habit: Habit, _date: string) => {
    const payload: ActivePomodoro = {
      habitId: habit.id,
      habitName: habit.name,
      habitEmoji: habit.emoji,
      workMinutes: habit.pomodoroMinutes ?? 25,
      breakMinutes: 5,
      startedAt: Date.now(),
      totalCycles: 0,
      isBreak: false,
      phaseStartedAt: Date.now(),
    };
    persistDispatch({ type: 'START_POMODORO', payload });
  };

  const stopPomodoro = () => {
    persistDispatch({ type: 'STOP_POMODORO' });
  };

  const startBreak = () => {
    persistDispatch({ type: 'START_BREAK' });
  };

  const incrementCycle = () => {
    persistDispatch({ type: 'INCREMENT_CYCLE' });
  };

  return (
    <AppContext.Provider
      value={{
        state: stateSnapshot,
        dispatch: persistDispatch,
        addHabit,
        addCheckin,
        removeCheckin,
        getCheckinCount,
        isCheckedIn,
        startPomodoro,
        stopPomodoro,
        startBreak,
        incrementCycle,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
