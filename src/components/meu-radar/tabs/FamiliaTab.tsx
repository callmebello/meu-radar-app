import { AppHeader } from "../Header";
import { Plus, Lock } from "lucide-react";
import { useApp } from "@/contexts/AppContext";

type Risk = "Alto" | "Médio" | "Baixo";
const members: { name: string; rel: string; score: number; risk: Risk; when: string; attention?: boolean }[] = [
  { name: "João Silva", rel: "Você", score: 67, risk: "Médio", when: "hoje" },
  { name: "Maria Silva", rel: "Cônjuge", score: 89, risk: "Baixo", when: "ontem" },
  { name: "Pedro Silva", rel: "Filho, 16", score: 94, risk: "Baixo", when: "ontem" },
  { name: "Dona Ana", rel: "Mãe, 68", score: 43, risk: "Alto", when: "2 dias atrás", attention: true },
];

const riskColor = (r: Risk) => r === "Alto" ? "var(--color-danger)" : r === "Médio" ? "var(--color-warning)" : "var(--color-success)";

export function FamiliaTab() {
  const { isPremium, openPaywall } = useApp();
  return (
    <>
      <AppHeader title="Plano Família" subtitle="4 membros monitorados" showBell />
      <div className="space-y-4 px-5 py-5">
        <ul className="space-y-3">
          {members.map((m) => {
            const c = riskColor(m.risk);
            return (
              <li key={m.name} className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-[var(--color-navy)] text-sm font-bold text-white">
                    {m.name.split(" ").map(n => n[0]).slice(0,2).join("")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">{m.name}</p>
                      {m.attention && (
                        <span className="rounded-full bg-[var(--color-danger)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">Atenção</span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">{m.rel} · verificado {m.when}</p>
                  </div>
                  <div className="text-right">
                    {isPremium || m.rel === "Você" ? (
                      <p className="text-xl font-extrabold tracking-tight text-foreground">{m.score}</p>
                    ) : (
                      <button
                        onClick={openPaywall}
                        className="inline-flex items-center gap-1 text-xl font-extrabold text-muted-foreground hover:text-foreground transition"
                      >
                        <Lock className="h-3.5 w-3.5" />—
                      </button>
                    )}
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: c }}>Risco {m.risk}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <button className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--color-navy)]/30 px-4 py-3.5 text-sm font-semibold text-[var(--color-navy)] hover:bg-[var(--color-navy)]/5 transition">
          <Plus className="h-4 w-4" /> Adicionar membro
        </button>

        <section className="rounded-2xl bg-[var(--color-navy)] p-5 text-white shadow-lg">
          <p className="text-xs font-bold uppercase tracking-wider text-white/80">Upgrade</p>
          <h3 className="mt-1 text-lg font-bold">Plano Família — até 6 membros</h3>
          <p className="mt-1 text-sm text-white/70">R$ 39/mês — você já usa 4 de 6 slots</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-white" style={{ width: "66%" }} />
          </div>
        </section>
      </div>
    </>
  );
}
