import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseAdmin } from "../supabase.server";

// Mark a user as paid (called from the magic-link callback / post-payment).
export const markUserPaid = createServerFn({ method: "POST" })
  .inputValidator(z.object({ email: z.string().email(), plan: z.string().optional() }))
  .handler(async ({ data }): Promise<{ ok: boolean; plan: string; reason?: string }> => {
    const admin = getSupabaseAdmin();
    const plan = data.plan || "essencial";
    if (!admin) return { ok: false, plan, reason: "not_configured" };

    const { error } = await admin
      .from("users")
      .update({ is_paid: true, plan, updated_at: new Date().toISOString() })
      .eq("email", data.email);

    if (error) return { ok: false, plan, reason: error.message };
    return { ok: true, plan };
  });

// Returning-user lookup: is this e-mail a paid account, and on which plan?
export const getUserPlan = createServerFn({ method: "POST" })
  .inputValidator(z.object({ email: z.string().email() }))
  .handler(async ({ data }): Promise<{ found: boolean; isPaid: boolean; plan: string }> => {
    const admin = getSupabaseAdmin();
    if (!admin) return { found: false, isPaid: false, plan: "free" };

    const { data: row, error } = await admin
      .from("users")
      .select("plan, is_paid")
      .eq("email", data.email)
      .maybeSingle();

    if (error || !row) return { found: false, isPaid: false, plan: "free" };
    return { found: true, isPaid: Boolean(row.is_paid), plan: String(row.plan ?? "free") };
  });
