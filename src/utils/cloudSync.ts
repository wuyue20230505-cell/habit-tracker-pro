import { supabase } from '../lib/supabase';
import type { Habit, Checkin, PomodoroRecord } from '../types';

// ── 上传数据 ──────────────────────────────────
export async function pushHabits(habits: Habit[]) {
  if (!supabase) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  if (habits.length === 0) return;
  // 云端已有 + 本地合并，本地优先（本地删除/编辑会覆盖云端）
  const { data: existing } = await supabase.from('user_habits').select('habit_data').eq('user_id', user.id);
  const all = [...habits, ...(existing || []).map((r: any) => r.habit_data)];
  const seen = new Set(); const deduped = all.filter((h: Habit) => !seen.has(h.id) && seen.add(h.id));
  await supabase.from('user_habits').delete().eq('user_id', user.id);
  const rows = deduped.map(h => ({ user_id: user.id, habit_data: h }));
  await supabase.from('user_habits').upsert(rows, { onConflict: 'user_id,id' });
}

export async function pushCheckins(checkins: Checkin[]) {
  if (!supabase) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  if (checkins.length === 0) return;
  // 本地优先：本地数据在前，覆盖云端旧数据
  const { data: existing } = await supabase.from('user_checkins').select('checkin_data').eq('user_id', user.id);
  const all = [...checkins, ...(existing || []).map((r: any) => r.checkin_data)];
  const seen = new Set(); const deduped = all.filter((c: Checkin) => !seen.has(c.id) && seen.add(c.id));
  await supabase.from('user_checkins').delete().eq('user_id', user.id);
  for (let i = 0; i < deduped.length; i += 100) {
    const chunk = deduped.slice(i, i + 100).map(c => ({ user_id: user.id, checkin_data: c }));
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

export async function pushAll(habits: Habit[], checkins: Checkin[], records: PomodoroRecord[]) {
  await Promise.all([pushHabits(habits), pushCheckins(checkins), pushPomodoro(records)]);
}

// ── 下载数据 ──────────────────────────────────
export async function pullHabits(): Promise<Habit[]> {
  if (!supabase) return [];
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase.from('user_habits').select('habit_data').eq('user_id', user.id);
  return (data || []).map((r: any) => r.habit_data as Habit);
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

export async function pullAll(): Promise<{ habits: Habit[]; checkins: Checkin[]; records: PomodoroRecord[] }> {
  const [habits, checkins, records] = await Promise.all([pullHabits(), pullCheckins(), pullPomodoro()]);
  return { habits, checkins, records };
}
