// Animated "Live Map" — geographically accurate Brazil with pulsing threat points.
import { BRAZIL_PATH } from "./brazilPath";

const PURPLE = "#8B5CF6";

// Decorative network nodes, positioned as % of the container (inside Brazil).
const NODES: { x: number; y: number; bright?: boolean }[] = [
  { x: 34, y: 28 }, { x: 46, y: 22, bright: true }, { x: 56, y: 30 },
  { x: 70, y: 33, bright: true }, { x: 76, y: 43 }, { x: 50, y: 40 },
  { x: 42, y: 50 }, { x: 58, y: 48, bright: true }, { x: 64, y: 60 },
  { x: 52, y: 64 }, { x: 46, y: 74 }, { x: 56, y: 76, bright: true },
];

function ThreatDot({ color }: { color: string }) {
  return (
    <span className="relative flex h-3 w-3 -translate-x-1/2 -translate-y-1/2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ backgroundColor: color }} />
      <span className="relative inline-flex h-3 w-3 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />
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
      <div className="relative mx-auto w-full" style={{ maxWidth: 340, aspectRatio: "1 / 1" }}>
        {/* Brazil silhouette */}
        <svg viewBox="0 0 1024 1024" fill="none" className="absolute inset-0 h-full w-full">
          <defs>
            <radialGradient id="brfill" cx="52%" cy="42%" r="62%">
              <stop offset="0%" stopColor="rgba(139,92,246,0.30)" />
              <stop offset="100%" stopColor="rgba(139,92,246,0.05)" />
            </radialGradient>
            <filter id="brglow" x="-15%" y="-15%" width="130%" height="130%">
              <feGaussianBlur stdDeviation="6" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <g transform="translate(0,1024) scale(0.1,-0.1)">
            <path d={BRAZIL_PATH} fill="url(#brfill)" stroke={PURPLE} strokeWidth="14" filter="url(#brglow)" opacity="0.92" />
          </g>
        </svg>

        {/* Decorative network dots */}
        {NODES.map((n, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${n.x}%`,
              top: `${n.y}%`,
              width: n.bright ? 6 : 4,
              height: n.bright ? 6 : 4,
              marginLeft: n.bright ? -3 : -2,
              marginTop: n.bright ? -3 : -2,
              backgroundColor: n.bright ? "#C4B5FD" : "rgba(167,139,250,0.55)",
              boxShadow: n.bright ? "0 0 8px #A78BFA" : undefined,
              animation: n.bright ? `pulse-dot 2.4s ease-in-out ${i * 0.3}s infinite` : undefined,
            }}
          />
        ))}

        {/* Big radar pulse (Rio de Janeiro) */}
        <div className="absolute" style={{ left: "62%", top: "72%" }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="absolute animate-ping rounded-full"
              style={{
                width: 64, height: 64, marginLeft: -32, marginTop: -32,
                border: "1px solid rgba(139,92,246,0.5)",
                animationDelay: `${i * 0.7}s`, animationDuration: "2.4s",
              }}
            />
          ))}
          <span className="absolute h-3.5 w-3.5 rounded-full" style={{ marginLeft: -7, marginTop: -7, backgroundColor: "#fff", boxShadow: "0 0 18px #8B5CF6" }} />
        </div>

        {/* Pulsing threat dots */}
        <div className="absolute" style={{ left: "66%", top: "30%" }}>
          <ThreatDot color="#22C55E" />
        </div>
        <div className="absolute" style={{ left: "44%", top: "58%" }}>
          <ThreatDot color="#F59E0B" />
        </div>

        {/* Tooltip cards */}
        <div className="absolute" style={{ top: "0%", right: "0%" }}>
          <Tooltip color="#22C55E" title="Exposição encontrada" place="Rio Grande do Sul" />
        </div>
        <div className="absolute" style={{ top: "44%", left: "0%" }}>
          <Tooltip color="#F59E0B" title="Risco médio" place="São Paulo" />
        </div>
        <div className="absolute" style={{ bottom: "8%", right: "0%" }}>
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
