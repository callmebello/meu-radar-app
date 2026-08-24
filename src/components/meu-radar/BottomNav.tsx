import { Home, Shield, Activity, User, Plus } from "lucide-react";

// `familia` stays a valid destination (reached from Perfil), it is just no
// longer a bar item. `atividade` is new. Renamed `seguranca` → `protecao`.
export type TabId = "radar" | "protecao" | "familia" | "perfil" | "atividade" | "incidente";

// The four bar tabs. The center is the `+` action sheet, not a tab.
const tabs: { id: TabId; label: string; icon: typeof Shield }[] = [
  { id: "radar", label: "Início", icon: Home },
  { id: "protecao", label: "Proteção", icon: Shield },
  { id: "atividade", label: "Atividade", icon: Activity },
  { id: "perfil", label: "Perfil", icon: User },
];

// Center action = start a scan directly (the old behaviour). No label, no sheet:
// the scan is the only action for now, so a menu would be one tap of overhead
// for nothing. When Pix/link/etc. exist, this can grow back into a sheet.
function ScanButton({ onScan, scanning }: { onScan: () => void; scanning: boolean }) {
  return (
    <li className="flex flex-1 flex-col items-center justify-center">
      <button
        onClick={onScan}
        aria-label="Escanear meus dados"
        className={`grid h-16 w-16 place-items-center rounded-full transition active:scale-95 ${scanning ? "pointer-events-none" : ""}`}
        style={{
          marginTop: -16,
          background: "radial-gradient(circle at center, #6366F1, #4F46E5)",
          border: "2px solid rgba(255,255,255,0.15)",
        }}
      >
        {scanning ? (
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          <Plus className="h-8 w-8 text-white" strokeWidth={2.4} />
        )}
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
