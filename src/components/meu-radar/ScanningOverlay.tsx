import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { ScanMark } from "../onboarding/ScanMark";

/**
 * The box that comes up while a scan runs.
 *
 * Two things were wrong with it. It was painted dark on a hardcoded
 * `rgba(14,14,26,0.94)` with white text, so on the light theme a black slab
 * slid over a white app — the one screen in the product that ignored the
 * theme. And its steps claimed work we do not do ("Verificando CPF na Receita
 * Federal"), which is the kind of line that costs everything the moment
 * someone checks.
 *
 * It now uses the same card tokens as the rest of the app and names the two
 * lookups that actually run: the breach databases (HIBP) and the public web.
 */
// Short enough to fit one line at 390px. The longer versions truncated, and a
// step that ends in an ellipsis reads as a bug in the middle of a wait.
const SCAN_STEPS = [
  "Preparando sua verificação",
  "Procurando seu e-mail em vazamentos",
  "Procurando seus dados em páginas públicas",
  "Cruzando o que encontramos",
  "Calculando seu Identity Score",
];
const STEP_AT = [0, 900, 1900, 2700, 3300];

export function ScanningOverlay({ open }: { open: boolean }) {
  const [done, setDone] = useState<number[]>([]);
  const [bar, setBar] = useState(false);
  const [up, setUp] = useState(false); // drives the slide-up via CSS transition

  useEffect(() => {
    if (!open) {
      setDone([]);
      setBar(false);
      setUp(false);
      return;
    }
    setDone([]);
    setBar(false);
    setUp(false);
    // shortly after mount → transition from translateY(110%) to 0 (slides up).
    // setTimeout (not rAF) so it still fires when the preview tab is unfocused.
    const timers: ReturnType<typeof setTimeout>[] = [
      setTimeout(() => setUp(true), 30),
      setTimeout(() => setBar(true), 80),
    ];
    STEP_AT.forEach((at, i) => timers.push(setTimeout(() => setDone((p) => [...p, i]), at)));
    return () => {
      timers.forEach(clearTimeout);
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 flex flex-col justify-end"
      style={{ backgroundColor: "rgba(10,10,20,0.28)", backdropFilter: "blur(2px)" }}
    >
      <div
        className="mx-3 mb-[92px] rounded-2xl border border-border bg-card p-5 shadow-[0_-12px_44px_-12px_rgba(30,45,90,0.35)]"
        style={{
          transform: up ? "translateY(0)" : "translateY(110%)",
          opacity: up ? 1 : 0,
          transition: "transform 0.55s cubic-bezier(0.22,1,0.36,1), opacity 0.4s ease-out",
        }}
      >
        <div className="flex items-center gap-3">
          {/* The same sweeping mark the tab bar and the onboarding use, so the
              wait looks like the product rather than a generic spinner. */}
          <ScanMark done={false} size={40} />
          <div className="min-w-0">
            <p className="text-[15px] font-extrabold leading-tight text-foreground">
              Escaneando sua identidade
            </p>
            <p className="text-[12.5px] text-muted-foreground">Mantenha o app aberto…</p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {SCAN_STEPS.map((s, i) => {
            const isDone = done.includes(i);
            const active = done.length === i;
            return (
              <div key={i} className="flex items-center gap-2.5 text-[13px]">
                {isDone ? (
                  <Check className="h-4 w-4 shrink-0" style={{ color: "#0FA968" }} />
                ) : active ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" style={{ color: "#4F46E5" }} />
                ) : (
                  <span className="h-4 w-4 shrink-0 rounded-full border border-border" />
                )}
                <span
                  className="min-w-0 truncate"
                  style={{
                    color: isDone
                      ? "var(--color-foreground)"
                      : active
                        ? "#4F46E5"
                        : "var(--color-muted-foreground)",
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {s}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full"
            style={{
              width: bar ? "100%" : "0%",
              background: "linear-gradient(90deg,#4F46E5,#818CF8)",
              transition: "width 3.6s linear",
            }}
          />
        </div>
      </div>
    </div>
  );
}
