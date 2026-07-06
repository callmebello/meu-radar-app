// Mercado Pago webhook handler. Registered at POST /api/webhook/mercadopago
// (wired in src/server.ts). MP notifications are thin ({ type, data:{ id } }), so
// we fetch the resource from MP (GET /preapproval | /payments | /authorized_payments
// with the token for the notification's mode) and only then flip users.is_paid.
// Always returns 200 so MP stops retrying. The enrichment logic lives in
// mercadopago.server.ts and is shared with the post-payment return flow.
//
// ENV (server-only, no VITE_ prefix):
//   - Production (Vercel):  MP_ACCESS_TOKEN       = <Access Token de PRODUÇÃO>
//   - Sandbox/test:         MP_ACCESS_TOKEN_TEST  = APP_USR/TEST-...
//   Without a token the enrichment is skipped (degrades to 200, no crash).
//
// TODO (hardening): validate the `x-signature` header with the webhook secret
// before trusting the notification, to prevent spoofed is_paid flips.
import { getSupabaseAdmin } from "../supabase.server";
import {
  tokensForMode,
  resolvePreapproval,
  resolvePayment,
  resolveAuthorizedPayment,
  isActiveStatus,
  markPaid,
  type ResolvedSub,
} from "./mercadopago.server";

type MPNotification = {
  type?: string;
  topic?: string;
  action?: string;
  live_mode?: boolean;
  data?: { id?: string };
  id?: string | number;
};

export async function handleMercadoPagoWebhook(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const body = (await request.json().catch(() => ({}))) as MPNotification;

    const type =
      body.type ||
      body.topic ||
      url.searchParams.get("type") ||
      url.searchParams.get("topic") ||
      "";
    const id =
      body.data?.id ||
      (typeof body.id !== "undefined" ? String(body.id) : "") ||
      url.searchParams.get("data.id") ||
      url.searchParams.get("id") ||
      "";

    if (!id) return new Response("OK", { status: 200 });

    const tokens = tokensForMode(body.live_mode);
    if (tokens.length === 0) {
      console.warn("MP webhook: nenhum MP_ACCESS_TOKEN(_TEST) configurado — enriquecimento pulado");
      return new Response("OK", { status: 200 });
    }

    let resolved: ResolvedSub | null = null;
    if (type.includes("authorized_payment")) {
      resolved = await resolveAuthorizedPayment(String(id), tokens);
    } else if (type.includes("subscription") || type.includes("preapproval")) {
      resolved = await resolvePreapproval(String(id), tokens);
    } else if (type.includes("payment")) {
      resolved = await resolvePayment(String(id), tokens);
    }

    if (resolved?.email && isActiveStatus(resolved.status)) {
      const admin = getSupabaseAdmin();
      if (admin) {
        await markPaid(admin, {
          email: resolved.email,
          plan: resolved.plan,
          amount: resolved.amount,
          mpId: String(id),
        });
      }
    }
  } catch (e) {
    console.error("MP webhook error", e);
  }

  return new Response("OK", { status: 200 });
}
