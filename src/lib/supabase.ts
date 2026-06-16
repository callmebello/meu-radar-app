import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Browser-safe (anon) client. Reads VITE_-prefixed env (the only ones Vite
// exposes to the client). Guarded: if env isn't set yet, `supabase` is null and
// callers degrade gracefully instead of crashing the whole app at import time.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(url && anonKey && !url.includes("your_supabase_url"));

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(url as string, anonKey as string)
  : null;
