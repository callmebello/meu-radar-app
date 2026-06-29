import { useEffect, useRef, useState } from "react";
import { CircleCheck, Loader2, Clock } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { confirmPreapproval } from "@/lib/api/confirmPayment.functions";
import { generateRelatorioPdf } from "@/lib/api/generateRelatorio.functions";
import { LgpdAuthorization } from "@/components/LgpdAuthorization";
import { track } from "@/lib/analytics";

type Phase = "idle" | "activating" | "lgpd" | "done";
const MIN_ACTIVATING_MS = 2400;

/**
 * Handles the Mercado Pago return (?payment=success[&preapproval_id=...]).
 *  1. Shows a branded "Ativando sua proteção..." screen (≥2.4s) while it
 *     confirms the plan via GET /preapproval/{id} (server, token-by-mode).
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
  const ran = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || ran.current) return;
    const params = new URLSearchParams(window.location.search);
    const status = params.get("payment");
    const paidNow = status === "success" || status === "approved" || status === "1";
    if (!paidNow) return;
    ran.current = true;

    const preapprovalId =
      params.get("preapproval_id") || params.get("preapproval_plan_id") || params.get("id") || "";

    // Clean the URL immediately so a reload can't reprocess the payment.
    try {
      const url = new URL(window.location.href);
      [
        "payment", "preapproval_id", "preapproval_plan_id", "id", "status",
        "collection_status", "collection_id", "payment_id", "payment_type",
        "external_reference", "preference_id", "merchant_order_id", "site_id",
        "processing_mode", "merchant_account_id",
      ].forEach((k) => url.searchParams.delete(k));
      window.history.replaceState({}, "", url.pathname + url.search + url.hash);
    } catch {
      /* ignore */
    }

    setPhase("activating");
    track("Purchase");
    const startedAt = Date.now();

    (async () => {
      // Best guess from the checkout we remembered; refined by MP if reachable.
      let resolvedPlan = (typeof localStorage !== "undefined" && localStorage.getItem("priva_plan")) || "essencial";
      let resolvedEmail = sessionStorage.getItem("priva_email") || "";
      let resolvedUserId = localStorage.getItem("priva_user_id");

      if (preapprovalId) {
        try {
          const res = await confirmPreapproval({ data: { preapprovalId } });
          if (res.ok) {
            if (res.plan) resolvedPlan = res.plan;
            if (res.email) resolvedEmail = res.email;
            if (res.userId) resolvedUserId = res.userId;
          }
        } catch {
          /* fall back to the remembered plan */
        }
      }

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
        if (resolvedPlan === "protecao_total") {
          // Proteção Total → LGPD authorization (skip if already authorized).
          setPhase(localStorage.getItem("priva_lgpd_authorized") === "true" ? "done" : "lgpd");
        } else {
          // Essencial. We can generate the report only when there's a persisted
          // scan (user_id) + scan data. Otherwise (cross-origin / paid without
          // scanning) ask for the CPF to scan + persist now.
          const uid = localStorage.getItem("priva_user_id");
          const canReport = Boolean(uid) && Boolean(localStorage.getItem("priva_scan_result"));
          if (canReport && localStorage.getItem("priva_relatorio_emailed") !== "true") {
            localStorage.setItem("priva_relatorio_emailed", "true");
            void generateRelatorioPdf({ data: { userId: uid as string, deliverEmail: true } }).catch(() => {});
          }
          setPhase("idle");
          if (!canReport) openCaptureRef.current("postpay");
        }
      }, wait);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase === "idle") return null;

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
