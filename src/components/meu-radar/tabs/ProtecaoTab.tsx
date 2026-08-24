import { useState } from "react";
import { LifeBuoy, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { AppHeader } from "../Header";
import { CredenciaisTab } from "./CredenciaisTab";
import { ScoreTab } from "./ScoreTab";
import { DarkWebTab } from "./DarkWebTab";
import { DarkWebScanTab } from "./DarkWebScanTab";
import { UpsellBanner, shouldShowUpsell } from "../UpsellBanner";
import { useApp } from "@/contexts/AppContext";

type Pill = "credenciais" | "score" | "exposicao" | "darkweb";

const pills: { id: Pill; label: string }[] = [
  { id: "credenciais", label: "Senhas" },
  { id: "score", label: "Score" },
  { id: "exposicao", label: "Vazamentos" },
  { id: "darkweb", label: "Dark Web" },
];

export function ProtecaoTab({ initial = "credenciais" }: { initial?: Pill }) {
  const [pill, setPill] = useState<Pill>(initial);
  const { isPremium } = useApp();

  return (
    <>
      <AppHeader title="Proteção" showBell />

      {shouldShowUpsell(isPremium) && (
        <div className="px-5 pt-4">
          <UpsellBanner />
        </div>
      )}

      {/* Incident Mode signpost — full flow lands in its own phase. Kept here as
          the "found while browsing" entry point the map calls for. */}
      <div className="px-5 pt-4">
        <button
          onClick={() => toast("Modo Incidente chega em breve.")}
          className="flex w-full items-center gap-3 rounded-2xl border border-[var(--color-danger)]/25 bg-[var(--color-danger)]/5 px-4 py-3.5 text-left transition active:scale-[0.99]"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--color-danger)]/12">
            <LifeBuoy className="h-5 w-5 text-[var(--color-danger)]" strokeWidth={1.9} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-bold text-foreground">
              Se algo já aconteceu
            </span>
            <span className="block text-[12px] text-muted-foreground">
              Golpe, roubo, perda do celular ou senha vazada
            </span>
          </span>
          <span className="shrink-0 rounded-full bg-[var(--color-danger)]/12 px-2 py-0.5 text-[10px] font-bold text-[var(--color-danger)]">
            Em breve
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </div>

      {/* Segmented control — all options fit in one row */}
      <div className="mx-5 mt-4 flex gap-1 rounded-full border border-border bg-secondary/40 p-1">
        {pills.map((p) => {
          const isActive = pill === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setPill(p.id)}
              className={`flex-1 rounded-full px-1 py-1.5 text-[13px] font-medium transition ${
                isActive ? "text-white" : "text-muted-foreground"
              }`}
              style={isActive ? { backgroundColor: "#4F46E5" } : undefined}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {pill === "credenciais" && <CredenciaisTab />}
      {pill === "score" && <ScoreTab />}
      {pill === "exposicao" && <DarkWebTab />}
      {pill === "darkweb" && <DarkWebScanTab />}
    </>
  );
}
