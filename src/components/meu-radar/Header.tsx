import { useEffect, useRef, useState } from "react";
import { Bell, AlertCircle, CheckCircle2 } from "lucide-react";
import { PrivaLogo } from "@/components/meu-radar/PrivaLogo";
import { useApp } from "@/contexts/AppContext";

type Notif = { id: string; icon: "alert" | "check"; title: string; time: string; unread: boolean; level: "danger" | "success" };

const initial: Notif[] = [
  { id: "1", icon: "alert", title: "Novo vazamento — Fórum HackBR", time: "agora mesmo", unread: true, level: "danger" },
  { id: "2", icon: "alert", title: "Credencial comprometida — Gmail", time: "2h atrás", unread: true, level: "danger" },
  { id: "3", icon: "check", title: "Varredura dark web concluída", time: "3 dias atrás", unread: false, level: "success" },
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
  const [notifs, setNotifs] = useState(initial);
  const ref = useRef<HTMLDivElement>(null);
  const unreadCount = notifs.filter((n) => n.unread).length;
  const { goToTab } = useApp();

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border/60 bg-background/80 px-4 pt-4 pb-3 backdrop-blur-xl sm:px-5 sm:pt-5 sm:pb-4">
      <div className="flex min-w-0 items-center gap-3">
        <PrivaLogo
          size={36}
          showWordmark={false}
          onClick={() => goToTab("radar")}
          ariaLabel="Priva — ir para o início"
        />
        <div className="min-w-0">
          <h1 className="truncate text-base font-bold tracking-tight text-foreground sm:text-lg">{title}</h1>
          {subtitle && <p className="truncate text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
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
