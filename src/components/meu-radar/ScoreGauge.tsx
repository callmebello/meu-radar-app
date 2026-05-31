interface Props { score: number; label: string; }

export function ScoreGauge({ score, label }: Props) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? "var(--color-success)" : score >= 50 ? "var(--color-warning)" : "var(--color-danger)";

  return (
    <div className="relative flex items-center justify-center">
      <svg width="180" height="180" className="-rotate-90">
        <circle cx="90" cy="90" r={radius} stroke="var(--color-muted)" strokeWidth="12" fill="none" />
        <circle
          cx="90" cy="90" r={radius}
          stroke={color}
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease-out" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-5xl font-extrabold tracking-tight text-foreground">{score}</span>
        <span className="text-xs font-medium text-muted-foreground">de 100</span>
        <span className="mt-1 text-[10px] font-bold uppercase tracking-wider" style={{ color }}>{label}</span>
      </div>
    </div>
  );
}
