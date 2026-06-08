import { ShieldCheck, KeyRound, ShieldAlert, Lock } from "lucide-react";
import { useApp } from "@/contexts/AppContext";

type Level = "Alto" | "Médio";
const breaches: { source: string; date: string; tags: string[]; level: Level }[] = [
  { source: "Base de dados comprometida", date: "Jan 2025", tags: ["e-mail", "senha"], level: "Alto" },
  { source: "Loja VarejoBR", date: "Set 2024", tags: ["CPF", "telefone", "endereço"], level: "Alto" },
  { source: "Serviço StreamBR", date: "Mar 2024", tags: ["e-mail"], level: "Médio" },
  { source: "Plataforma EduBR", date: "Nov 2023", tags: ["nome", "e-mail"], level: "Médio" },
];

const lvlColor = (l: Level) => l === "Alto" ? "var(--color-danger)" : "var(--color-warning)";

const recs = [
  { icon: KeyRound, text: "Troque senhas reutilizadas imediatamente" },
  { icon: ShieldCheck, text: "Ative 2FA em todas as contas" },
  { icon: ShieldAlert, text: "Monitore transações bancárias" },
];

export function DarkWebTab() {
  const { isPremium, openPaywall } = useApp();
  return (
    <>
      <div className="space-y-5 px-5 py-5">
        {/* Status banner */}
        <div className="flex items-center gap-3 rounded-2xl bg-[var(--color-navy)] p-4 text-white shadow-lg">
          <span className="relative grid h-3 w-3 place-items-center">
            <span className="absolute h-3 w-3 rounded-full bg-white pulse-dot" />
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-semibold">Monitoramento ativo</p>
            <p className="text-[11px] text-white/60">Última varredura: 23 min atrás</p>
          </div>
        </div>

        {/* Summary */}
        <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-3xl font-extrabold text-foreground">7</p>
              <p className="text-[11px] text-muted-foreground">Total de ocorrências</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-foreground">4</p>
              <p className="text-[11px] text-muted-foreground">Bases comprometidas</p>
            </div>
          </div>
          <div className="mt-4 border-t border-border/60 pt-3">
            <p className="text-[11px] text-muted-foreground">Dados mais expostos</p>
            <div className="mt-1.5 flex gap-1.5">
              <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-foreground">E-mail</span>
              <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-foreground">CPF</span>
            </div>
          </div>
        </section>

        {/* Breach list */}
        <section>
          <h2 className="mb-3 px-1 text-sm font-semibold text-foreground">Vazamentos identificados</h2>
          <ul className="space-y-2.5">
            {breaches.map((b) => {
              const c = lvlColor(b.level);
              return (
                <li key={b.source} className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {isPremium ? (
                        <p className="truncate text-sm font-semibold text-foreground">{b.source}</p>
                      ) : (
                        <button
                          onClick={openPaywall}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition"
                        >
                          <Lock className="h-3 w-3" />
                          <span className="blur-[4px] select-none">{b.source}</span>
                        </button>
                      )}
                      <p className="text-[11px] text-muted-foreground">{b.date}</p>
                    </div>
                    <span className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide" style={{ backgroundColor: `color-mix(in oklab, ${c} 14%, transparent)`, color: c }}>
                      {b.level}
                    </span>
                  </div>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {b.tags.map((t) => (
                      <span key={t} className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{t}</span>
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Recommendations */}
        <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">Recomendações</h2>
          <ul className="mt-3 space-y-3">
            {recs.map((r, i) => {
              const Icon = r.icon;
              return (
                <li key={i} className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--color-teal)]/15">
                    <Icon className="h-4 w-4 text-[var(--color-navy)]" />
                  </span>
                  <p className="text-sm text-foreground">{r.text}</p>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </>
  );
}
