import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import process from "node:process";

// Server route equivalent of a Next.js app/api/hibp/route.ts.
// In TanStack Start this is a createServerFn — the .handler runs server-only,
// so HIBP_API_KEY (read via process.env per-request) never reaches the client.
// Call from the client:  await checkHibp({ data: { email } })

export type HibpBreach = {
  [k: string]: string | number | boolean | string[] | null;
};
export type HibpResult = { count: number; breaches: HibpBreach[] };

export const checkHibp = createServerFn({ method: "POST" })
  .inputValidator(z.object({ email: z.string() }))
  .handler(async ({ data }): Promise<HibpResult> => {
    const email = data.email?.trim();
    if (!email) return { count: 0, breaches: [] };

    try {
      const res = await fetch(
        `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`,
        {
          headers: {
            "hibp-api-key": process.env.HIBP_API_KEY ?? "",
            "user-agent": "Priva-App",
          },
        },
      );
      // 404 = no breaches found for this account
      if (res.status === 404) return { count: 0, breaches: [] };
      if (!res.ok) return { count: 0, breaches: [] };

      const breaches = (await res.json()) as HibpBreach[];
      return { count: Array.isArray(breaches) ? breaches.length : 0, breaches };
    } catch {
      return { count: 0, breaches: [] };
    }
  });
