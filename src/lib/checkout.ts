import { createCheckoutSession } from "@/lib/api/stripeCheckout.functions";
import { track, gaEvent } from "@/lib/analytics";

export type CheckoutPlan = "essencial" | "protecao_total";

export const PLAN_PRICE: Record<CheckoutPlan, number> = { essencial: 9.9, protecao_total: 24.9 };

// Starts a Stripe Checkout for the given plan: remembers the plan (so the
// ?payment=success return knows what was bought even before the API confirms),
// creates the session server-side and redirects. Returns false when checkout
// couldn't start (e.g. Stripe not configured in dev) so callers can fall back.
//
// Conversion tracking is centralized HERE so every entry point fires exactly one
// InitiateCheckout (Pixel) + begin_checkout (GA4) with consistent data.
export async function startCheckout(plan: CheckoutPlan): Promise<boolean> {
  const value = PLAN_PRICE[plan];
  track("InitiateCheckout", { value, currency: "BRL", content_name: plan });
  gaEvent("begin_checkout", { currency: "BRL", value, items: [{ item_name: plan }] });

  let email = "";
  try {
    localStorage.setItem("priva_plan", plan);
    email = sessionStorage.getItem("priva_email") || "";
  } catch {
    /* ignore */
  }
  try {
    const res = await createCheckoutSession({
      data: { plan, email: email || undefined, origin: window.location.origin },
    });
    if (res.ok && res.url) {
      window.location.href = res.url;
      return true;
    }
  } catch {
    /* fall through */
  }
  return false;
}
