import { Home, Shield, Activity, User } from "lucide-react";

// `familia` and `incidente` stay valid destinations (reached from Perfil and
// Proteção), they are just not bar items.
export type TabId = "radar" | "protecao" | "familia" | "perfil" | "atividade" | "incidente";

const tabs: { id: TabId; label: string; icon: typeof Shield }[] = [
  { id: "radar", label: "Início", icon: Home },
  { id: "protecao", label: "Proteção", icon: Shield },
  { id: "atividade", label: "Atividade", icon: Activity },
  { id: "perfil", label: "Perfil", icon: User },
];

/**
 * Center action: the Priva mark on a raised white disc. While a scan runs,
 * radar rings expand out of it — the brand doing its one job, instead of a
 * generic spinner.
 */
function ScanButton({ onScan, scanning }: { onScan: () => void; scanning: boolean }) {
  return (
    <li className="relative flex flex-1 flex-col items-center justify-center">
      {scanning && (
        <span className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2" aria-hidden>
          <span className="nav-ring" />
          <span className="nav-ring nav-ring-2" />
          <span className="nav-ring nav-ring-3" />
        </span>
      )}
      <button
        onClick={onScan}
        aria-label="Escanear meus dados"
        className={`relative grid h-16 w-16 place-items-center rounded-full transition active:scale-95 ${scanning ? "pointer-events-none" : ""}`}
        style={{
          marginTop: -16,
          // White disc in both themes: the mark is indigo-on-light, so it needs
          // a light ground to stay legible over the dark bar.
          background: "#FFFFFF",
          boxShadow: "0 6px 20px rgba(79,70,229,0.28), 0 0 0 6px var(--color-card)",
        }}
      >
        <img src="/PRIVA_mark.png" alt="" className="h-11 w-11 object-contain" />
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
