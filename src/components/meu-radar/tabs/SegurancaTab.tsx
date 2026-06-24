import { useState } from "react";
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

export function SegurancaTab({ initial = "credenciais" }: { initial?: Pill }) {
  const [pill, setPill] = useState<Pill>(initial);
  const { isPremium } = useApp();

  return (
    <>
      <AppHeader title="Segurança" showBell />

      {shouldShowUpsell(isPremium) && (
        <div className="px-5 pt-4">
          <UpsellBanner />
        </div>
      )}

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
