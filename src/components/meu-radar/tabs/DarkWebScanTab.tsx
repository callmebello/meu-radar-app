import { useEffect, useState } from "react";
import { ShieldAlert, Lock, Loader2, Database, CheckCircle2 } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { checkHibp, type HibpBreach } from "@/lib/api/hibp.functions";
import { startCheckout } from "@/lib/checkout";
import { track } from "@/lib/analytics";

/**
 * Dark Web monitoring panel. Premium-only: leaked credentials surfaced from
 * breach corpora (HIBP today; a dedicated dark-web feed can be plugged in here
 * later). Locked behind the Proteção Total plan until the user converts.
 */
export function DarkWebScanTab() {
  const { isPremium } = useApp();
  const [loading, setLoading] = useState(false);
  const [breaches, setBreaches] = useState<HibpBreach[] | null>(null);

  const email = typeof window !== "undefined" ? sessionStorage.getItem("priva_email") || "" : "";

  useEffect(() => {
    if (!isPremium || !email) return;
    let alive = true;
    setLoading(true);
    checkHibp({ data: { email } })
      .then((r) => alive && setBreaches(r.breaches))
      .catch(() => alive && setBreaches([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [isPremium, email]);

  // ---------- LOCKED (not purchased) ----------
  if (!isPremium) {
    return (
      <div className="space-y-5 px-5 py-5">
        <div className="flex items-center gap-3 rounded-2xl bg-[#0B1020] p-4 text-white shadow-lg">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10">
            <Database className="h-5 w-5 text-indigo-300" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold">Monitoramento Dark Web</p>
            <p className="text-[11px] text-white/60">Rastreamos fóruns e bases de dados de golpistas</p>
          </div>
        </div>

        <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <h2 className="flex items-center gap-1.5 text-sm font-bold text-[var(--color-danger)]">
            <ShieldAlert className="h-4 w-4" /> Possíveis vazamentos encontrados
          </h2>
          <ul className="mt-3 space-y-2.5">
            {["Base ••••••br — e-mail e senha", "Fórum ••••••2024 — dados pessoais", "Combo ••••••leak — telefone"].map((t) => (
              <li key={t} className="flex items-center gap-2 rounded-xl border border-border/60 bg-secondary/40 px-3 py-2.5">
                <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                <span className="select-none truncate text-sm text-muted-foreground blur-[4px]">{t}</span>
              </li>
            ))}
          </ul>
          <button
            onClick={() => {
              void startCheckout("protecao_total");
            }}
            className="mt-4 w-full rounded-xl py-3 text-sm font-bold text-white transition hover:opacity-90"
            style={{ background: "linear-gradient(135deg,#DC2626,#EF4444)" }}
          >
            Ativar monitoramento Dark Web · R$24,90/mês
          </button>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">Disponível no plano Proteção Total</p>
        </section>
      </div>
    );
  }

  // ---------- UNLOCKED (premium) ----------
  return (
    <div className="space-y-5 px-5 py-5">
      <div className="flex items-center gap-3 rounded-2xl bg-[var(--color-navy)] p-4 text-white shadow-lg">
        <span className="relative grid h-3 w-3 place-items-center">
          <span className="absolute h-3 w-3 rounded-full bg-white pulse-dot" />
          <span className="h-1.5 w-1.5 rounded-full bg-white" />
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold">Monitoramento Dark Web ativo</p>
          <p className="text-[11px] text-white/60">{email || "seu e-mail"}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-border/60 bg-card p-8 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Rastreando bases comprometidas...
        </div>
      ) : breaches && breaches.length > 0 ? (
        <>
          <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <p className="text-3xl font-extrabold text-[var(--color-danger)]">{breaches.length}</p>
            <p className="text-[11px] text-muted-foreground">vazamentos com seus dados na dark web</p>
          </section>
          <ul className="space-y-2.5">
            {breaches.map((b, i) => {
              const title = String(b.Title || b.Name || "Vazamento");
              const domain = b.Domain ? String(b.Domain) : "";
              const date = b.BreachDate ? String(b.BreachDate) : "";
              const classes = Array.isArray(b.DataClasses) ? b.DataClasses.join(" · ") : "";
              return (
                <li key={i} className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{title}</p>
                      {domain && <p className="truncate text-[11px] text-muted-foreground">{domain}</p>}
                    </div>
                    <span className="shrink-0 rounded-full bg-[var(--color-danger)]/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[var(--color-danger)]">
                      Exposto
                    </span>
                  </div>
                  {classes && <p className="mt-2 text-[11px] leading-snug text-muted-foreground">Dados expostos: {classes}</p>}
                  {date && <p className="mt-1 text-[10px] text-muted-foreground/70">Vazamento de {date}</p>}
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-success)]/20 bg-[var(--color-success)]/5 p-4">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--color-success)]" />
          <p className="text-sm text-[var(--color-success)]">Nenhum vazamento encontrado na dark web. Continuamos monitorando 24/7.</p>
        </div>
      )}
    </div>
  );
}
