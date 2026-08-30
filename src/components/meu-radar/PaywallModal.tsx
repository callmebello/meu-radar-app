import { useState } from "react";
import { Check, Lock, ShieldCheck, Trash2, X } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { PLAN_PRICE, startCheckout, type CheckoutPlan } from "@/lib/checkout";

/**
 * Paywall for locked features.
 *
 * It used to list plans that do not exist (Personal R$19 / Score+ R$29 /
 * Família R$39) and its button called setIsPremium(true) directly — granting
 * full access without any payment. It now mirrors the report exactly: the same
 * two real plans, the same names and prices as PLAN_PRICE, and Stripe as the
 * only way in.
 */
const brl = (v: number) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const PLANS: {
  id: CheckoutPlan;
  name: string;
  tagline: string;
  features: string[];
  highlight?: boolean;
}[] = [
  {
    id: "essencial",
    name: "Priva Essencial",
    tagline: "Você fica sabendo de tudo",
    features: [
      "Relatório completo dos vazamentos",
      "Monitoramento contínuo",
      "Alerta de vazamento novo",
      "Verificação ilimitada de link, Pix e mensagem",
    ],
  },
  {
    id: "protecao_total",
    name: "Priva Protege",
    tagline: "Nossa equipe pede a remoção",
    features: [
      "Tudo do Essencial",
      "Solicitações de remoção feitas pela nossa equipe",
      "Carta LGPD enviada às fontes",
      "Acompanhamento do caso",
    ],
    highlight: true,
  },
];

export function PaywallModal() {
  const { paywallOpen, closePaywall } = useApp();
  const [busy, setBusy] = useState<CheckoutPlan | null>(null);

  if (!paywallOpen) return null;

  const go = async (plan: CheckoutPlan) => {
    setBusy(plan);
    // Access is granted by the Stripe webhook / payment return, never here.
    await startCheckout(plan);
    setBusy(null);
  };

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:px-4"
      onClick={closePaywall}
      role="presentation"
    >
      <div
        className="animate-quiz-fade-up max-h-[92vh] w-full max-w-sm overflow-y-auto rounded-t-3xl bg-card p-6 pb-8 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Assinar a Priva"
      >
        <button
          onClick={closePaywall}
          aria-label="Fechar"
          className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--color-navy)]/10">
            <Lock className="h-5 w-5 text-[var(--color-navy)]" />
          </span>
          <h2 className="mt-3 text-[19px] font-bold text-foreground">Recurso da assinatura</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Escolha como quer resolver sua exposição.
          </p>
        </div>

        <div className="mt-5 space-y-3">
          {PLANS.map((p) => (
            <div
              key={p.id}
              className="rounded-2xl p-4"
              style={
                p.highlight
                  ? { border: "1.5px solid #4F46E5", backgroundColor: "rgba(79,70,229,0.04)" }
                  : { border: "1px solid var(--color-border)" }
              }
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[14.5px] font-bold text-foreground">{p.name}</p>
                  <p className="text-[12px] text-muted-foreground">{p.tagline}</p>
                </div>
                {p.highlight && (
                  <span className="shrink-0 rounded-full bg-[#4F46E5] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                    Recomendado
                  </span>
                )}
              </div>

              <p className="mt-2.5 text-[24px] font-extrabold leading-none text-foreground">
                R$ {brl(PLAN_PRICE[p.id])}
                <span className="text-[13px] font-normal text-muted-foreground">/mês</span>
              </p>

              <ul className="mt-3 space-y-1.5">
                {p.features.map((f) => (
                  <li key={f} className="flex gap-2 text-[12.5px] text-foreground">
                    <Check
                      className="mt-0.5 h-3.5 w-3.5 shrink-0"
                      strokeWidth={3}
                      style={{ color: p.highlight ? "#4F46E5" : "var(--color-navy)" }}
                    />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => go(p.id)}
                disabled={busy !== null}
                className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[13.5px] font-bold transition active:scale-[0.99] disabled:opacity-60"
                style={
                  p.highlight
                    ? {
                        background: "linear-gradient(135deg,#4F46E5,#6366F1)",
                        color: "#FFFFFF",
                      }
                    : {
                        border: "1.5px solid var(--color-navy)",
                        color: "var(--color-navy)",
                      }
                }
              >
                {busy === p.id ? (
                  "Redirecionando..."
                ) : p.highlight ? (
                  <>
                    <Trash2 className="h-3.5 w-3.5" /> Remover dados vazados
                  </>
                ) : (
                  "Assinar Essencial"
                )}
              </button>
            </div>
          ))}
        </div>

        <p className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Lock className="h-3 w-3" /> Pagamento seguro via Stripe
          </span>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" /> Conforme a LGPD
          </span>
        </p>
      </div>
    </div>
  );
}
