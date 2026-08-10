import { createContext, useContext, useReducer, useEffect, useRef, type ReactNode } from 'react';
import type { AppState, AppAction, Habit, Checkin, ActivePomodoro } from '../types';
import { generateId, today } from '../utils/date';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { syncToLeaderboard } from '../utils/leaderboardSync';
import { pushAll, pullAll } from '../utils/cloudSync';
import { supabase } from '../lib/supabase';

const initialState: AppState = {
  habits: [],
  checkins: [],
  activePomodoro: null,
  pomodoroRecords: [],
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
        ...state,
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

    case 'ADD_POMODORO_RECORD':
      return { ...state, pomodoroRecords: [...(state.pomodoroRecords || []), action.payload] };

    case 'CLOUD_SYNC':
      return {
        ...state,
        habits: action.payload.habits,
        checkins: action.payload.checkins,
        pomodoroRecords: action.payload.records,
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
  addPomodoroRecord: (minutes: number, habitId?: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children, uid }: { children: ReactNode; uid?: string }) {
  const storageKey = `habit-${uid || 'local'}`;
  const [rawState, setState] = useLocalStorage<AppState>(storageKey, initialState);
  const state: AppState = { ...initialState, ...rawState, pomodoroRecords: rawState.pomodoroRecords || [] };
  const [stateSnapshot, dispatch] = useReducer(reducer, state);
  const cloudSynced = useRef(false);
  const cloudReady = useRef(false); // pullAll 完成后才允许 push
  // 最新状态 ref：连续 dispatch（如番茄钟完成时 打卡+记录+切休息 连发）时，
  // React 批量更新只保留最后一次 setState 直接值，会丢中间状态，
  // 必须用 ref 同步推进派生，确保每次 action 都基于最新状态
  const latestState = useRef(stateSnapshot);

  // ── 登录后同步云端数据 ──
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) return;
      cloudSynced.current = true;
      cloudReady.current = false;

      // 先推送本地状态到云端，确保本地删除同步上去
      // 使用 latestState.current 而非闭包中的 state（后者在 effect 里是过时的）
      const local = latestState.current;
      pushAll(local.habits, local.checkins, local.pomodoroRecords || [])
        .catch(() => {}) // 网络失败不阻塞后续流程
        .finally(() => pullAll())
        .then((cloud) => {
          cloudReady.current = true;

          // 合并：本地优先覆盖云端同名 id，新增的取并集
          const mergeArr = <T extends { id: string }>(a: T[], b: T[]) => {
            const map = new Map<string, T>();
            // b（本地）先加入 → a（云端）覆盖同名 → 本地胜
            [...b, ...a].forEach(x => map.set(x.id, x));
            return [...map.values()];
          };
          const habits = mergeArr(cloud.habits, local.habits);
          const checkins = mergeArr(cloud.checkins, local.checkins);
          const records = mergeArr(cloud.records, local.pomodoroRecords || []);

          const newState: AppState = { habits, checkins, activePomodoro: null, pomodoroRecords: records };
          setState(newState);
          latestState.current = newState;
          dispatch({ type: 'CLOUD_SYNC', payload: { habits, checkins, records } });
        });
    });
  }, []);

  const persistDispatch = (action: AppAction) => {
    // 从 latestState 派生（同步推进），连续 dispatch 不丢中间状态
    const newState = reducer(latestState.current, action);
    latestState.current = newState;
    dispatch(action);
    setState(newState);
    // 登录后自动推送云端（防抖）
    if (supabase && cloudSynced.current) {
      clearTimeout((persistDispatch as any)._t);
      (persistDispatch as any)._t = setTimeout(() => {
        if (cloudReady.current) {
          pushAll(newState.habits, newState.checkins, newState.pomodoroRecords || []);
        }
      }, 2000);
    }
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

  // ── 同步排行榜 ────────────────────────────
  const syncLB = (habits: Habit[], checkins: Checkin[]) => {
    syncToLeaderboard(habits, checkins, latestState.current.pomodoroRecords || []);
  };

  const addCheckin = (habitId: string, date?: string) => {
    persistDispatch({
      type: 'ADD_CHECKIN',
      payload: { habitId, date: date || today() },
    });
    const cur = latestState.current;
    syncLB(cur.habits, cur.checkins);
  };

  const removeCheckin = (habitId: string, date?: string) => {
    persistDispatch({
      type: 'REMOVE_CHECKIN',
      payload: { habitId, date: date || today() },
    });
    syncLB(latestState.current.habits, latestState.current.checkins);
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
    const goal = habit.dailyGoal ?? 1;

    // Any frequency must first meet the daily cap for today
    const todayCount = getCheckinCount(habitId, d);
    if (todayCount < goal) return false;

    if (habit.frequency.type === 'daily') {
      return true;
    }

    if (habit.frequency.type === 'weekly') {
      // Count unique days with checkins in this week
      const dt = new Date(d + 'T00:00:00');
      const day = dt.getDay();
      const monday = new Date(dt);
      monday.setDate(dt.getDate() - (day === 0 ? 6 : day - 1));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      const mondayStr = monday.toISOString().slice(0, 10);
      const sundayStr = sunday.toISOString().slice(0, 10);
      const weekDays = new Set(
        stateSnapshot.checkins
          .filter(c => c.habitId === habitId && c.date >= mondayStr && c.date <= sundayStr)
          .map(c => c.date)
      );
      return weekDays.size >= habit.frequency.count;
    }

    if (habit.frequency.type === 'monthly') {
      // Count unique days with checkins in this month
      const monthPrefix = d.slice(0, 7);
      const monthDays = new Set(
        stateSnapshot.checkins
          .filter(c => c.habitId === habitId && c.date.startsWith(monthPrefix))
          .map(c => c.date)
      );
      return monthDays.size >= habit.frequency.count;
    }

    return true;
  };

  const startPomodoro = (habit: Habit, _date: string) => {
    const payload: ActivePomodoro = {
      habitId: habit.id,
      habitName: habit.name,
      habitEmoji: habit.emoji,
      workMinutes: habit.pomodoroMinutes ?? 25,
      breakMinutes: habit.breakMinutes ?? 5,
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

  const addPomodoroRecord = (minutes: number, habitId?: string) => {
    const record = {
      id: generateId(),
      date: today(),
      minutes,
      habitId,
    };
    persistDispatch({ type: 'ADD_POMODORO_RECORD', payload: record });
    // 用最新状态同步排行榜（persistDispatch 已同步推进 latestState）
    syncToLeaderboard(
      latestState.current.habits,
      latestState.current.checkins,
      latestState.current.pomodoroRecords || [],
    );
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
        addPomodoroRecord,
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
