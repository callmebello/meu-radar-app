import { useEffect, useState } from "react";

const STEPS: { text: string; tone: "gray" | "green" }[] = [
  { text: "Iniciando varredura...", tone: "gray" },
  { text: "✓ Verificando CPF...", tone: "green" },
  { text: "✓ Checando vazamentos...", tone: "green" },
  { text: "✓ Analisando dark web...", tone: "green" },
];

export function ScanningOverlay() {
  const [shown, setShown] = useState<number[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timers = STEPS.map((_, i) =>
      setTimeout(() => setShown((p) => [...p, i]), i * 600)
    );

    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const pct = Math.min(((now - start) / 3000) * 100, 100);
      setProgress(pct);
      if (pct < 100) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      timers.forEach(clearTimeout);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 px-6 backdrop-blur-sm">
      <svg width="120" height="120" viewBox="0 0 48 48" fill="none" aria-hidden>
        <circle cx="24" cy="24" r="8" stroke="#818CF8" strokeWidth="1" fill="none" />
        <circle cx="24" cy="24" r="16" stroke="#6366F1" strokeWidth="1" fill="none" opacity="0.7" />
        <circle cx="24" cy="24" r="22" stroke="#4F46E5" strokeWidth="1" fill="none" opacity="0.5" />
        <g className="radar-sweep-fast">
          <line x1="24" y1="24" x2="40" y2="8" stroke="#A5B4FC" strokeWidth="1.5" strokeLinecap="round" />
        </g>
        <circle cx="24" cy="24" r="2" fill="#A5B4FC" />
      </svg>

      <div className="mt-7 flex flex-col items-start gap-2">
        {STEPS.map(
          (s, i) =>
            shown.includes(i) && (
              <p
                key={i}
                className={`animate-scan-step text-sm ${s.tone === "green" ? "text-green-400" : "text-gray-400"}`}
              >
                {s.text}
              </p>
            )
        )}
      </div>

      {/* Progress bar */}
      <div className="mt-7 h-1 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full"
          style={{ width: `${progress}%`, backgroundColor: "#4F46E5" }}
        />
      </div>
    </div>
  );
}
