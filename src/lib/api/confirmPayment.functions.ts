import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseAdmin } from "../supabase.server";

// Post-payment return confirmation. Given the preapproval_id from the MP
// back_url (?payment=success&preapproval_id=...), fetch the subscription from MP
// (token-by-mode, shared with the webhook), determine the plan, and flip
// users.is_paid. Returns enough for the UI to route path A (Essencial) vs path B
// (Proteção Total). All heavy deps dynamically imported (server-only chain).
export const confirmPreapproval = createServerFn({ method: "POST" })
  .inputValidator(z.object({ preapprovalId: z.string() }))
  .handler(
    async ({
      data,
    }): Promise<{
      ok: boolean;
      plan?: string;
      email?: string;
      amount?: number;
      status?: string;
      userId?: string | null;
      reason?: string;
    }> => {
      const { allTokens, resolvePreapproval, isActiveStatus, markPaid } =
        await import("./mercadopago.server");

      const tokens = allTokens();
      if (tokens.length === 0) return { ok: false, reason: "no_token" };

      const resolved = await resolvePreapproval(data.preapprovalId, tokens);
      if (!resolved) return { ok: false, reason: "not_found" };
      if (!isActiveStatus(resolved.status)) {
        return {
          ok: false,
          plan: resolved.plan,
          email: resolved.email,
          status: resolved.status,
          reason: "not_active",
        };
      }

      const admin = getSupabaseAdmin();
      let userId: string | null = null;
      if (admin && resolved.email) {
        try {
          userId = await markPaid(admin, {
            email: resolved.email,
            plan: resolved.plan,
            amount: resolved.amount,
            mpId: data.preapprovalId,
          });
        } catch {
          /* best-effort — UI still unlocks client-side */
        }
      }

      return {
        ok: true,
        plan: resolved.plan,
        email: resolved.email,
        amount: resolved.amount,
        status: resolved.status,
        userId,
      };
    },
  );
