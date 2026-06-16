import { useState } from "react";
import { AppHeader } from "../Header";
import { CredenciaisTab } from "./CredenciaisTab";
import { ScoreTab } from "./ScoreTab";
import { DarkWebTab } from "./DarkWebTab";
import { UpsellBanner, shouldShowUpsell } from "../UpsellBanner";
import { useApp } from "@/contexts/AppContext";

type Pill = "credenciais" | "score" | "darkweb";

const pills: { id: Pill; label: string }[] = [
  { id: "credenciais", label: "Credenciais" },
  { id: "score", label: "Score" },
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

      {/* Pill tabs */}
      <div className="flex gap-2 px-5 pt-4">
        {pills.map((p) => {
          const isActive = pill === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setPill(p.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                isActive ? "text-white" : "border text-gray-400 border-gray-700"
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
      {pill === "darkweb" && <DarkWebTab />}
    </>
  );
}
