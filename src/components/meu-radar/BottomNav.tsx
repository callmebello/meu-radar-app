import type React from "react";
import { useEffect, useRef, useState } from "react";
import { Home, User } from "lucide-react";
import { ShieldPlain, MagnifierPlain } from "./NavIcons";

// `familia` and `incidente` stay valid destinations (reached from Perfil and
// Proteção), they are just not bar items.
export type TabId = "radar" | "protecao" | "familia" | "perfil" | "atividade" | "incidente";

const tabs: {
  id: TabId;
  label: string;
  icon: React.ComponentType<{
    size?: number;
    className?: string;
    strokeWidth?: number;
    style?: React.CSSProperties;
  }>;
}[] = [
  { id: "radar", label: "Início", icon: Home },
  { id: "protecao", label: "Proteção", icon: ShieldPlain },
  { id: "atividade", label: "Atividade", icon: MagnifierPlain },
  { id: "perfil", label: "Perfil", icon: User },
];

/** Length of the 1.5-turn sweep. Must match the nav-sweep keyframe in styles.css. */
const SWEEP_MS = 750;

/**
 * Center action: the Priva mark on a raised white disc.
 *
 * Tapping it sweeps a radar line a full 360° around the mark first, then hands
 * off to onScan — the app visibly "looks" before asking for anything, so the
 * sheet that follows feels like a result of the action rather than a pop-up.
 * The same rings keep pulsing while a real scan is in flight.
 */
function ScanButton({ onScan, scanning }: { onScan: () => void; scanning: boolean }) {
  const [sweeping, setSweeping] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const handleClick = () => {
    if (sweeping || scanning) return;
    setSweeping(true);
    timer.current = setTimeout(() => {
      setSweeping(false);
      onScan();
    }, SWEEP_MS);
  };

  const busy = sweeping || scanning;

  return (
    <li className="relative flex flex-1 flex-col items-center justify-center">
      {busy && (
        <span className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2" aria-hidden>
          <span className="nav-ring" />
          <span className="nav-ring nav-ring-2" />
          <span className="nav-ring nav-ring-3" />
        </span>
      )}
      <button
        onClick={handleClick}
        aria-label="Escanear meus dados"
        className={`relative grid h-16 w-16 place-items-center overflow-hidden rounded-full transition active:scale-95 ${busy ? "pointer-events-none" : ""}`}
        style={{
          marginTop: -16,
          // White disc in both themes: the mark is indigo-on-light, so it needs
          // a light ground to stay legible over the dark bar.
          background: "#FFFFFF",
          boxShadow: "0 6px 20px rgba(79,70,229,0.28), 0 0 0 6px var(--color-card)",
        }}
      >
        {busy && <span className="nav-sweep" aria-hidden />}
        <img src="/PRIVA_mark.png" alt="" className="relative h-11 w-11 object-contain" />
      </button>
    </li>
  );
}

export function BottomNav({
  active,
  onChange,
  onScan,
  scanning,
}: {
  active: TabId;
  onChange: (id: TabId) => void;
  onScan: () => void;
  scanning: boolean;
}) {
  const left = tabs.slice(0, 2);
  const right = tabs.slice(2);

  const renderTab = (t: (typeof tabs)[number]) => {
    const Icon = t.icon;
    const isActive = active === t.id;
    const color = isActive ? "var(--color-foreground)" : "var(--color-muted-foreground)";
    return (
      <li key={t.id} className="flex-1">
        <button
          onClick={() => onChange(t.id)}
          className="flex w-full flex-col items-center gap-1 py-1.5"
        >
          <Icon size={22} style={{ color }} strokeWidth={isActive ? 2.2 : 2} />
          <span className="text-[11px]" style={{ color, fontWeight: isActive ? 500 : 400 }}>
            {t.label}
          </span>
          <span
            className="h-1 w-1 rounded-full"
            style={{ backgroundColor: isActive ? "#4F46E5" : "transparent" }}
          />
        </button>
      </li>
    );
  };

  return (
    <nav
      className="sticky bottom-0 z-50 lg:hidden"
      style={{
        background: "var(--color-card)",
        borderTop: "1px solid var(--color-border)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <ul className="flex items-center justify-around" style={{ height: 72 }}>
        {left.map(renderTab)}
        <ScanButton onScan={onScan} scanning={scanning} />
        {right.map(renderTab)}
      </ul>
    </nav>
  );
}
