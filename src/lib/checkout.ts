import { createCheckoutSession } from "@/lib/api/stripeCheckout.functions";

export type CheckoutPlan = "essencial" | "protecao_total";

// Starts a Stripe Checkout for the given plan: remembers the plan (so the
// ?payment=success return knows what was bought even before the API confirms),
// creates the session server-side and redirects. Returns false when checkout
// couldn't start (e.g. Stripe not configured in dev) so callers can fall back.
export async function startCheckout(plan: CheckoutPlan): Promise<boolean> {
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
