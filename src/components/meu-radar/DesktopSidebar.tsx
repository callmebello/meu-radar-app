import { Home, Shield, Users, User, Target } from "lucide-react";
import type { TabId } from "./BottomNav";
import { useIsDark } from "@/hooks/use-is-dark";

const NAV: { id: TabId; label: string; icon: typeof Home }[] = [
  { id: "radar", label: "Início", icon: Home },
  { id: "seguranca", label: "Segurança", icon: Shield },
  { id: "familia", label: "Família", icon: Users },
  { id: "perfil", label: "Perfil", icon: User },
];

/**
 * Desktop-only (lg+) left nav. Replaces the mobile bottom bar on wide screens.
 * Hidden below lg — mobile keeps the BottomNav, untouched.
 */
export function DesktopSidebar({
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
  const isDark = useIsDark();
  const logo = isDark ? "/PRIVA_logo_dark_theme.png" : "/PRIVA_logo_light_theme.png";

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-card px-4 py-6 lg:flex">
      <button onClick={() => onChange("radar")} aria-label="Início" className="mb-8 px-2 text-left transition-opacity hover:opacity-80">
        <img src={logo} alt="PRIVA" className="h-6 w-auto object-contain" />
      </button>

      <nav className="flex flex-col gap-1">
        {NAV.map((t) => {
          const isActive = active === t.id;
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-[var(--color-navy)]/10 text-[var(--color-navy)]"
                  : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.4 : 2} />
              {t.label}
            </button>
          );
        })}
      </nav>

      <button
        onClick={onScan}
        disabled={scanning}
        className="scan-breathe mt-6 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold text-white shadow-lg transition active:scale-[0.99] disabled:opacity-70"
        style={{ background: "radial-gradient(circle at center,#6366F1,#4F46E5)" }}
      >
        {scanning ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Analisando...
          </>
        ) : (
          <>
            <Target className="h-4 w-4" /> Scan Grátis
          </>
        )}
      </button>

      <p className="mt-auto px-2 pt-6 text-[11px] text-muted-foreground">© 2025 Priva · LGPD</p>
    </aside>
  );
}
