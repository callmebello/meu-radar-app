// Animated "Live Map" — stylized Brazil network with pulsing threat points.
// Pure SVG + CSS, no external assets.

const NODES: { x: number; y: number; bright?: boolean }[] = [
  { x: 120, y: 90 }, { x: 160, y: 100, bright: true }, { x: 200, y: 110 },
  { x: 150, y: 140 }, { x: 190, y: 150, bright: true }, { x: 110, y: 150 },
  { x: 232, y: 128 }, { x: 170, y: 180 }, { x: 130, y: 200 },
  { x: 210, y: 190 }, { x: 150, y: 220 }, { x: 190, y: 232 },
  { x: 120, y: 240, bright: true }, { x: 170, y: 262, bright: true },
  { x: 205, y: 262 }, { x: 160, y: 300 },
];

const LINES: [number, number, number, number][] = [
  [120, 90, 160, 100], [160, 100, 200, 110], [150, 140, 190, 150],
  [190, 150, 232, 128], [170, 180, 210, 190], [130, 200, 150, 220],
  [150, 220, 190, 232], [170, 262, 205, 262], [170, 180, 170, 262],
  [190, 150, 170, 180],
];

const PURPLE = "#8B5CF6";

function ThreatDot({ color }: { color: string }) {
  return (
    <span className="relative flex h-3 w-3 -translate-x-1/2 -translate-y-1/2">
      <span
        className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
        style={{ backgroundColor: color }}
      />
      <span
        className="relative inline-flex h-3 w-3 rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
      />
    </span>
  );
}

function Tooltip({ color, title, place }: { color: string; title: string; place: string }) {
  return (
    <div
      className="flex items-center gap-2 rounded-xl px-3 py-2 shadow-lg backdrop-blur-sm"
      style={{ backgroundColor: "rgba(13,13,23,0.92)", border: "1px solid rgba(255,255,255,0.08)" }}
    >
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <div className="whitespace-nowrap">
        <p className="text-[11px] font-semibold leading-tight text-white">{title}</p>
        <p className="text-[10px] leading-tight text-gray-400">{place}</p>
      </div>
    </div>
  );
}

export function LiveMap() {
  return (
    <div className="w-full">
      <div className="relative w-full" style={{ aspectRatio: "1 / 1.05" }}>
        {/* Brazil silhouette + network */}
        <svg viewBox="0 0 320 360" fill="none" className="absolute inset-0 h-full w-full">
          <defs>
            <radialGradient id="brfill" cx="55%" cy="45%" r="65%">
              <stop offset="0%" stopColor="rgba(139,92,246,0.22)" />
              <stop offset="100%" stopColor="rgba(139,92,246,0.04)" />
            </radialGradient>
            <filter id="brglow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <path
            d="M86 96 C70 86 78 60 100 56 C120 44 140 52 150 70 C175 64 205 70 232 92 C258 96 286 110 292 134 C298 150 288 166 270 176 C264 200 258 226 244 250 C228 286 206 320 184 336 C172 344 158 338 154 322 C146 300 128 286 112 268 C92 246 74 230 80 200 C76 170 74 130 86 96 Z"
            fill="url(#brfill)"
            stroke={PURPLE}
            strokeWidth="1.5"
            filter="url(#brglow)"
            opacity="0.9"
          />

          {LINES.map(([x1, y1, x2, y2], i) => (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={PURPLE} strokeWidth="0.6" opacity="0.35" />
          ))}

          {NODES.map((n, i) => (
            <circle
              key={i}
              cx={n.x}
              cy={n.y}
              r={n.bright ? 2.6 : 1.6}
              fill={n.bright ? "#C4B5FD" : "rgba(167,139,250,0.55)"}
              filter={n.bright ? "url(#brglow)" : undefined}
            >
              {n.bright && (
                <animate attributeName="opacity" values="0.5;1;0.5" dur="2.4s" repeatCount="indefinite" begin={`${i * 0.3}s`} />
              )}
            </circle>
          ))}
        </svg>

        {/* Big radar pulse (Rio de Janeiro) */}
        <div className="absolute" style={{ left: "66%", top: "76%" }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="absolute animate-ping rounded-full"
              style={{
                width: 64,
                height: 64,
                marginLeft: -32,
                marginTop: -32,
                border: "1px solid rgba(139,92,246,0.5)",
                animationDelay: `${i * 0.7}s`,
                animationDuration: "2.4s",
              }}
            />
          ))}
          <span
            className="absolute h-3.5 w-3.5 rounded-full"
            style={{ marginLeft: -7, marginTop: -7, backgroundColor: "#fff", boxShadow: "0 0 18px #8B5CF6" }}
          />
        </div>

        {/* Pulsing threat dots */}
        <div className="absolute" style={{ left: "66%", top: "33%" }}>
          <ThreatDot color="#22C55E" />
        </div>
        <div className="absolute" style={{ left: "44%", top: "58%" }}>
          <ThreatDot color="#F59E0B" />
        </div>

        {/* Tooltip cards (kept within the map bounds so they never clip) */}
        <div className="absolute" style={{ top: "0%", right: "0%" }}>
          <Tooltip color="#22C55E" title="Exposição encontrada" place="Rio Grande do Sul" />
        </div>
        <div className="absolute" style={{ top: "46%", left: "0%" }}>
          <Tooltip color="#F59E0B" title="Risco médio" place="São Paulo" />
        </div>
        <div className="absolute" style={{ bottom: "5%", right: "0%" }}>
          <Tooltip color="#EF4444" title="Alto risco" place="Rio de Janeiro" />
        </div>
      </div>

      {/* Live indicator */}
      <div className="mt-3 flex items-center justify-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
        </span>
        <span className="text-xs font-medium text-gray-300">Live Map · Atualizando agora</span>
      </div>
    </div>
  );
}
