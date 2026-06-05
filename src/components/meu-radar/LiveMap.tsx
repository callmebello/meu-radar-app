// Animated "Live Map" — accurate Brazil with a central radar scan (Brasília) + pulsing points.
import { BRAZIL_PATH } from "./brazilPath";

const PURPLE = "#8B5CF6";

// Decorative network nodes (% of container, inside Brazil).
const NODES: { x: number; y: number; bright?: boolean }[] = [
  { x: 34, y: 28 }, { x: 46, y: 22, bright: true }, { x: 56, y: 30 },
  { x: 70, y: 33, bright: true }, { x: 76, y: 43 }, { x: 42, y: 50 },
  { x: 64, y: 60 }, { x: 52, y: 64 }, { x: 46, y: 74 },
];

// Pulsing "exposure" points (no labels — just the converting visual).
const POINTS: { x: number; y: number; color: string }[] = [
  { x: 66, y: 30, color: "#22C55E" },
  { x: 44, y: 58, color: "#F59E0B" },
  { x: 62, y: 70, color: "#EF4444" },
];

function PulseDot({ x, y, color }: { x: number; y: number; color: string }) {
  return (
    <span className="absolute" style={{ left: `${x}%`, top: `${y}%` }}>
      <span className="relative flex h-3 w-3 -translate-x-1/2 -translate-y-1/2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ backgroundColor: color }} />
        <span className="relative inline-flex h-3 w-3 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />
      </span>
    </span>
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
              left: `${n.x}%`, top: `${n.y}%`,
              width: n.bright ? 6 : 4, height: n.bright ? 6 : 4,
              marginLeft: n.bright ? -3 : -2, marginTop: n.bright ? -3 : -2,
              backgroundColor: n.bright ? "#C4B5FD" : "rgba(167,139,250,0.55)",
              boxShadow: n.bright ? "0 0 8px #A78BFA" : undefined,
              animation: n.bright ? `pulse-dot 2.4s ease-in-out ${i * 0.3}s infinite` : undefined,
            }}
          />
        ))}

        {/* Central radar scan over Brasília — sized as % so it scales with the
            map and never spills outside its area. */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full"
          style={{ left: "52%", top: "50%", width: "50%", aspectRatio: "1 / 1" }}
        >
          {/* concentric rings */}
          {["100%", "66%", "36%"].map((s, i) => (
            <span
              key={i}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ width: s, height: s, border: "1px solid rgba(139,92,246,0.28)" }}
            />
          ))}
          {/* rotating sweep wedge (360° loop) */}
          <span
            className="radar-sweep absolute inset-0 rounded-full"
            style={{ background: "conic-gradient(from 0deg, rgba(139,92,246,0.55), rgba(139,92,246,0) 75deg)" }}
          />
          {/* blinking core */}
          <span className="absolute left-1/2 top-1/2 flex h-3 w-3 -translate-x-1/2 -translate-y-1/2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-80" style={{ backgroundColor: "#C4B5FD" }} />
            <span className="relative inline-flex h-3 w-3 rounded-full" style={{ backgroundColor: "#fff", boxShadow: "0 0 16px #8B5CF6" }} />
          </span>
        </div>

        {/* Pulsing exposure points (no labels) */}
        {POINTS.map((p, i) => (
          <PulseDot key={i} x={p.x} y={p.y} color={p.color} />
        ))}
      </div>

      {/* Live indicator — centered under the map, single line */}
      <div className="mt-3 flex items-center justify-center gap-2 whitespace-nowrap">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
        </span>
        <span className="text-[11px] font-medium text-gray-300">Live Map · Atualizando agora</span>
      </div>
    </div>
  );
}
