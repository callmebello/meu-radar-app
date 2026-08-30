import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import process from "node:process";
import { cacheKeyFor, readCache, withinRateLimit, writeCache } from "./rate-limit.server";

// Server route equivalent of a Next.js app/api/hibp/route.ts.
// In TanStack Start this is a createServerFn — the .handler runs server-only,
// so HIBP_API_KEY (read via process.env per-request) never reaches the client.
// Call from the client:  await checkHibp({ data: { email } })

export type HibpBreach = {
  [k: string]: string | number | boolean | string[] | null;
};
export type HibpResult = { count: number; breaches: HibpBreach[] };

// HIBP bills per key and rate-limits hard, so the risk here is 429s and a
// blocked key under ad traffic rather than per-call spend. Cache + a per-caller
// cap address both. Generous on purpose: CGNAT puts many real users on one IP.
const HIBP_PER_IP_DAILY = 15;
const HIBP_CACHE_HOURS = 24;

export const checkHibp = createServerFn({ method: "POST" })
  .inputValidator(z.object({ email: z.string() }))
  .handler(async ({ data }): Promise<HibpResult> => {
    const email = data.email?.trim();
    if (!email) return { count: 0, breaches: [] };

    // A repeat scan of the same address returns the same breaches — serving it
    // from cache keeps us well under HIBP's rate limit instead of racing it.
    const key = cacheKeyFor("hibp", email.toLowerCase());
    const cached = await readCache<HibpResult>(key, HIBP_CACHE_HOURS);
    if (cached) return cached;

    // Empty result rather than an error: the report degrades to "no breaches
    // found" exactly as it already does when HIBP is unconfigured or down.
    if (!(await withinRateLimit("hibp", HIBP_PER_IP_DAILY))) return { count: 0, breaches: [] };

    const url = `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`;
    const headers = { "hibp-api-key": process.env.HIBP_API_KEY ?? "", "user-agent": "Priva-App" };
    try {
      let res = await fetch(url, { headers });
      // HIBP rate-limits hard (429). Under ad traffic that's common and would
      // otherwise return an empty report — wait the suggested window (capped)
      // and retry once so the real breaches still come back.
      if (res.status === 429) {
        const retryAfter = Math.min(Number(res.headers.get("retry-after")) || 2, 5);
        await new Promise((r) => setTimeout(r, retryAfter * 1000));
        res = await fetch(url, { headers });
      }
      // 404 = no breaches found for this account. Worth caching: "clean"
      // addresses are re-scanned as often as exposed ones.
      if (res.status === 404) {
        const empty = { count: 0, breaches: [] };
        await writeCache(key, "hibp", empty);
        return empty;
      }
      // A failure is NOT cached — that would freeze an outage into every
      // report for a day.
      if (!res.ok) return { count: 0, breaches: [] };

      const breaches = (await res.json()) as HibpBreach[];
      const out = { count: Array.isArray(breaches) ? breaches.length : 0, breaches };
      await writeCache(key, "hibp", out);
      return out;
    } catch {
      return { count: 0, breaches: [] };
    }
  });
