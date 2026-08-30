import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseAdmin } from "../supabase.server";

/**
 * Persists the pre-scan quiz answers against the lead's e-mail.
 *
 * These answers are the only first-party statement of intent we get — what the
 * person fears, which data they believe is exposed, how long they have gone
 * without checking. Tied to the e-mail, they turn a flat list into segmented
 * campaigns ("said passwords are exposed", "never checked before").
 *
 * Deliberately its own table and fully best-effort: if `quiz_answers` doesn't
 * exist yet, this fails quietly and the scan is unaffected. Nothing here can
 * break the funnel.
 */
export const saveQuizAnswers = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      email: z.string().email(),
      q1: z.string().max(120).optional(),
      q2: z.array(z.string().max(60)).max(10).optional(),
      q3: z.string().max(120).optional(),
    }),
  )
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const admin = getSupabaseAdmin();
    if (!admin) return { ok: false };

    try {
      const { error } = await admin.from("quiz_answers").upsert(
        {
          email: data.email,
          q1: data.q1 ?? null,
          q2: data.q2 ?? [],
          q3: data.q3 ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "email" },
      );
      return { ok: !error };
    } catch {
      return { ok: false };
    }
  });
