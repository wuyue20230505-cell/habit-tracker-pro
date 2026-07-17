import { createClient, type SupabaseClient } from '@supabase/supabase-js';
export type { User } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

function createSupabaseClient(): SupabaseClient | null {
  if (!url || !key || url.startsWith('your-') || key.startsWith('your-')) return null;
  try { return createClient(url, key); } catch { return null; }
}

export const supabase = createSupabaseClient();
