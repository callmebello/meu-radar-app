import { ShieldCheck, KeyRound, ShieldAlert, Lock, CheckCircle2 } from "lucide-react";
import { useApp } from "@/contexts/AppContext";

function domainOf(link: string) {
  try {
    return new URL(link).hostname.replace(/^www\./, "");
  } catch {
    return link;
  }
}

const recs = [
  { icon: KeyRound, text: "Troque senhas reutilizadas imediatamente" },
  { icon: ShieldCheck, text: "Ative 2FA em todas as contas" },
  { icon: ShieldAlert, text: "Monitore transações bancárias" },
];

export function DarkWebTab() {
  const { isPremium, openPaywall, exposure } = useApp();

  // Real combined exposure: GitHub code search + SerpAPI (CPF + phone).
  const gh = exposure?.github;
  const cpfEx = exposure?.cpf;
  const phoneEx = exposure?.phone;
  const total = (gh?.count ?? 0) + (cpfEx?.count ?? 0) + (phoneEx?.count ?? 0);

  const sources: { label: string; meta: string }[] = [
    ...(gh?.repos ?? []).map((r) => ({ label: r.repo || "Repositório público", meta: r.path })),
    ...(cpfEx?.sources ?? []).map((s) => ({ label: s.title || domainOf(s.link), meta: domainOf(s.link) })),
    ...(phoneEx?.sources ?? []).map((s) => ({ label: s.title || domainOf(s.link), meta: domainOf(s.link) })),
  ];
  const distinctSources = new Set(sources.map((s) => s.meta)).size;

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
            <p className="text-[11px] text-white/60">Busca pública (GitHub + web) em tempo real</p>
          </div>
        </div>

        {/* Summary */}
        <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-3xl font-extrabold text-foreground">{total}</p>
              <p className="text-[11px] text-muted-foreground">Resultados públicos</p>
            </div>
            <div>
              <p className="text-3xl font-extrabold text-foreground">{distinctSources}</p>
              <p className="text-[11px] text-muted-foreground">Fontes distintas</p>
            </div>
          </div>
        </section>

        {/* Source list */}
        <section>
          <h2 className="mb-3 px-1 text-sm font-semibold text-foreground">Exposição pública encontrada</h2>
          {sources.length === 0 ? (
            <div className="flex items-center gap-3 rounded-xl border border-[var(--color-success)]/20 bg-[var(--color-success)]/5 p-4">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--color-success)]" />
              <p className="text-sm text-[var(--color-success)]">Nenhuma exposição pública encontrada. Continuamos monitorando.</p>
            </div>
          ) : (
            <ul className="space-y-2.5">
              {sources.slice(0, 8).map((s, i) => (
                <li key={i} className="rounded-xl border border-border/60 bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {isPremium ? (
                        <p className="truncate text-sm font-semibold text-foreground">{s.label}</p>
                      ) : (
                        <button onClick={openPaywall} className="inline-flex max-w-full items-center gap-1.5 text-sm font-semibold text-muted-foreground transition hover:text-foreground">
                          <Lock className="h-3 w-3 shrink-0" />
                          <span className="truncate blur-[4px] select-none">{s.label}</span>
                        </button>
                      )}
                      <p className="truncate text-[11px] text-muted-foreground">{s.meta}</p>
                    </div>
                    <span className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide" style={{ backgroundColor: "color-mix(in oklab, var(--color-warning) 14%, transparent)", color: "var(--color-warning)" }}>
                      Público
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
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
