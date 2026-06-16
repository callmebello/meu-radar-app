import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import process from "node:process";

// Service-role admin client. SERVER ONLY — the .server.ts suffix keeps this out
// of the client bundle so SUPABASE_SERVICE_KEY never reaches the browser.
// Returns null when not configured so server functions can no-op gracefully.
export function getSupabaseAdmin(): SupabaseClient | null {
  const url =
    (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey || url.includes("your_supabase_url") || serviceKey.includes("your_service_key")) {
    return null;
  }
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}
