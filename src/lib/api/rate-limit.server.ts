import { createHash } from "node:crypto";
import process from "node:process";
import { getSupabaseAdmin } from "../supabase.server";

/**
 * Per-caller rate limiting and response caching for the APIs that cost money.
 *
 * The device-local quota in lib/security/quota.ts is a product limit and stops
 * nobody; this is the server-side control. It exists because a scan spends real
 * credits: each one fires HIBP plus up to two SerpAPI searches, and SerpAPI's
 * free tier is 240 calls a MONTH — roughly 120 scans — shared by everyone.
 *
 * Two deliberate choices:
 *
 * 1. The subject is a salted SHA-256 of the IP, never the IP itself. Same rule
 *    the CPF already follows. It is only ever compared against itself, so
 *    hashing costs nothing operationally.
 *
 * 2. Both functions FAIL OPEN. If Supabase is unreachable or the RPC is
 *    missing, the scan proceeds. Blocking a paid-traffic funnel because a
 *    counter is unavailable would cost far more than the credits it saves.
 *    That means these limits are only as reliable as the database — which is
 *    the right trade here, but worth knowing.
 *
 * Brazilian mobile carriers put thousands of subscribers behind one CGNAT
 * address, so the limits are set to stop scripted enumeration, not to meter
 * honest use: a real person scans two or three times, not thirty.
 */
const salt = () => process.env.CPF_SALT ?? "";

const sha = (value: string) =>
  createHash("sha256")
    .update(value + salt())
    .digest("hex");

/** Salted hash of the caller's IP, or null when it cannot be determined. */
export async function callerKey(): Promise<string | null> {
  try {
    const mod = (await import("@tanstack/react-start/server")) as {
      getWebRequest?: () => Request | undefined;
    };
    const req = mod.getWebRequest?.();
    const xff = req?.headers?.get("x-forwarded-for");
    const ip = xff ? xff.split(",")[0].trim() : req?.headers?.get("x-real-ip");
    return ip ? sha(ip) : null;
  } catch {
    return null;
  }
}

/**
 * True when this caller may spend another call today.
 * Fails open on any error, and when the IP is unknown.
 */
export async function withinRateLimit(bucket: string, limit: number): Promise<boolean> {
  const admin = getSupabaseAdmin();
  if (!admin) return true;
  const subject = await callerKey();
  if (!subject) return true;
  try {
    const { data, error } = await admin.rpc("bump_rate_limit", {
      p_bucket: bucket,
      p_subject: subject,
    });
    if (error || typeof data !== "number") return true;
    return data <= limit;
  } catch {
    return true;
  }
}

/** Cache key for a lookup value (CPF, phone, e-mail) — hashed, never raw. */
export const cacheKeyFor = (kind: string, value: string) => `${kind}:${sha(value)}`;

/** A cached response, when one exists and is younger than maxAgeHours. */
export async function readCache<T>(cacheKey: string, maxAgeHours: number): Promise<T | null> {
  const admin = getSupabaseAdmin();
  if (!admin) return null;
  try {
    const { data } = await admin
      .from("api_cache")
      .select("result, created_at")
      .eq("cache_key", cacheKey)
      .maybeSingle();
    if (!data) return null;
    const age = Date.now() - new Date(data.created_at as string).getTime();
    if (age > maxAgeHours * 3600_000) return null;
    return data.result as T;
  } catch {
    return null;
  }
}

/** Stores a response. Best-effort: a failed write only costs a future call. */
export async function writeCache(cacheKey: string, kind: string, result: unknown): Promise<void> {
  const admin = getSupabaseAdmin();
  if (!admin) return;
  try {
    await admin
      .from("api_cache")
      .upsert(
        { cache_key: cacheKey, kind, result, created_at: new Date().toISOString() },
        { onConflict: "cache_key" },
      );
  } catch {
    /* ignore */
  }
}
