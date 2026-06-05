// Animated "Live Map" — accurate Brazil with a radar scan clipped to the country
// shape (sweep never leaves the border) + blinking exposure points.
import { BRAZIL_PATH } from "./brazilPath";

const PURPLE = "#8B5CF6";
const CX = 530;
const CY = 520;

// Decorative network nodes (% of container, inside Brazil).
const NODES: { x: number; y: number; bright?: boolean }[] = [
  { x: 34, y: 28 }, { x: 46, y: 22, bright: true }, { x: 56, y: 30 },
  { x: 70, y: 33, bright: true }, { x: 76, y: 43 }, { x: 42, y: 50 },
  { x: 64, y: 60 }, { x: 52, y: 64 }, { x: 46, y: 74 },
];

// Blinking "exposure" points (no labels).
const POINTS: { x: number; y: number; color: string }[] = [
  { x: 66, y: 30, color: "#22C55E" },
  { x: 44, y: 58, color: "#F59E0B" },
  { x: 62, y: 70, color: "#EF4444" },
];

function PulseDot({ x, y, color, size = 12, delay = 0 }: { x: number; y: number; color: string; size?: number; delay?: number }) {
  return (
    <span className="absolute" style={{ left: `${x}%`, top: `${y}%` }}>
      <span className="relative flex -translate-x-1/2 -translate-y-1/2" style={{ width: size, height: size }}>
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-80" style={{ backgroundColor: color, animationDelay: `${delay}ms` }} />
        <span className="relative inline-flex rounded-full" style={{ width: size, height: size, backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />
      </span>
    </span>
  );
}

export function LiveMap() {
  return (
    <div className="w-full">
      <div className="relative mx-auto w-full" style={{ maxWidth: 340, aspectRatio: "1 / 1" }}>
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
            {/* clip everything to the Brazil shape */}
            <clipPath id="brclip">
              <path d={BRAZIL_PATH} transform="translate(0,1024) scale(0.1,-0.1)" />
            </clipPath>
          </defs>

          {/* Brazil silhouette */}
          <g transform="translate(0,1024) scale(0.1,-0.1)">
            <path d={BRAZIL_PATH} fill="url(#brfill)" stroke={PURPLE} strokeWidth="14" filter="url(#brglow)" opacity="0.92" />
          </g>

          {/* Radar — clipped to Brazil so the 360° sweep stays inside the border */}
          <g clipPath="url(#brclip)">
            <circle cx={CX} cy={CY} r="160" fill="none" stroke="rgba(139,92,246,0.28)" strokeWidth="2" />
            <circle cx={CX} cy={CY} r="320" fill="none" stroke="rgba(139,92,246,0.22)" strokeWidth="2" />
            <circle cx={CX} cy={CY} r="480" fill="none" stroke="rgba(139,92,246,0.16)" strokeWidth="2" />
            <g>
              <path d={`M${CX} ${CY} L${CX} ${CY - 640} A 640 640 0 0 1 ${CX + 601} ${CY - 219} Z`} fill="rgba(139,92,246,0.32)" />
              <line x1={CX} y1={CY} x2={CX} y2={CY - 640} stroke="rgba(196,181,253,0.85)" strokeWidth="3" />
              <animateTransform attributeName="transform" type="rotate" from={`0 ${CX} ${CY}`} to={`360 ${CX} ${CY}`} dur="3s" repeatCount="indefinite" />
            </g>
          </g>
        </svg>

        {/* Decorative network dots — hidden on mobile */}
        {NODES.map((n, i) => (
          <span
            key={i}
            className="absolute hidden rounded-full sm:block"
            style={{
              left: `${n.x}%`, top: `${n.y}%`,
              width: n.bright ? 6 : 4, height: n.bright ? 6 : 4,
              marginLeft: n.bright ? -3 : -2, marginTop: n.bright ? -3 : -2,
              backgroundColor: n.bright ? "#C4B5FD" : "rgba(167,139,250,0.55)",
              boxShadow: n.bright ? "0 0 8px #A78BFA" : undefined,
              animation: n.bright ? `pulse-dot 2s ease-in-out ${i * 0.3}s infinite` : undefined,
            }}
          />
        ))}

        {/* Blinking exposure points (new) */}
        {POINTS.map((p, i) => (
          <PulseDot key={i} x={p.x} y={p.y} color={p.color} delay={i * 400} />
        ))}
      </div>

      {/* Live indicator */}
      <div className="mt-3 flex items-center justify-center gap-2 whitespace-nowrap">
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
        </span>
        <span className="text-[11px] font-medium text-gray-300">Atualizado agora</span>
      </div>
    </div>
  );
}
