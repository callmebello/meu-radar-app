import { useState } from "react";
import { CheckCircle2, Circle, ChevronRight, ShieldCheck, TrendingUp } from "lucide-react";
import { displayName, logoOf, rankForDisplay, type Breach } from "@/lib/breaches";
import { guidanceFor, leakedLabels } from "@/lib/breachActions";
import { hasAction, recordAction, undoAction } from "@/lib/actions";
import { ACTION_CREDIT } from "@/lib/riskScore";
import { DIFFICULTY, difficultyOf } from "@/lib/removal";

/**
 * The paid half of the report: what to do, company by company.
 *
 * Everything above this on the page is diagnosis — what leaked, where, when,
 * and the score that follows from it. A diagnosis is worth reading once. What
 * a subscriber is actually paying for is the part that closes the loop, and
 * before this the report simply ended with "Você já está protegido" and a
 * button back to the dashboard. That is the churn hole: R$49,90 for a page
 * that tells you bad news and then congratulates you.
 *
 * So every finding here carries its own tasks, each worth real points on the
 * same score printed above — and each ticked box moves that number on the spot.
 * The removal difficulty is stated on the same row, because "we will ask them
 * to delete it" means something very different for LinkedIn than for a broker
 * that resells CPFs, and pretending otherwise is what produces refunds.
 */
const CREDIT_OF = {
  password_changed: ACTION_CREDIT.passwordChanged,
  twofa_enabled: ACTION_CREDIT.twoFactorEnabled,
  account_closed: ACTION_CREDIT.accountClosed,
  removal_requested: ACTION_CREDIT.removalRequested,
} as const;

const keyOf = (b: Breach) => b.Domain || b.Name || displayName(b);

export function ReportActionPlan({
  breaches,
  headroom,
  onGoRemocao,
  onChange,
}: {
  breaches: Breach[];
  /** Points still available after the recovery cap — never promise past it. */
  headroom: number;
  onGoRemocao: () => void;
  /** Fired whenever the ledger changes, so the score above can re-render. */
  onChange: () => void;
}) {
  const ranked = rankForDisplay(breaches);
  const [, force] = useState(0);

  const toggle = (type: Parameters<typeof hasAction>[0], target: string) => {
    if (hasAction(type, target)) undoAction(type, target);
    else recordAction(type, target);
    force((n) => n + 1);
    onChange();
  };

  if (ranked.length === 0) return null;

  return (
    <section className="mt-7 px-5">
      <div className="mb-3 flex items-center gap-2">
        <h2 className="text-[17px] font-bold text-foreground">Seu plano de ação</h2>
        {headroom > 0 && (
          <span
            className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold"
            style={{ backgroundColor: "rgba(15,169,104,0.12)", color: "#0FA968" }}
          >
            <TrendingUp className="h-3 w-3" /> até +{headroom} pontos
          </span>
        )}
      </div>

      <p className="mb-3 text-[12.5px] leading-relaxed text-muted-foreground">
        Marque conforme for resolvendo. Cada item muda o seu score aqui em cima na hora — e o que
        você marcar fica registrado, então dá para voltar depois e continuar de onde parou.
      </p>

      <div className="space-y-2.5">
        {ranked.map((b) => {
          const k = keyOf(b);
          const name = displayName(b);
          const logo = logoOf(b);
          const { tasks, advice } = guidanceFor(b, name);
          const leaked = leakedLabels(b);
          const d = difficultyOf(b);
          const meta = DIFFICULTY[d];
          const doneCount = tasks.filter((t) => hasAction(t.type, k)).length;
          const allDone = tasks.length > 0 && doneCount === tasks.length;

          return (
            <div
              key={k}
              className="overflow-hidden rounded-2xl border bg-card"
              style={{
                borderColor: allDone ? "rgba(15,169,104,0.35)" : "var(--color-border)",
              }}
            >
              <div className="flex items-start gap-3 px-4 pb-3 pt-3.5">
                {logo ? (
                  <img
                    src={logo}
                    alt=""
                    className="h-9 w-9 shrink-0 rounded-lg bg-white object-contain p-1"
                  />
                ) : (
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                    style={{ backgroundColor: meta.bg }}
                  >
                    <ShieldCheck className="h-4 w-4" style={{ color: meta.color }} />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="min-w-0 truncate text-[14.5px] font-bold text-foreground">
                      {name}
                    </p>
                    {allDone && (
                      <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "#0FA968" }} />
                    )}
                  </div>
                  {leaked.length > 0 && (
                    <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">
                      Vazou: {leaked.join(" · ")}
                    </p>
                  )}
                </div>
                <span
                  className="shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-bold"
                  style={{ backgroundColor: meta.bg, color: meta.color }}
                >
                  {meta.short}
                </span>
              </div>

              {tasks.length > 0 && (
                <ul className="border-t border-border/60">
                  {tasks.map((t) => {
                    const done = hasAction(t.type, k);
                    const pts = CREDIT_OF[t.type];
                    return (
                      <li key={t.type}>
                        <button
                          onClick={() => toggle(t.type, k)}
                          className="flex w-full items-center gap-3 px-4 py-3 text-left transition active:bg-secondary/40"
                        >
                          {done ? (
                            <CheckCircle2
                              className="h-5 w-5 shrink-0"
                              style={{ color: "#0FA968" }}
                            />
                          ) : (
                            <Circle className="h-5 w-5 shrink-0 text-muted-foreground/50" />
                          )}
                          <span
                            className={`min-w-0 flex-1 text-[13.5px] leading-snug ${
                              done
                                ? "text-muted-foreground line-through"
                                : "font-medium text-foreground"
                            }`}
                          >
                            {t.label}
                          </span>
                          {pts ? (
                            <span
                              className="shrink-0 text-[12.5px] font-bold"
                              style={{ color: done ? "#0FA968" : "var(--color-muted-foreground)" }}
                            >
                              +{pts}
                            </span>
                          ) : null}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              {/* Removal is the one action with a third party on the hook, so
                  it never gets a self-declared checkbox — it goes to the queue
                  where the request is actually tracked. */}
              {d !== "impossivel" && (
                <button
                  onClick={onGoRemocao}
                  className="flex w-full items-center gap-2 border-t border-border/60 px-4 py-2.5 text-left"
                >
                  <span className="flex-1 text-[12.5px] font-semibold text-[var(--color-navy)]">
                    {meta.included ? "Pedir remoção dos dados" : "Escalar remoção"} · {meta.eta}
                  </span>
                  <span className="shrink-0 text-[12.5px] font-bold" style={{ color: "#0FA968" }}>
                    +{ACTION_CREDIT.removalRequested}
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </button>
              )}

              {advice.length > 0 && (
                <ul className="border-t border-border/60 bg-secondary/25 px-4 py-3">
                  {advice.map((a) => (
                    <li
                      key={a}
                      className="text-[12px] leading-snug text-muted-foreground [&+&]:mt-2"
                    >
                      {a}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-3 text-[11.5px] leading-relaxed text-muted-foreground">
        O que você marca aqui é a sua declaração — não temos como conferir a senha de outro site, e
        não fingimos que temos. Dá para desmarcar a qualquer momento.
      </p>
    </section>
  );
}
