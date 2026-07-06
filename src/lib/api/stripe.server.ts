// Shared Stripe helpers — SERVER ONLY. Used by the checkout server fn, the
// post-payment return confirmation and the webhook, so plan mapping and the
// is_paid flip live in one place. Reuses markPaid (generic Supabase upsert)
// from mercadopago.server while MP stays dormant.
import process from "node:process";
import Stripe from "stripe";

let stripeSingleton: Stripe | null | undefined;

// Returns null when unconfigured so callers can degrade gracefully (same
// pattern as getSupabaseAdmin).
export function getStripe(): Stripe | null {
  if (stripeSingleton !== undefined) return stripeSingleton;
  const key = process.env.STRIPE_SECRET_KEY;
  stripeSingleton = key ? new Stripe(key) : null;
  return stripeSingleton;
}

export type PlanId = "essencial" | "protecao_total";

export function priceForPlan(plan: PlanId): string | undefined {
  return plan === "protecao_total"
    ? process.env.STRIPE_PRICE_PROTECAO
    : process.env.STRIPE_PRICE_ESSENCIAL;
}

export function planForPrice(priceId: string | undefined | null): PlanId | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_PROTECAO) return "protecao_total";
  if (priceId === process.env.STRIPE_PRICE_ESSENCIAL) return "essencial";
  return null;
}

// Amount (in BRL) → plan, as a fallback when the price id is unknown (mirrors
// the MP webhook heuristic: >= R$29 → Proteção Total).
export function planFromAmountBRL(amount: number): PlanId {
  return amount >= 29 ? "protecao_total" : "essencial";
}

export type ResolvedStripeSession = {
  email: string;
  plan: PlanId;
  amount: number; // BRL
  paid: boolean;
  subscriptionId: string;
};

// Retrieve a Checkout Session and normalize what the app needs. Works for both
// server-created sessions and Payment Link sessions (the PDF QR).
export async function resolveCheckoutSession(
  sessionId: string,
): Promise<ResolvedStripeSession | null> {
  const stripe = getStripe();
  if (!stripe) return null;
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items.data.price", "subscription"],
    });
    const email = session.customer_details?.email || session.customer_email || "";
    const amount = (session.amount_total ?? 0) / 100;
    const priceId = session.line_items?.data?.[0]?.price?.id;
    const plan =
      (session.metadata?.plan as PlanId | undefined) ||
      planForPrice(priceId) ||
      planFromAmountBRL(amount);
    const paid = session.payment_status === "paid" || session.status === "complete";
    const sub = session.subscription;
    const subscriptionId = typeof sub === "string" ? sub : (sub?.id ?? "");
    return { email, plan, amount, paid, subscriptionId };
  } catch {
    return null;
  }
}
