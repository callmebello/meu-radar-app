import { getSupabaseAdmin } from "../supabase.server";

// Mercado Pago webhook handler. Registered at POST /api/webhook/mercadopago
// (wired in src/server.ts). On a payment / subscription event it marks the user
// paid and records the subscription. Always returns 200 so MP stops retrying.
export async function handleMercadoPagoWebhook(request: Request): Promise<Response> {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, any>;

    if (body.type === "payment" || body.type === "subscription_preapproval") {
      const email: string | undefined = body?.data?.payer?.email || body?.payer_email;
      const amount: number = Number(body?.transaction_amount ?? 0);

      if (email) {
        const admin = getSupabaseAdmin();
        if (admin) {
          const plan = amount >= 29 ? "protecao_total" : "essencial";

          await admin
            .from("users")
            .update({ plan, is_paid: true, updated_at: new Date().toISOString() })
            .eq("email", email);

          await admin.from("subscriptions").insert({
            plan,
            status: "active",
            mp_subscription_id: body?.data?.id ?? null,
            amount,
          });
        }
      }
    }
  } catch (e) {
    console.error("MP webhook error", e);
  }

  return new Response("OK", { status: 200 });
}
