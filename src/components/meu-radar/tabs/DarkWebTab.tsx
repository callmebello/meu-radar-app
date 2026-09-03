import { useState } from "react";
import { ShieldCheck, KeyRound, ShieldAlert, Lock, ChevronDown } from "lucide-react";
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
  const [recsOpen, setRecsOpen] = useState(false);

  // Real combined exposure: GitHub code search + SerpAPI (CPF + phone).
  const gh = exposure?.github;
  const cpfEx = exposure?.cpf;
  const phoneEx = exposure?.phone;

  const sources: { label: string; meta: string }[] = [
    ...(gh?.repos ?? []).map((r) => ({ label: r.repo || "Repositório público", meta: r.path })),
    ...(cpfEx?.sources ?? []).map((s) => ({
      label: s.title || domainOf(s.link),
      meta: domainOf(s.link),
    })),
    ...(phoneEx?.sources ?? []).map((s) => ({
      label: s.title || domainOf(s.link),
      meta: domainOf(s.link),
    })),
  ];

  return (
    <>
      <div className="space-y-5 px-5 py-5">
        {/* The two big counters are gone. On the common case they read
            "0 / 0" in 30px type — a box whose whole job was to announce
            nothing, above a panel that already says nothing was found. */}
        {/* Source list — rendered only when there is a source. An empty
            "Exposição pública encontrada" heading over a green "nothing found"
            box was three lines saying the same nothing, under a search box the
            person had just used. */}
        {sources.length > 0 && (
          <section>
            <h2 className="mb-3 px-1 text-sm font-semibold text-foreground">
              Exposição pública encontrada
            </h2>
            <ul className="space-y-2.5">
              {(isPremium ? sources : sources.slice(0, 1)).map((s2, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-semibold text-foreground">
                      {s2.label}
                    </span>
                    <span className="block truncate text-[11.5px] text-muted-foreground">
                      {s2.meta}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
            {!isPremium && sources.length > 1 && (
              <button
                onClick={openPaywall}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-3 text-[13px] font-semibold text-[var(--color-navy)]"
              >
                <Lock className="h-3.5 w-3.5" /> Ver as outras {sources.length - 1}
              </button>
            )}
          </section>
        )}

        {/* Recommendations — collapsed. They are the same three every time, so
            after the first read they are furniture. */}
        <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
          <button
            onClick={() => setRecsOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
            aria-expanded={recsOpen}
          >
            <span className="text-sm font-semibold text-foreground">Recomendações</span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${recsOpen ? "rotate-180" : ""}`}
            />
          </button>
          <div
            className="grid transition-all duration-300"
            style={{ gridTemplateRows: recsOpen ? "1fr" : "0fr" }}
          >
            <div className="overflow-hidden">
              <ul className="space-y-3 border-t border-border px-5 py-4">
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
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
