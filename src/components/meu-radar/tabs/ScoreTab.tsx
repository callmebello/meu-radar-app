import { Search, Lock, Clock, BellRing } from "lucide-react";
import { useState } from "react";
import { useApp } from "@/contexts/AppContext";

/**
 * Score de crédito / negativações. There is no free real source for this yet
 * (Serasa/Boavista are paid B2B bureaus), so this is an honest "em breve" panel
 * — no fabricated scores or debts. Premium users can register interest.
 */
export function ScoreTab() {
  const { isPremium, openPaywall } = useApp();
  const [notified, setNotified] = useState(false);

  return (
    <div className="space-y-5 px-5 py-5">
      {/* Intro */}
      <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--color-teal)]/15">
            <Search className="h-4 w-4 text-[var(--color-navy)]" />
          </span>
          <h2 className="text-sm font-semibold text-foreground">Score de crédito e negativações</h2>
          <span className="ml-auto rounded-full bg-[var(--color-warning)]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[var(--color-warning)]">
            Em breve
          </span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Estamos integrando os bureaus de crédito (Serasa/Boavista) para mostrar seu score, dívidas negativadas e
          consultas ao seu CPF em tempo real. Em breve aqui.
        </p>
      </section>

      {/* Empty score bar — placeholder until the bureaus integration is live */}
      <section className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Seu Score</p>
          <p className="mt-3 text-5xl font-extrabold text-muted-foreground/40">—</p>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full w-0 rounded-full bg-[var(--color-navy)]" />
          </div>
          <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
            0 Crítico · 300 Baixo · 600 Médio · 850 Alto · 1000 Excelente
          </p>
          <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <Clock className="h-3 w-3" /> Disponível em breve
          </p>
        </div>
      </section>

      {/* CTA: register interest (premium) / unlock (free) */}
      {isPremium ? (
        <button
          onClick={() => setNotified(true)}
          disabled={notified}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition disabled:opacity-60"
          style={{ backgroundColor: "#4F46E5" }}
        >
          <BellRing className="h-4 w-4" />
          {notified ? "Você será avisado ✓" : "Avise-me quando lançar"}
        </button>
      ) : (
        <button
          onClick={openPaywall}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition hover:opacity-90"
          style={{ backgroundColor: "#4F46E5" }}
        >
          <Lock className="h-4 w-4" /> Desbloquear quando lançar
        </button>
      )}
    </div>
  );
}
