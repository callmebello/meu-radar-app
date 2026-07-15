import { useEffect, useRef, useState } from "react";
import { CircleCheck, Loader2, Clock, Mail, ArrowRight } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { confirmPreapproval } from "@/lib/api/confirmPayment.functions";
import { confirmStripeSession } from "@/lib/api/stripeCheckout.functions";
import { generateRelatorioPdf } from "@/lib/api/generateRelatorio.functions";
import { signInWithEmail } from "@/lib/auth";
import { LgpdAuthorization } from "@/components/LgpdAuthorization";
import { ProtecaoTotalFlow } from "@/components/ProtecaoTotalFlow";
import { track, gaEvent } from "@/lib/analytics";

type Phase = "idle" | "activating" | "account" | "protecaoflow" | "lgpd" | "done";
const MIN_ACTIVATING_MS = 2400;

/**
 * Handles the payment return (?payment=success&session_id=... from Stripe, or
 * &preapproval_id=... from the dormant Mercado Pago flow).
 *  1. Shows a branded "Ativando sua proteção..." screen (≥2.4s) while it
 *     confirms the paid plan server-side (Stripe session / MP preapproval).
 *  2. Routes by plan:
 *     - Essencial  → unlock dashboard (PDF download lives on the dashboard).
 *     - Proteção   → LGPD authorization → "Solicitação enviada" final screen.
 *  3. Cleans the URL so a reload doesn't reprocess.
 * Renders nothing when there's no payment return → normal scan flow is untouched.
 */
export function PaymentReturn() {
  const { setIsPremium, openCapture } = useApp();
  // openCapture is registered by index AFTER first render — keep a live ref so
  // the (once-only) effect below always calls the current one, not the no-op.
  const openCaptureRef = useRef(openCapture);
  openCaptureRef.current = openCapture;
  const [phase, setPhase] = useState<Phase>("idle");
  const [plan, setPlan] = useState("essencial");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [linkSent, setLinkSent] = useState(false);
  const ran = useRef(false);

  // After the account step, route by plan: Proteção Total → LGPD authorization;
  // Essencial → generate/e-mail the report (or ask for a CPF if none on file yet).
  const finishAfterAccount = (resolvedPlan: string) => {
    if (resolvedPlan === "protecao_total") {
      // Already authorized (re-visit) → just show the dashboard; otherwise run
      // the full Proteção Total onboarding flow.
      setPhase(localStorage.getItem("priva_lgpd_authorized") === "true" ? "idle" : "protecaoflow");
    } else {
      const uid = localStorage.getItem("priva_user_id");
      const canReport = Boolean(uid) && Boolean(localStorage.getItem("priva_scan_result"));
      if (canReport && localStorage.getItem("priva_relatorio_emailed") !== "true") {
        localStorage.setItem("priva_relatorio_emailed", "true");
        void generateRelatorioPdf({ data: { userId: uid as string, deliverEmail: true } }).catch(() => {});
      }
      setPhase("idle");
      if (!canReport) openCaptureRef.current("postpay");
    }
  };
  // Live ref so the once-only effect always calls the current closure.
  const finishAfterAccountRef = useRef(finishAfterAccount);
  finishAfterAccountRef.current = finishAfterAccount;

  // Send the magic-link login so the buyer can access their account on any device.
  const sendAccessLink = async () => {
    if (!email || busy) return;
    setBusy(true);
    const { error } = await signInWithEmail(email);
    setBusy(false);
    if (!error) setLinkSent(true);
  };

  // Continue into the app; mark the account as handled so we don't prompt again.
  const continueFromAccount = () => {
    try {
      localStorage.setItem("priva_has_account", "true");
    } catch {
      /* ignore */
    }
    finishAfterAccount(plan);
  };

  useEffect(() => {
    if (typeof window === "undefined" || ran.current) return;
    const params = new URLSearchParams(window.location.search);
    const status = params.get("payment");
    const paidNow = status === "success" || status === "approved" || status === "1";
    if (!paidNow) return;
    ran.current = true;

    const sessionId = params.get("session_id") || "";
    const preapprovalId =
      params.get("preapproval_id") || params.get("preapproval_plan_id") || params.get("id") || "";

    // Clean the URL immediately so a reload can't reprocess the payment.
    try {
      const url = new URL(window.location.href);
      [
        "payment", "session_id", "preapproval_id", "preapproval_plan_id", "id", "status",
        "collection_status", "collection_id", "payment_id", "payment_type",
        "external_reference", "preference_id", "merchant_order_id", "site_id",
        "processing_mode", "merchant_account_id",
      ].forEach((k) => url.searchParams.delete(k));
      window.history.replaceState({}, "", url.pathname + url.search + url.hash);
    } catch {
      /* ignore */
    }

    setPhase("activating");
    const startedAt = Date.now();

    (async () => {
      // Best guess from the checkout we remembered; refined by the gateway.
      let resolvedPlan = (typeof localStorage !== "undefined" && localStorage.getItem("priva_plan")) || "essencial";
      let resolvedEmail = sessionStorage.getItem("priva_email") || "";
      let resolvedUserId = localStorage.getItem("priva_user_id");
      let resolvedAmount: number | undefined;

      try {
        if (sessionId) {
          // Stripe Checkout return — verifies payment + flips is_paid server-side.
          const res = await confirmStripeSession({ data: { sessionId } });
          if (res.ok) {
            if (res.plan) resolvedPlan = res.plan;
            if (res.email) resolvedEmail = res.email;
            if (res.userId) resolvedUserId = res.userId;
            if (typeof res.amount === "number") resolvedAmount = res.amount;
          }
        } else if (preapprovalId) {
          // Dormant Mercado Pago return (kept until Stripe is fully validated).
          const res = await confirmPreapproval({ data: { preapprovalId } });
          if (res.ok) {
            if (res.plan) resolvedPlan = res.plan;
            if (res.email) resolvedEmail = res.email;
            if (res.userId) resolvedUserId = res.userId;
            if (typeof res.amount === "number") resolvedAmount = res.amount;
          }
        }
      } catch {
        /* fall back to the remembered plan */
      }

      // Conversion tracking — fire ONCE with real data, mirrored on Pixel + GA4.
      const purchaseValue = resolvedAmount ?? (resolvedPlan === "protecao_total" ? 24.9 : 9.9);
      const txId = sessionId || preapprovalId || undefined;
      track("Purchase", { value: purchaseValue, currency: "BRL", content_name: resolvedPlan });
      gaEvent("purchase", {
        transaction_id: txId,
        value: purchaseValue,
        currency: "BRL",
        items: [{ item_name: resolvedPlan }],
      });

      try {
        localStorage.setItem("priva_is_paid", "true");
        localStorage.setItem("priva_plan", resolvedPlan);
        if (resolvedUserId) localStorage.setItem("priva_user_id", resolvedUserId);
        if (resolvedEmail) sessionStorage.setItem("priva_email", resolvedEmail);
      } catch {
        /* ignore */
      }
      setIsPremium(true);
      setPlan(resolvedPlan);
      setEmail(resolvedEmail);
      setUserId(resolvedUserId);

      // Keep the branded screen up for a minimum beat.
      const wait = Math.max(0, MIN_ACTIVATING_MS - (Date.now() - startedAt));
      window.setTimeout(() => {
        // Web launch: a purchase must leave the buyer with a real account they can
        // log back into on any device (localStorage alone dies on another browser).
        // Show the account step once, unless they already secured an account.
        const hasAccount = localStorage.getItem("priva_has_account") === "true";
        // Proteção Total goes straight into its onboarding flow (welcome →
        // authorization); the account/login prompt is only for Essencial.
        if (resolvedPlan !== "protecao_total" && !hasAccount) {
          setPhase("account");
        } else {
          finishAfterAccountRef.current(resolvedPlan);
        }
      }, wait);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === "idle") return null;

  // Proteção Total onboarding (welcome → confirm → collect → authorize → timeline)
  if (phase === "protecaoflow") {
    return (
      <ProtecaoTotalFlow
        email={email}
        userId={userId}
        onDone={() => {
          setIsPremium(true);
          if (typeof window !== "undefined") window.location.href = "/";
          else setPhase("idle");
        }}
      />
    );
  }

  // STEP — secure the account (web: buyer needs a login that works on any device)
  if (phase === "account") {
    return (
      <div className="fixed inset-0 z-[60] overflow-y-auto" style={{ backgroundColor: "#0A0A0F" }}>
        <div className="mx-auto flex min-h-full max-w-sm flex-col justify-center px-6 pb-10">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-green-500/15">
            <CircleCheck className="h-12 w-12 text-green-400" />
          </div>
          <h1 className="mt-5 text-center text-2xl font-extrabold text-white">Proteção ativada!</h1>
          <p className="mt-2 text-center text-sm text-gray-400">
            Sua conta é o seu e-mail. Enviamos um link de acesso para você entrar em qualquer aparelho.
          </p>

          <div className="mt-7 rounded-2xl p-5" style={{ backgroundColor: "#12121A", border: "1px solid rgba(255,255,255,0.05)" }}>
            <p className="mb-1 text-xs text-gray-400">Seu e-mail de acesso</p>
            <div className="mb-4 flex items-center gap-2 rounded-lg px-3 py-2.5" style={{ backgroundColor: "#1a1a2e" }}>
              <Mail className="h-4 w-4 shrink-0 text-indigo-400" />
              <span className="truncate text-sm font-medium text-white">{email || "—"}</span>
            </div>

            {linkSent ? (
              <p className="rounded-xl bg-green-500/10 px-3 py-3 text-center text-sm text-green-400">
                Link de acesso enviado para {email} ✓<br />
                <span className="text-xs text-green-400/70">Confira sua caixa de entrada (e o spam).</span>
              </p>
            ) : (
              <button
                onClick={sendAccessLink}
                disabled={busy || !email}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-4 font-bold text-white transition-all active:scale-[0.99] disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mail className="h-5 w-5" />}
                {busy ? "Enviando..." : "Enviar link de acesso"}
              </button>
            )}

            <button
              onClick={continueFromAccount}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 py-3.5 text-sm font-semibold text-white transition-all active:scale-[0.99]"
            >
              Continuar para o painel <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-4 text-center text-[11px] leading-snug text-gray-600">
            Guarde o e-mail acima — é com ele que você entra na sua conta em outro celular ou computador.
          </p>
        </div>
      </div>
    );
  }

  // STEP — LGPD authorization (Proteção Total only)
  if (phase === "lgpd") {
    return (
      <LgpdAuthorization
        email={email}
        userId={userId}
        onDone={() => {
          try {
            localStorage.setItem("priva_lgpd_requested_at", new Date().toISOString());
          } catch {
            /* ignore */
          }
          setPhase("done");
        }}
      />
    );
  }

  // STEP — final confirmation (Proteção Total) — no downloads offered
  if (phase === "done") {
    return (
      <div className="fixed inset-0 z-[60] overflow-y-auto" style={{ backgroundColor: "#0A0A0F" }}>
        <div className="mx-auto flex min-h-full max-w-sm flex-col items-center justify-center px-6 pb-10 text-center">
          <div className="grid h-20 w-20 place-items-center rounded-full bg-green-500/15">
            <CircleCheck className="h-12 w-12 text-green-400" />
          </div>
          <h1 className="mt-5 text-2xl font-extrabold text-white">Solicitação enviada</h1>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-gray-400">
            Nossa equipe está processando seu pedido de remoção. Você será notificado quando houver atualização.
          </p>
          <button
            onClick={() => {
              // Reload so the dashboard re-reads the fresh removal-status state
              // (URL is already cleaned, so this won't reprocess the payment).
              if (typeof window !== "undefined") window.location.reload();
              else setPhase("idle");
            }}
            className="mt-8 w-full max-w-xs rounded-2xl py-4 text-base font-bold text-white transition-all active:scale-[0.99]"
            style={{ background: "linear-gradient(135deg,#4F46E5,#6366F1)", boxShadow: "0 8px 28px rgba(79,70,229,0.4)" }}
          >
            Ir para o painel
          </button>
        </div>
      </div>
    );
  }

  // STEP — "Ativando sua proteção..." (branded)
  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center px-6 text-center" style={{ backgroundColor: "#0A0A0F" }}>
      <img src="/PRIVA_logo_dark_theme.png" alt="PRIVA" className="h-7 w-auto object-contain" />
      <div className="mt-10 grid h-16 w-16 place-items-center rounded-2xl" style={{ backgroundColor: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)" }}>
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
      <h1 className="mt-6 text-xl font-extrabold text-white">Ativando sua proteção...</h1>
      <p className="mt-2 flex items-center gap-1.5 text-sm text-gray-400">
        <Clock className="h-3.5 w-3.5" /> Confirmando seu pagamento
      </p>
    </div>
  );
}
