import { useEffect, useRef, useState } from "react";
import { Bell, AlertCircle, CheckCircle2, Plus, UserPlus, Users, Building2 } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { useIsDark } from "@/hooks/use-is-dark";

type Notif = { id: string; icon: "alert" | "check"; title: string; time: string; unread: boolean; level: "danger" | "success" };

// Real, widely-reported Brazilian data-leak headline (Serasa megavazamento, 2021).
const initial: Notif[] = [
  { id: "1", icon: "alert", title: "Megavazamento expôs CPF de 223 milhões de brasileiros", time: "Notícia · proteja seus dados", unread: true, level: "danger" },
];

export function AppHeader({
  title,
  subtitle,
  showBell = false,
}: {
  title: string;
  subtitle?: string;
  showBell?: boolean;
  showLogo?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [notifs, setNotifs] = useState(initial);
  const ref = useRef<HTMLDivElement>(null);
  const addRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifs.filter((n) => n.unread).length;
  const { goToTab, scanning, requestFamilyAdd } = useApp();
  const isDark = useIsDark();
  const logoSrc = isDark ? "/PRIVA_logo_dark_theme.png" : "/PRIVA_logo_light_theme.png";

  useEffect(() => {
    if (!open && !addOpen) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
      if (addRef.current && !addRef.current.contains(e.target as Node)) setAddOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open, addOpen]);

  const goFamily = (withAdd: boolean) => {
    setAddOpen(false);
    if (withAdd) requestFamilyAdd();
    goToTab("familia");
  };

  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between px-4 py-3"
      style={{
        position: "relative",
        backgroundColor: "var(--color-background)",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      {/* LEFT — Plus menu */}
      <div className="relative" ref={addRef}>
        <button
          onClick={() => setAddOpen((v) => !v)}
          aria-label="Adicionar"
          className="flex h-11 w-11 items-center justify-center text-foreground transition-opacity active:opacity-70"
        >
          <Plus size={22} strokeWidth={2} />
        </button>
        {addOpen && (
          <div className="absolute left-0 top-12 z-50 w-60 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-scale-in">
            <button onClick={() => goFamily(true)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-secondary/40 transition">
              <UserPlus className="h-4 w-4 text-[var(--color-navy)]" />
              <span className="text-sm font-medium text-foreground">Adicionar familiar</span>
            </button>
            <button onClick={() => goFamily(true)} className="flex w-full items-center gap-3 border-t border-border/60 px-4 py-3 text-left hover:bg-secondary/40 transition">
              <Users className="h-4 w-4 text-[var(--color-navy)]" />
              <span className="text-sm font-medium text-foreground">Adicionar outro membro</span>
            </button>
            <button onClick={() => goFamily(false)} className="flex w-full items-center gap-3 border-t border-border/60 px-4 py-3 text-left hover:bg-secondary/40 transition">
              <Building2 className="h-4 w-4 text-[var(--color-navy)]" />
              <span className="text-sm font-medium text-foreground">Para empresas</span>
            </button>
          </div>
        )}
      </div>

      {/* CENTER — wordmark logo / scanning indicator */}
      <div className="absolute left-1/2 flex -translate-x-1/2 items-center justify-center gap-2">
        {scanning ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-500/30 border-t-indigo-400" />
            <span className="text-sm font-medium text-indigo-300">Analisando...</span>
          </>
        ) : (
          <img src={logoSrc} alt="PRIVA" className="h-5 w-auto object-contain" />
        )}
      </div>

      {/* RIGHT — bell */}
      {showBell && (
        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="relative grid h-10 w-10 place-items-center rounded-full bg-secondary hover:bg-secondary/80 transition-all duration-200"
          >
            <Bell className="h-5 w-5 text-foreground" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 grid h-4 w-4 place-items-center rounded-full bg-[var(--color-danger)] text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>
          {open && (
            <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-border bg-card shadow-2xl animate-scale-in overflow-hidden">
              <div className="px-4 py-3 border-b border-border/60">
                <p className="text-sm font-bold text-foreground">Notificações</p>
              </div>
              <ul className="max-h-80 overflow-y-auto">
                {notifs.map((n) => {
                  const Icon = n.icon === "alert" ? AlertCircle : CheckCircle2;
                  const color = n.level === "danger" ? "var(--color-danger)" : "var(--color-success)";
                  return (
                    <li
                      key={n.id}
                      className="flex items-start gap-3 px-4 py-3 border-b border-border/60 last:border-0 hover:bg-secondary/40 transition"
                    >
                      <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color }} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-foreground leading-snug">{n.title}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{n.time}</p>
                      </div>
                      {n.unread && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[var(--color-teal)]" />}
                    </li>
                  );
                })}
              </ul>
              <button
                onClick={() => setNotifs((ns) => ns.map((n) => ({ ...n, unread: false })))}
                className="w-full border-t border-border/60 px-4 py-3 text-xs font-semibold text-[var(--color-teal)] hover:bg-secondary/40 transition"
              >
                Marcar todas como lidas
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
