import { useEffect, useState } from "react";
import { useIsDark } from "@/hooks/use-is-dark";

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

export function AnimatedScoreGauge({
  score,
  max = 100,
  duration = 1500,
  showMax = false,
  gradient = false,
  showLabel = true,
}: Props) {
  const [current, setCurrent] = useState(0);
  const isDark = useIsDark();

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
  // The arc runs through our own indigo, weak to strong, instead of the
  // red-amber-green of a warning light: the number is a state of protection,
  // and it should look like the brand rather than like an alarm. The verdict
  // pill takes the same tone at the same intensity, so the two read as one
  // object — the words still carry the verdict.
  // Indigo on light. On dark it inverts to gold: our indigo sits too close to
  // the near-black background to read at a glance, and amber is the warm
  // counterpart already used across the brand — bright end on dark, deep end on
  // light, so the strong colour is always the one with the most contrast.
  const PURPLE = ["#C7D2FE", "#A5B4FC", "#818CF8", "#6366F1", "#4F46E5", "#4338CA"] as const;
  const GOLD = ["#B45309", "#D97706", "#F59E0B", "#FBBF24", "#FCD34D", "#FDE68A"] as const;
  const ramp = isDark ? GOLD : PURPLE;
  const arcColor = ramp[Math.min(ramp.length - 1, Math.round(ratio * (ramp.length - 1)))];
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
        <defs>
          {/* Weak on the left, strong on the right: the arc itself shows the
              scale the score is climbing. */}
          <linearGradient id="gauge-priva-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={isDark ? "#B45309" : "#C7D2FE"} />
            <stop offset="55%" stopColor={isDark ? "#F59E0B" : "#818CF8"} />
            <stop offset="100%" stopColor={isDark ? "#FCD34D" : "#4338CA"} />
          </linearGradient>
          {/* Neon: the arc is redrawn blurred underneath itself, so the light
              spills onto the card instead of the stroke merely being brighter. */}
          <filter id="gauge-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="5" />
          </filter>
        </defs>
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
        {/* glow pass, solid mode only */}
        {!gradient && (
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke="url(#gauge-priva-grad)"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={arcLen}
            strokeDashoffset={offset}
            filter="url(#gauge-glow)"
            opacity="0.55"
          />
        )}
        {/* foreground arc — gradient mode draws the FULL green→red scale
            (speedometer); the needle indicates the score. Solid mode keeps the
            animated fill. */}
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={gradient ? "url(#gauge-risk-grad)" : "url(#gauge-priva-grad)"}
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
        <circle
          cx={nx}
          cy={ny}
          r="6"
          fill={gradient ? color : arcColor}
          stroke="white"
          strokeWidth="2"
        />
        {/* Speedometer mode: number lives INSIDE the svg (centered, bottom of the
            arc) so it scales with the gauge and never collides with the needle. */}
        {gradient && (
          <>
            <text
              x="100"
              y="86"
              textAnchor="middle"
              className="text-foreground"
              fill="currentColor"
              fontSize="34"
              fontWeight={800}
            >
              {Math.round(current)}
            </text>
            {showMax && (
              <text
                x="100"
                y="103"
                textAnchor="middle"
                className="text-muted-foreground"
                fill="currentColor"
                fontSize="12"
                fontWeight={600}
              >
                / {max}
              </text>
            )}
          </>
        )}
      </svg>
      {/* Pulled up into the arc: the number belongs inside the dial. */}
      {!gradient && (
        <div className="-mt-[68px] flex flex-col items-center">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-extrabold tracking-tight text-foreground">
              {Math.round(current)}
            </span>
            {showMax && <span className="text-sm font-medium text-muted-foreground">/{max}</span>}
          </div>
          {showLabel && (
            <span
              className="mt-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
              style={{ backgroundColor: `${arcColor}24`, color: arcColor }}
            >
              {label}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
