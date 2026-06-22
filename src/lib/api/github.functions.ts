import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import process from "node:process";

export type GithubRepo = { repo: string; path: string; url: string };
export type GithubExposureResult = { found: boolean; count: number; repos: GithubRepo[] };

// GitHub code search for an e-mail leaked in public repos. NOTE: GitHub's code
// search endpoint REQUIRES authentication — set GITHUB_TOKEN (a fine-grained PAT
// with public read) for this to return data; without it the call 401s and we
// degrade to a not-found result. Server-only.
export const searchGithubExposure = createServerFn({ method: "POST" })
  .inputValidator(z.object({ email: z.string() }))
  .handler(async ({ data }): Promise<GithubExposureResult> => {
    if (!data.email.trim()) return { found: false, count: 0, repos: [] };

    try {
      const headers: Record<string, string> = {
        Accept: "application/vnd.github+json",
        "User-Agent": "Priva-App",
      };
      if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

      const res = await fetch(
        `https://api.github.com/search/code?q=${encodeURIComponent(`"${data.email}"`)}`,
        { headers },
      );
      if (!res.ok) return { found: false, count: 0, repos: [] };

      const json = (await res.json()) as {
        total_count?: number;
        items?: Array<{ repository?: { full_name?: string }; path?: string; html_url?: string }>;
      };
      const total = json.total_count ?? 0;
      const items = Array.isArray(json.items) ? json.items : [];
      return {
        found: total > 0,
        count: total,
        repos: items.slice(0, 3).map((it) => ({
          repo: it.repository?.full_name ?? "",
          path: it.path ?? "",
          url: it.html_url ?? "",
        })),
      };
    } catch {
      return { found: false, count: 0, repos: [] };
    }
  });
