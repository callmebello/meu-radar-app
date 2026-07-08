import { useEffect, useState } from "react";

interface Props {
  score: number;
  max?: number;
  duration?: number;
  showMax?: boolean;
  /** Speedometer look: green→red gradient arc + needle (used on /relatorio). */
  gradient?: boolean;
  /** Hide the built-in risk pill (when the label is rendered elsewhere). */
  showLabel?: boolean;
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export function AnimatedScoreGauge({ score, max = 100, duration = 1500, showMax = false, gradient = false, showLabel = true }: Props) {
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
  const color =
    ratio < 0.4 ? "#ef4444" : ratio <= 0.7 ? "#f59e0b" : "#22c55e";
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
        {gradient && (
          <defs>
            <linearGradient id="gauge-risk-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="45%" stopColor="#f59e0b" />
              <stop offset="80%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
        )}
        {/* background arc */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="currentColor"
          className="text-muted"
          strokeWidth="12"
          strokeLinecap="round"
        />
        {/* foreground arc — gradient mode draws the FULL green→red scale
            (speedometer); the needle indicates the score. Solid mode keeps the
            animated fill. */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={gradient ? "url(#gauge-risk-grad)" : color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={gradient ? undefined : arcLen}
          strokeDashoffset={gradient ? undefined : offset}
        />
        {/* speedometer needle */}
        {gradient && (
          <line
            x1={cx + (r - 34) * Math.cos(angle)}
            y1={cy - (r - 34) * Math.sin(angle)}
            x2={cx + (r - 12) * Math.cos(angle)}
            y2={cy - (r - 12) * Math.sin(angle)}
            stroke="#1f2937"
            strokeWidth="5"
            strokeLinecap="round"
          />
        )}
        {/* needle dot */}
        <circle cx={nx} cy={ny} r="6" fill={color} stroke="white" strokeWidth="2" />
      </svg>
      <div className="-mt-12 flex flex-col items-center">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-extrabold tracking-tight text-foreground">
            {Math.round(current)}
          </span>
          {showMax && (
            <span className="text-sm font-medium text-muted-foreground">/{max}</span>
          )}
        </div>
        {showLabel && (
          <span
            className="mt-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
            style={{ backgroundColor: `${color}22`, color }}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
