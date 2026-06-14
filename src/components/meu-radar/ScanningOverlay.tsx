import { useEffect, useState } from "react";
import { Check } from "lucide-react";

const SCAN_STEPS = [
  "Verificando CPF na Receita Federal...",
  "Consultando bases de vazamentos...",
  "Analisando dark web...",
  "Cruzando informações...",
  "Gerando relatório...",
];
const STEP_AT = [0, 800, 1600, 2400, 3000];

/**
 * Scanning box that slides up from the bottom OVER the dashboard.
 * The app stays visible behind a light blur (footer/scan button remain on top
 * and keep spinning) so the user still feels inside the app.
 */
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
    <div className="fixed inset-0 z-40 flex flex-col justify-end bg-black/25 backdrop-blur-[3px]">
      <div
        className="mx-3 mb-[92px] rounded-2xl border p-5"
        style={{
          backgroundColor: "rgba(14,14,26,0.94)",
          borderColor: "rgba(99,102,241,0.3)",
          boxShadow: "0 -10px 44px rgba(0,0,0,0.55)",
          transform: up ? "translateY(0)" : "translateY(110%)",
          opacity: up ? 1 : 0,
          transition: "transform 0.55s cubic-bezier(0.22,1,0.36,1), opacity 0.4s ease-out",
        }}
      >
        <div className="flex items-center gap-3">
          <span className="h-9 w-9 shrink-0 animate-spin rounded-full border-2 border-indigo-500/30 border-t-indigo-400" />
          <div>
            <p className="text-sm font-bold text-white">Escaneando sua identidade</p>
            <p className="text-xs text-gray-400">Mantenha o app aberto...</p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2">
          {SCAN_STEPS.map((s, i) => {
            const isDone = done.includes(i);
            const active = done.length === i;
            return (
              <div key={i} className="flex items-center gap-2.5 text-sm">
                {isDone ? (
                  <Check className="h-4 w-4 shrink-0 text-green-400" />
                ) : (
                  <span className="h-4 w-4 shrink-0 rounded-full border border-white/15" />
                )}
                <span style={{ color: isDone ? "#4ADE80" : active ? "#A5B4FC" : "#5B5B6B" }}>{s}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 h-1 w-full overflow-hidden rounded-full" style={{ backgroundColor: "#12121A" }}>
          <div
            className="h-full rounded-full"
            style={{ width: bar ? "100%" : "0%", backgroundColor: "#6366F1", transition: "width 3.4s linear" }}
          />
        </div>
      </div>
    </div>
  );
}
