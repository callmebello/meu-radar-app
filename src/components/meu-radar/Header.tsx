import { Bell } from "lucide-react";
import logo from "@/assets/logo.png";

export function AppHeader({ title, subtitle, showBell = false, showLogo = false }: { title: string; subtitle?: string; showBell?: boolean; showLogo?: boolean }) {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border/60 bg-background/80 px-5 pt-5 pb-4 backdrop-blur-xl">
      <div className="flex items-center gap-2.5">
        {showLogo && <img src={logo} alt="Meu Radar" className="h-9 w-9 object-contain" />}
        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {showBell && (
        <button className="relative grid h-10 w-10 place-items-center rounded-full bg-secondary hover:bg-secondary/80 transition">
          <Bell className="h-5 w-5 text-foreground" />
          <span className="absolute top-1.5 right-1.5 grid h-4 w-4 place-items-center rounded-full bg-[var(--color-danger)] text-[10px] font-bold text-white">3</span>
        </button>
      )}
    </header>
  );
}
