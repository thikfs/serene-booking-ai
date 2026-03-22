import { createClient } from "@supabase/supabase-js";

function normalizeSupabaseUrl(url?: string) {
  if (!url) return url;
  const trimmed = url.replace(/\/+$/, "");
  if (trimmed.includes(".functions.supabase.co")) {
    return trimmed.replace(".functions.supabase.co", ".supabase.co");
  }
  return trimmed;
}

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseUrl = normalizeSupabaseUrl(rawSupabaseUrl);
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;

export function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  }
  return supabase;
}
