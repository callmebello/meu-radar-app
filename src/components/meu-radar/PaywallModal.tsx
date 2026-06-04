import { Lock, X, Check } from "lucide-react";
import { useApp } from "@/contexts/AppContext";

const plans = [
  { id: "personal", name: "Personal", price: "R$19", desc: "CPF + e-mail + alertas" },
  { id: "score", name: "Score+", price: "R$29", desc: "Tudo + negativações + score", highlight: true },
  { id: "family", name: "Família", price: "R$39", desc: "Até 6 CPFs monitorados" },
];

export function PaywallModal() {
  const { paywallOpen, closePaywall, setIsPremium } = useApp();
  if (!paywallOpen) return null;

  const activate = () => {
    setIsPremium(true);
    closePaywall();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm animate-fade-in"
      onClick={closePaywall}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl bg-card p-6 shadow-2xl animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={closePaywall}
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full hover:bg-secondary transition"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="flex flex-col items-center text-center">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--color-navy)]">
            <Lock className="h-5 w-5 text-white" />
          </span>
          <h2 className="mt-3 text-lg font-bold text-foreground">Recurso Premium</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Ative um plano para desbloquear este conteúdo
          </p>
        </div>

        <div className="mt-5 space-y-2.5">
          {plans.map((p) => (
            <div
              key={p.id}
              className={`rounded-xl border p-3 transition ${
                p.highlight
                  ? "border-[var(--color-teal)] bg-[var(--color-teal)]/8"
                  : "border-border bg-secondary/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {p.name}{" "}
                    <span className="text-xs font-medium text-muted-foreground">
                      · {p.price}/mês
                    </span>
                  </p>
                  <p className="text-[11px] text-muted-foreground">{p.desc}</p>
                </div>
                {p.highlight && (
                  <span className="rounded-full bg-[var(--color-teal)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
                    Popular
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={activate}
          className="mt-5 w-full rounded-xl bg-[var(--color-navy)] py-3 text-sm font-semibold text-white hover:opacity-90 transition-all duration-200"
        >
          Assinar agora
        </button>
        <p className="mt-2 flex items-center justify-center gap-1 text-[10px] text-muted-foreground">
          <Check className="h-3 w-3 text-[var(--color-success)]" /> Cancele quando quiser
        </p>
      </div>
    </div>
  );
}
