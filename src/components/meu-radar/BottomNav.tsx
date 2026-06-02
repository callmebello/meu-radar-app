import { Radar, KeyRound, Users, Eye, User, TrendingUp } from "lucide-react";

export type TabId = "radar" | "credenciais" | "score" | "familia" | "darkweb" | "perfil";

const tabs: { id: TabId; label: string; icon: typeof Radar }[] = [
  { id: "radar", label: "Radar", icon: Radar },
  { id: "credenciais", label: "Cred.", icon: KeyRound },
  { id: "score", label: "Score", icon: TrendingUp },
  { id: "familia", label: "Família", icon: Users },
  { id: "darkweb", label: "Dark", icon: Eye },
  { id: "perfil", label: "Perfil", icon: User },
];

export function BottomNav({ active, onChange }: { active: TabId; onChange: (id: TabId) => void }) {
  return (
    <nav className="sticky bottom-0 z-20 border-t border-border/60 bg-background/90 px-1.5 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-xl">
      <ul className="flex items-center justify-between">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = active === t.id;
          return (
            <li key={t.id} className="flex-1">
              <button
                onClick={() => onChange(t.id)}
                className="group flex w-full flex-col items-center gap-1 rounded-lg py-1.5 transition"
              >
                <span className={`grid h-8 w-8 place-items-center rounded-xl transition ${isActive ? "bg-[var(--color-navy)] text-[var(--color-teal)]" : "text-muted-foreground"}`}>
                  <Icon className="h-[16px] w-[16px]" strokeWidth={isActive ? 2.4 : 2} />
                </span>
                <span className={`text-[10px] font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>{t.label}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
