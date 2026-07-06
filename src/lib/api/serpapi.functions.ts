import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import process from "node:process";
import { consumeSerpApiBudget } from "./api-usage.server";

export type ExposureSource = { title: string; link: string; snippet: string };
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

    const hasBudget = await consumeSerpApiBudget();
    if (!hasBudget) return { found: false, count: 0, sources: [], skipped: true };

    try {
      const url = `https://serpapi.com/search.json?q=${encodeURIComponent(`"${data.query}"`)}&api_key=${key}&num=5`;
      const res = await fetch(url);
      const json = (await res.json()) as {
        organic_results?: Array<{ title?: string; link?: string; snippet?: string }>;
      };
      const results = Array.isArray(json.organic_results) ? json.organic_results : [];
      return {
        found: results.length > 0,
        count: results.length,
        sources: results.slice(0, 3).map((r) => ({
          title: r.title ?? "",
          link: r.link ?? "",
          snippet: r.snippet ?? "",
        })),
      };
    } catch {
      return { found: false, count: 0, sources: [] };
    }
  });
