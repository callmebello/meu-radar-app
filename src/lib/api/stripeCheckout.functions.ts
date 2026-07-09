import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseAdmin } from "../supabase.server";

// Stripe Checkout (hosted, mode: subscription). createCheckoutSession replaces
// the static Mercado Pago links: the client asks for a session and redirects to
// session.url. confirmStripeSession is the ?payment=success&session_id=... leg —
// it verifies the session is actually paid and flips users.is_paid (same shape
// as confirmPreapproval so PaymentReturn treats both alike).

const FALLBACK_ORIGIN = "https://www.privaapp.com.br";

// success/cancel URLs must return to the SAME origin the user is on (localhost,
// preview or prod). The client can't be trusted blindly — allow only known hosts.
function safeOrigin(requested?: string): string {
  if (!requested) return FALLBACK_ORIGIN;
  try {
    const u = new URL(requested);
    const ok =
      u.hostname === "localhost" ||
      u.hostname === "127.0.0.1" ||
      u.hostname === "privaapp.com.br" ||
      u.hostname.endsWith(".privaapp.com.br") ||
      u.hostname.endsWith(".vercel.app");
    return ok ? u.origin : FALLBACK_ORIGIN;
  } catch {
    return FALLBACK_ORIGIN;
  }
}

export const createCheckoutSession = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      plan: z.enum(["essencial", "protecao_total"]),
      email: z.string().email().optional(),
      origin: z.string().optional(),
    }),
  )
  .handler(async ({ data }): Promise<{ ok: boolean; url?: string; reason?: string }> => {
    const { getStripe, priceForPlan } = await import("./stripe.server");
    const stripe = getStripe();
    if (!stripe) return { ok: false, reason: "not_configured" };
    const price = priceForPlan(data.plan);
    if (!price) return { ok: false, reason: "price_not_configured" };

    const origin = safeOrigin(data.origin);
    try {
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        // Don't hardcode payment_method_types — let Stripe use the methods enabled
        // in the Dashboard that are valid for subscriptions (card, boleto, PicPay,
        // Apple Pay…). Forcing "pix" here breaks the whole session because PIX
        // isn't supported for recurring subscriptions.
        line_items: [{ price, quantity: 1 }],
        customer_email: data.email || undefined,
        metadata: { plan: data.plan },
        subscription_data: { metadata: { plan: data.plan } },
        success_url: `${origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/?payment=cancelled`,
        locale: "pt-BR",
      });
      return { ok: true, url: session.url ?? undefined };
    } catch (e) {
      return { ok: false, reason: e instanceof Error ? e.message : "create_failed" };
    }
  });

export const confirmStripeSession = createServerFn({ method: "POST" })
  .inputValidator(z.object({ sessionId: z.string() }))
  .handler(
    async ({
      data,
    }): Promise<{ ok: boolean; plan?: string; email?: string; amount?: number; userId?: string | null; reason?: string }> => {
      const { resolveCheckoutSession } = await import("./stripe.server");
      const resolved = await resolveCheckoutSession(data.sessionId);
      if (!resolved) return { ok: false, reason: "not_found" };
      if (!resolved.paid) return { ok: false, plan: resolved.plan, email: resolved.email, reason: "not_paid" };

      let userId: string | null = null;
      const admin = getSupabaseAdmin();
      if (admin && resolved.email) {
        try {
          const { markPaid } = await import("./mercadopago.server");
          userId = await markPaid(admin, {
            email: resolved.email,
            plan: resolved.plan,
            amount: resolved.amount,
            mpId: resolved.subscriptionId || data.sessionId,
          });
        } catch {
          /* best-effort — UI still unlocks client-side */
        }
      }

      return { ok: true, plan: resolved.plan, email: resolved.email, amount: resolved.amount, userId };
    },
  );
