import { useState } from "react";
import { Home, Shield, Users, User } from "lucide-react";

export type TabId = "radar" | "seguranca" | "familia" | "perfil";

const tabs: { id: TabId; label: string; icon: typeof Shield }[] = [
  { id: "radar", label: "Início", icon: Home },
  { id: "seguranca", label: "Segurança", icon: Shield },
  { id: "familia", label: "Família", icon: Users },
  { id: "perfil", label: "Perfil", icon: User },
];

function ScanIcon({ fast }: { fast: boolean }) {
  return (
    <svg width="34" height="34" viewBox="0 0 48 48" fill="none" aria-hidden>
      <circle cx="24" cy="24" r="8" stroke="white" strokeWidth="1.2" fill="none" />
      <circle cx="24" cy="24" r="16" stroke="white" strokeWidth="1.2" fill="none" opacity="0.7" />
      <circle cx="24" cy="24" r="22" stroke="white" strokeWidth="1.2" fill="none" opacity="0.4" />
      {/* sweep arm — STILL when idle, rotates only while scanning */}
      <g className={fast ? "radar-sweep-fast" : ""}>
        <line
          x1="24"
          y1="24"
          x2="40"
          y2="8"
          stroke="white"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </g>
      <circle cx="24" cy="24" r="2" fill="white" />
    </svg>
  );
}

function ScanButton({ onScan, scanning }: { onScan: () => void; scanning: boolean }) {
  const [popped, setPopped] = useState(false);

  const handleClick = () => {
    setPopped(true);
    setTimeout(() => setPopped(false), 300);
    onScan();
  };

  return (
    <li className="flex flex-1 flex-col items-center justify-center">
      <button
        onClick={handleClick}
        aria-label="Escanear identidade"
        className={`scan-breathe grid h-16 w-16 place-items-center rounded-full ${popped ? "animate-scan-pop" : ""} ${scanning ? "pointer-events-none" : ""}`}
        style={{
          marginTop: -16,
          background: "radial-gradient(circle at center, #6366F1, #4F46E5)",
          border: "2px solid rgba(255,255,255,0.15)",
        }}
      >
        {scanning ? (
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          <ScanIcon fast={false} />
        )}
      </button>
      <span className="-mt-0.5 text-[10px] font-medium text-foreground">Scan Grátis</span>
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
