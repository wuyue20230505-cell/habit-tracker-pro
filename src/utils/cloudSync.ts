import { supabase } from '../lib/supabase';
import type { Habit, Checkin, PomodoroRecord } from '../types';

// 墓碑机制：已删除习惯以 { habit_data: { id, deleted: true } } 行留在云端，
// 任何设备 pull 后都知道该习惯已被删除，删除操作才能真正同步、不再复活

// ── 上传数据 ──────────────────────────────────
export async function pushHabits(habits: Habit[], deletedHabitIds: string[] = []) {
  if (!supabase) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  // 读云端现有行，拆出正常行与墓碑行
  const { data: existing } = await supabase.from('user_habits').select('habit_data').eq('user_id', user.id);
  const cloudHabits: Habit[] = [];
  const cloudDeleted = new Set<string>();
  (existing || []).forEach((r: any) => {
    const h = r.habit_data as any;
    if (!h) return;
    if (h.deleted) cloudDeleted.add(h.id);
    else cloudHabits.push(h);
  });
  // 墓碑集合 = 云端已删 + 本地已删
  const deleted = new Set([...cloudDeleted, ...deletedHabitIds]);
  // 并集去重，本地优先；墓碑里的 id 一律剔除
  const map = new Map<string, Habit>();
  [...habits, ...cloudHabits].forEach((h) => {
    if (!deleted.has(h.id)) map.set(h.id, h);
  });
  // 全量替换：正常行 + 墓碑行（本地为空也要写墓碑，覆盖所有旧数据）
  await supabase.from('user_habits').delete().eq('user_id', user.id);
  const rows: any[] = [
    ...[...map.values()].map((h) => ({ user_id: user.id, habit_data: h })),
    ...[...deleted].map((id) => ({ user_id: user.id, habit_data: { id, deleted: true } })),
  ];
  if (rows.length > 0) {
    await supabase.from('user_habits').upsert(rows, { onConflict: 'user_id,id' });
  }
}

export async function pushCheckins(checkins: Checkin[], deletedHabitIds: string[] = []) {
  if (!supabase) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  // 已删除习惯的打卡（本地或云端）一律剔除，防止复活
  const live = checkins.filter((c) => !deletedHabitIds.includes(c.habitId));
  const { data: existing } = await supabase.from('user_checkins').select('checkin_data').eq('user_id', user.id);
  const cloud = (existing || [])
    .map((r: any) => r.checkin_data as Checkin)
    .filter((c) => c && !deletedHabitIds.includes(c.habitId));
  const map = new Map<string, Checkin>();
  [...live, ...cloud].forEach((c) => map.set(c.id, c)); // 本地优先
  await supabase.from('user_checkins').delete().eq('user_id', user.id);
  const all = [...map.values()];
  for (let i = 0; i < all.length; i += 100) {
    const chunk = all.slice(i, i + 100).map((c) => ({ user_id: user.id, checkin_data: c }));
    const { error } = await supabase.from('user_checkins').upsert(chunk, { onConflict: 'user_id,id' });
    if (error) console.warn('[sync] push checkins failed:', error.message);
  }
}

export async function pushPomodoro(records: PomodoroRecord[]) {
  if (!supabase) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  if (records.length === 0) return;
  // 合并云端已有记录，只追加不删除
  const { data: existing } = await supabase.from('user_pomodoro').select('record_data').eq('user_id', user.id);
  const existingIds = new Set((existing || []).map((r: any) => r.record_data.id));
  const newRows = records.filter(r => !existingIds.has(r.id)).map(r => ({ user_id: user.id, record_data: r }));
  if (newRows.length > 0) {
    const { error } = await supabase.from('user_pomodoro').upsert(newRows, { onConflict: 'user_id,id' });
    if (error) console.warn('[sync] push pomodoro failed:', error.message);
  }
}

export async function pushAll(habits: Habit[], checkins: Checkin[], records: PomodoroRecord[], deletedHabitIds: string[] = []) {
  await Promise.all([pushHabits(habits, deletedHabitIds), pushCheckins(checkins, deletedHabitIds), pushPomodoro(records)]);
}

// ── 下载数据 ──────────────────────────────────
export async function pullHabits(): Promise<{ habits: Habit[]; deletedHabitIds: string[] }> {
  if (!supabase) return { habits: [], deletedHabitIds: [] };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { habits: [], deletedHabitIds: [] };
  const { data } = await supabase.from('user_habits').select('habit_data').eq('user_id', user.id);
  const habits: Habit[] = [];
  const deletedHabitIds: string[] = [];
  (data || []).forEach((r: any) => {
    const h = r.habit_data as any;
    if (!h) return;
    if (h.deleted) deletedHabitIds.push(h.id);
    else habits.push(h);
  });
  return { habits, deletedHabitIds };
}

export async function pullCheckins(): Promise<Checkin[]> {
  if (!supabase) return [];
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase.from('user_checkins').select('checkin_data').eq('user_id', user.id);
  return (data || []).map((r: any) => r.checkin_data as Checkin);
}

export async function pullPomodoro(): Promise<PomodoroRecord[]> {
  if (!supabase) return [];
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase.from('user_pomodoro').select('record_data').eq('user_id', user.id);
  return (data || []).map((r: any) => r.record_data as PomodoroRecord);
}

export async function pullAll(): Promise<{ habits: Habit[]; checkins: Checkin[]; records: PomodoroRecord[]; deletedHabitIds: string[] }> {
  const [{ habits, deletedHabitIds }, checkins, records] = await Promise.all([pullHabits(), pullCheckins(), pullPomodoro()]);
  // 已删除习惯的云端打卡直接丢弃
  return {
    habits,
    checkins: checkins.filter((c) => !deletedHabitIds.includes(c.habitId)),
    records,
    deletedHabitIds,
  };
}
