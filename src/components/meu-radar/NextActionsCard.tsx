import { ChevronRight, TrendingUp } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { nextActions } from "@/lib/nextActions";
import { track, gaEvent } from "@/lib/analytics";

/**
 * The shortest path to a better score, on the first screen.
 *
 * The score is honest and it moves, but on its own it still only reports a
 * state — the things that would change it were buried one or two taps away in
 * Proteção. This puts the number and the next step side by side, which is the
 * whole retention loop: see the score, do one thing, watch it move.
 *
 * The points are real. nextActions clamps everything to the remaining headroom
 * under the recovery cap, so this never advertises gains the score will refuse
 * to hand over.
 */
export function NextActionsCard() {
  const { scanResult, exposure, goToTab, setProtecaoPill } = useApp();
  const { actions, headroom } = nextActions(scanResult, exposure);

  if (actions.length === 0) return null;

  const go = (pill: string, id: string) => {
    track("NextActionTapped");
    gaEvent("next_action_tapped", { action: id });
    setProtecaoPill(pill);
    goToTab("protecao");
  };

  // Three is enough to feel doable; a list of eleven reads as a chore.
  const shown = actions.slice(0, 3);

  return (
    <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-[0_2px_20px_-8px_rgba(30,45,90,0.15)]">
      <div className="flex items-center justify-between gap-3 px-5 pb-2.5 pt-4">
        <p className="text-[14.5px] font-bold text-foreground">Próximos passos</p>
        {headroom > 0 && (
          <span
            className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
            style={{ backgroundColor: "rgba(15,169,104,0.12)", color: "#0FA968" }}
          >
            <TrendingUp className="h-3 w-3" /> até +{headroom} pontos
          </span>
        )}
      </div>

      <ul>
        {shown.map((a) => (
          <li key={a.id}>
            <button
              onClick={() => go(a.pill, a.id)}
              className="flex w-full items-center gap-3 border-t border-border px-5 py-3.5 text-left transition active:bg-secondary/50"
            >
              <span className="min-w-0 flex-1 text-[13.5px] text-foreground">{a.label}</span>
              <span
                className="shrink-0 text-[12.5px] font-bold"
                style={{ color: "var(--color-success)" }}
              >
                +{a.points}
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          </li>
        ))}
      </ul>

      {actions.length > shown.length && (
        <button
          onClick={() => go(shown[0].pill, "ver_todas")}
          className="w-full border-t border-border px-5 py-3 text-[12.5px] font-semibold text-[var(--color-navy)]"
        >
          Ver todas as {actions.length} ações
        </button>
      )}
    </section>
  );
}
