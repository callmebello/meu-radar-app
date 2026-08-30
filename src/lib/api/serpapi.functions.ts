import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import process from "node:process";
import { consumeSerpApiBudget } from "./api-usage.server";
import { cacheKeyFor, readCache, withinRateLimit, writeCache } from "./rate-limit.server";

export type ExposureSource = { title: string; link: string; snippet: string };
// A real person scans two or three times; this only has to stop enumeration.
// Kept generous because Brazilian mobile carriers share one CGNAT address
// across thousands of subscribers.
const SERPAPI_PER_IP_DAILY = 12;

export type SearchExposureResult = {
  found: boolean;
  count: number;
  sources: ExposureSource[];
  skipped?: boolean;
};

// Public-web exposure search via SerpAPI (Google organic results). Server-only
// (reads SERPAPI_KEY). Guarded + budget-limited so it degrades to an empty
// (not-found) result instead of throwing when unconfigured or over budget.
export const searchExposure = createServerFn({ method: "POST" })
  .inputValidator(z.object({ query: z.string(), type: z.enum(["phone", "email", "cpf"]) }))
  .handler(async ({ data }): Promise<SearchExposureResult> => {
    const key = process.env.SERPAPI_KEY;
    if (!data.query.trim() || !key || key.includes("your_key")) {
      return { found: false, count: 0, sources: [] };
    }

    // Cache first: re-scanning the same identity is the most common repeat
    // call, and a hit costs no credits. Public search results for a CPF or
    // phone barely move week to week, so a week is a safe window.
    const cacheKey = cacheKeyFor(`serpapi:${data.type}`, data.query.trim());
    const cached = await readCache<SearchExposureResult>(cacheKey, 24 * 7);
    if (cached) return cached;

    // Then the per-caller limit. Without it one script could spend the whole
    // month's allowance — 240 calls, about 120 scans — for every user at once.
    if (!(await withinRateLimit("serpapi", SERPAPI_PER_IP_DAILY))) {
      return { found: false, count: 0, sources: [], skipped: true };
    }

    const hasBudget = await consumeSerpApiBudget();
    if (!hasBudget) return { found: false, count: 0, sources: [], skipped: true };

    try {
      const url = `https://serpapi.com/search.json?q=${encodeURIComponent(`"${data.query}"`)}&api_key=${key}&num=5`;
      const res = await fetch(url);
      const json = (await res.json()) as {
        organic_results?: Array<{ title?: string; link?: string; snippet?: string }>;
      };
      const results = Array.isArray(json.organic_results) ? json.organic_results : [];
      const out: SearchExposureResult = {
        found: results.length > 0,
        count: results.length,
        sources: results.slice(0, 3).map((r) => ({
          title: r.title ?? "",
          link: r.link ?? "",
          snippet: r.snippet ?? "",
        })),
      };
      await writeCache(cacheKey, "serpapi", out);
      return out;
    } catch {
      return { found: false, count: 0, sources: [] };
    }
  });
