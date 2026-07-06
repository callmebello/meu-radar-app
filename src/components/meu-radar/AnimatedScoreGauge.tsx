import { useEffect, useState } from "react";

interface Props {
  score: number;
  max?: number;
  duration?: number;
  showMax?: boolean;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export function AnimatedScoreGauge({ score, max = 100, duration = 1500, showMax = false }: Props) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      setCurrent(easeOutCubic(t) * score);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score, duration]);

  const pct = Math.max(0, Math.min(1, current / max));
  const ratio = score / max;
  const color = ratio < 0.4 ? "#ef4444" : ratio <= 0.7 ? "#f59e0b" : "#22c55e";
  const label = ratio < 0.4 ? "RISCO ALTO" : ratio <= 0.7 ? "RISCO MÉDIO" : "RISCO BAIXO";

  // Semicircle: cx=100, cy=100, r=80, sweep 180° → 0°
  const r = 80;
  const cx = 100;
  const cy = 100;
  const arcLen = Math.PI * r; // half-circle circumference
  const offset = arcLen * (1 - pct);

  // Needle position
  const angle = Math.PI - pct * Math.PI; // radians; π at left → 0 at right
  const nx = cx + r * Math.cos(angle);
  const ny = cy - r * Math.sin(angle);

  return (
    <div className="relative flex flex-col items-center">
      <svg viewBox="0 0 200 130" className="w-full max-w-[240px]">
        {/* background arc */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="currentColor"
          className="text-muted"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* foreground animated arc */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={arcLen}
          strokeDashoffset={offset}
        />
        {/* needle dot */}
        <circle cx={nx} cy={ny} r="6" fill={color} stroke="white" strokeWidth="2" />
      </svg>
      <div className="-mt-12 flex flex-col items-center">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-extrabold tracking-tight text-foreground">
            {Math.round(current)}
          </span>
          {showMax && <span className="text-sm font-medium text-muted-foreground">/{max}</span>}
        </div>
        <span
          className="mt-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
          style={{ backgroundColor: `${color}22`, color }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}
