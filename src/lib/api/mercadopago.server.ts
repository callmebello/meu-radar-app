// Shared Mercado Pago enrichment — SERVER ONLY. Used by BOTH the post-payment
// return flow (confirmPreapproval) and the webhook draft, so the logic lives in
// one place. The notification/return only gives us an id; we fetch the resource
// from MP to get payer e-mail + amount + status, then flip users.is_paid.
import process from "node:process";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ResolvedSub = { email: string; amount: number; status: string; plan: string };

// Tokens to try for a known mode (webhook has live_mode). MP marks test
// resources with live_mode=false. Falls back to the other token.
export function tokensForMode(liveMode: boolean | undefined): string[] {
  const prod = process.env.MP_ACCESS_TOKEN;
  const test = process.env.MP_ACCESS_TOKEN_TEST;
  const isTest = liveMode === false;
  const primary = isTest ? test : prod;
  const secondary = isTest ? prod : test;
  return [primary, secondary].filter((t): t is string => Boolean(t));
}

// When mode is unknown (return flow only has an id), try both — prod first, then
// test. The id resolves under whichever token owns it.
export function allTokens(): string[] {
  return [process.env.MP_ACCESS_TOKEN, process.env.MP_ACCESS_TOKEN_TEST].filter(
    (t): t is string => Boolean(t),
  );
}

export async function mpGet<T>(path: string, tokens: string[]): Promise<T | null> {
  for (const token of tokens) {
    try {
      const res = await fetch(`https://api.mercadopago.com${path}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) return (await res.json()) as T;
      if (![401, 403, 404].includes(res.status)) return null; // real error → stop
    } catch {
      /* try next token */
    }
  }
  return null;
}

export function planFromAmount(amount: number): string {
  return amount >= 29 ? "protecao_total" : "essencial";
}

export function isActiveStatus(status: string): boolean {
  return ["authorized", "approved", "active", "accredited"].includes(status.toLowerCase());
}

export async function resolvePreapproval(id: string, tokens: string[]): Promise<ResolvedSub | null> {
  const s = await mpGet<{
    payer_email?: string;
    status?: string;
    auto_recurring?: { transaction_amount?: number };
  }>(`/preapproval/${id}`, tokens);
  if (!s) return null;
  const amount = Number(s.auto_recurring?.transaction_amount ?? 0);
  return { email: s.payer_email ?? "", amount, status: s.status ?? "", plan: planFromAmount(amount) };
}

export async function resolvePayment(id: string, tokens: string[]): Promise<ResolvedSub | null> {
  const p = await mpGet<{
    payer?: { email?: string };
    transaction_amount?: number;
    status?: string;
  }>(`/v1/payments/${id}`, tokens);
  if (!p) return null;
  const amount = Number(p.transaction_amount ?? 0);
  return { email: p.payer?.email ?? "", amount, status: p.status ?? "", plan: planFromAmount(amount) };
}

// Recurring renewals arrive as subscription_authorized_payment.
export async function resolveAuthorizedPayment(id: string, tokens: string[]): Promise<ResolvedSub | null> {
  const ap = await mpGet<{
    status?: string;
    transaction_amount?: number;
    preapproval_id?: string;
    payment?: { transaction_amount?: number; status?: string };
  }>(`/authorized_payments/${id}`, tokens);
  if (!ap) return null;
  const amount = Number(ap.transaction_amount ?? ap.payment?.transaction_amount ?? 0);
  const status = ap.status ?? ap.payment?.status ?? "";
  let email = "";
  if (ap.preapproval_id) email = (await resolvePreapproval(ap.preapproval_id, tokens))?.email ?? "";
  return { email, amount, status, plan: planFromAmount(amount) };
}

// Upsert the user as paid (create the row if a scan never ran) + log the
// subscription. Returns the user id for downstream use (LGPD, PDFs).
export async function markPaid(
  admin: SupabaseClient,
  r: { email: string; plan: string; amount: number; mpId: string },
): Promise<string | null> {
  if (!r.email) return null;
  const { data } = await admin
    .from("users")
    .upsert(
      { email: r.email, plan: r.plan, is_paid: true, updated_at: new Date().toISOString() },
      { onConflict: "email" },
    )
    .select("id")
    .maybeSingle();
  await admin.from("subscriptions").insert({
    plan: r.plan,
    status: "active",
    mp_subscription_id: r.mpId,
    amount: r.amount,
  });
  return (data?.id as string) ?? null;
}
