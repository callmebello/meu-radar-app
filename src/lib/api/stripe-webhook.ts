// Stripe webhook handler. Registered at POST /api/webhook/stripe (wired in
// src/server.ts). Signature-verified with STRIPE_WEBHOOK_SECRET — unverified
// requests are rejected, so nobody can spoof an is_paid flip (an upgrade over
// the old MP webhook). Marks users paid even if the buyer closes the tab before
// returning to the app; renewals (invoice.paid) keep the subscription active.
//
// ENV (server-only): STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
//   Local test:  stripe listen --forward-to localhost:3001/api/webhook/stripe
//   Production:  dashboard endpoint https://www.privaapp.com.br/api/webhook/stripe
//   Events: checkout.session.completed, invoice.paid, customer.subscription.deleted
import process from "node:process";
import type Stripe from "stripe";
import { getSupabaseAdmin } from "../supabase.server";

export async function handleStripeWebhook(request: Request): Promise<Response> {
  const { getStripe, planForPrice, planFromAmountBRL, resolveCheckoutSession } =
    await import("./stripe.server");
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    console.warn(
      "Stripe webhook: STRIPE_SECRET_KEY/STRIPE_WEBHOOK_SECRET ausentes — evento ignorado",
    );
    return new Response("OK", { status: 200 });
  }

  let event: Stripe.Event;
  try {
    const raw = await request.text();
    const sig = request.headers.get("stripe-signature") ?? "";
    event = await stripe.webhooks.constructEventAsync(raw, sig, secret);
  } catch (e) {
    console.error("Stripe webhook: assinatura inválida", e);
    return new Response("invalid signature", { status: 400 });
  }

  try {
    const admin = getSupabaseAdmin();
    if (!admin) return new Response("OK", { status: 200 });
    const { markPaid } = await import("./mercadopago.server");

    switch (event.type) {
      // First payment of a subscription (app checkout AND Payment Link/QR).
      case "checkout.session.completed": {
        const session = event.data.object;
        const resolved = await resolveCheckoutSession(session.id);
        if (resolved?.email && resolved.paid) {
          await markPaid(admin, {
            email: resolved.email,
            plan: resolved.plan,
            amount: resolved.amount,
            mpId: resolved.subscriptionId || session.id,
          });
        }
        break;
      }

      // Renewals — keep the user active month over month.
      case "invoice.paid": {
        const invoice = event.data.object;
        const email = invoice.customer_email ?? "";
        const amount = (invoice.amount_paid ?? 0) / 100;
        const rawPrice = invoice.lines?.data?.[0]?.pricing?.price_details?.price ?? null;
        const priceId = typeof rawPrice === "string" ? rawPrice : (rawPrice?.id ?? null);
        const plan = planForPrice(priceId) ?? planFromAmountBRL(amount);
        if (email && amount > 0) {
          await markPaid(admin, {
            email,
            plan,
            amount,
            mpId: String(invoice.id ?? ""),
          });
        }
        break;
      }

      // Cancellation — downgrade to free.
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
        if (customerId) {
          const customer = await stripe.customers.retrieve(customerId);
          const email = "deleted" in customer && customer.deleted ? "" : (customer.email ?? "");
          if (email) {
            await admin
              .from("users")
              .update({ is_paid: false, plan: "free", updated_at: new Date().toISOString() })
              .eq("email", email);
            await admin
              .from("subscriptions")
              .update({ status: "cancelled" })
              .eq("mp_subscription_id", sub.id);
          }
        }
        break;
      }

      default:
        break; // unhandled event types are fine
    }
  } catch (e) {
    console.error("Stripe webhook error", e);
  }

  return new Response("OK", { status: 200 });
}
