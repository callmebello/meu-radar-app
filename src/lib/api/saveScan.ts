import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseAdmin } from "../supabase.server";

// Caches a scan result for a user (one per user — upsert on user_id).
export const saveScan = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      userId: z.string().nullable().optional(),
      cpfHash: z.string(),
      email: z.string().optional(),
      result: z.any(),
      breachCount: z.number().default(0),
    }),
  )
  .handler(async ({ data }): Promise<{ ok: boolean; reason?: string }> => {
    const admin = getSupabaseAdmin();
    if (!admin) return { ok: false, reason: "not_configured" };
    if (!data.userId) return { ok: false, reason: "no_user" };

    const riskLevel = data.breachCount >= 4 ? "ALTO" : data.breachCount >= 2 ? "MÉDIO" : "BAIXO";

    const { error } = await admin.from("scans").upsert(
      {
        user_id: data.userId,
        cpf_hash: data.cpfHash,
        email: data.email ?? null,
        result: data.result,
        breach_count: data.breachCount,
        risk_level: riskLevel,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      { onConflict: "user_id" },
    );

    return { ok: !error, reason: error?.message };
  });
