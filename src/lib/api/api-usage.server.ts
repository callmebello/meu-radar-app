import { getSupabaseAdmin } from "../supabase.server";

// Soft monthly budget guard for paid APIs (SerpAPI free tier = 250/mo).
// Returns true if there is still budget (and increments the counter), false to
// skip the call. If Supabase isn't configured we don't block (best effort).
const SERPAPI_MONTHLY_LIMIT = 240;

function currentMonth() {
  return new Date().toISOString().slice(0, 7); // YYYY-MM
}

export async function consumeSerpApiBudget(): Promise<boolean> {
  const admin = getSupabaseAdmin();
  if (!admin) return true;

  const month = currentMonth();
  const { data } = await admin
    .from("api_usage")
    .select("count")
    .eq("api_name", "serpapi")
    .eq("month", month)
    .maybeSingle();

  const current = (data?.count as number | undefined) ?? 0;
  if (current >= SERPAPI_MONTHLY_LIMIT) return false;

  await admin
    .from("api_usage")
    .upsert({ api_name: "serpapi", month, count: current + 1 }, { onConflict: "api_name,month" });

  return true;
}
