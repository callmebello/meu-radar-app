import { useState } from "react";
import { LifeBuoy, ChevronRight } from "lucide-react";
import { AppHeader } from "../Header";
import { CredenciaisTab } from "./CredenciaisTab";
import { ContasTab } from "./ContasTab";
import { DarkWebTab } from "./DarkWebTab";
import { DarkWebScanTab } from "./DarkWebScanTab";
import { UpsellBanner, shouldShowUpsell } from "../UpsellBanner";
import { useApp } from "@/contexts/AppContext";

type Pill = "credenciais" | "contas" | "exposicao" | "darkweb";

const pills: { id: Pill; label: string }[] = [
  { id: "credenciais", label: "Senhas" },
  // "Contas" replaced the credit-score panel, which was an honest but empty
  // "em breve" occupying a quarter of the navigation. This slot now holds
  // something built from data we already have.
  { id: "contas", label: "Contas" },
  { id: "exposicao", label: "Vazamentos" },
  { id: "darkweb", label: "Dark Web" },
];

export function ProtecaoTab({ initial = "credenciais" }: { initial?: Pill }) {
  const [pill, setPill] = useState<Pill>(initial);
  const { isPremium, goToTab } = useApp();

  return (
    <>
      <AppHeader title="Proteção" showBell />

      {shouldShowUpsell(isPremium) && (
        <div className="px-5 pt-4">
          <UpsellBanner />
        </div>
      )}

      {/* Segmented control — the everyday tools sit in the noble area, up top. */}
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
      {pill === "contas" && <ContasTab />}
      {pill === "exposicao" && <DarkWebTab />}
      {pill === "darkweb" && <DarkWebScanTab />}

      {/* Incident Mode entry — pushed to the bottom: it's the "if something bad
          happened" escape hatch, rarely used, so it stays out of the noble area
          but is findable while browsing Proteção. */}
      <div className="px-5 pb-6 pt-2">
        <button
          onClick={() => goToTab("incidente")}
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
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </div>
    </>
  );
}
