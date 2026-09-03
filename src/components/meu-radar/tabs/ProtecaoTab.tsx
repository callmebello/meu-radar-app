import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { IncidentMark } from "../IncidentMark";
import { AppHeader } from "../Header";
import { CredenciaisTab } from "./CredenciaisTab";
import { ExposicaoTab } from "./ExposicaoTab";
import { VazamentosTab } from "./VazamentosTab";
import { RemocaoTab } from "./RemocaoTab";
import { useApp } from "@/contexts/AppContext";

type Pill = "credenciais" | "vazamentos" | "exposicao" | "remocao";

const pills: { id: Pill; label: string }[] = [
  { id: "credenciais", label: "Senhas" },
  // Renamed to match what each panel actually holds. "Vazamentos" used to show
  // public web results while the real breach list sat behind the paywall in
  // "Dark Web" — someone looking for their leaks found the wrong panel, and was
  // then asked to pay for data their free scan had already fetched.
  { id: "vazamentos", label: "Vazamentos" },
  { id: "exposicao", label: "Exposição" },
  { id: "remocao", label: "Remoção" },
];

export function ProtecaoTab({ initial = "credenciais" }: { initial?: Pill }) {
  const { isPremium, goToTab, protecaoPill, setProtecaoPill } = useApp();
  // The home can route straight to a panel ("Trocar a senha do Canva" lands on
  // Vazamentos, not on whatever pill happened to be open).
  const [pill, setPill] = useState<Pill>((protecaoPill as Pill) || initial);
  useEffect(() => {
    if (protecaoPill) {
      setPill(protecaoPill as Pill);
      setProtecaoPill(null);
    }
  }, [protecaoPill, setProtecaoPill]);

  return (
    <>
      <AppHeader title="Proteção" showBell />

      {/* Segmented control — the everyday tools sit in the noble area, up top. */}
      {/* Scrolls instead of shrinking: five labels squeezed into 375px would
          drop the type below legibility, and more tools are coming. */}
      <div className="mx-5 mt-4 flex gap-1 overflow-x-auto rounded-full border border-border bg-secondary/40 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {pills.map((p) => {
          const isActive = pill === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setPill(p.id)}
              className={`shrink-0 grow rounded-full px-3 py-1.5 text-[13px] font-medium whitespace-nowrap transition ${
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
      {pill === "vazamentos" && <VazamentosTab />}
      {pill === "exposicao" && <ExposicaoTab />}
      {pill === "remocao" && <RemocaoTab />}

      {/* Incident Mode entry — pushed to the bottom: it's the "if something bad
          happened" escape hatch, rarely used, so it stays out of the noble area
          but is findable while browsing Proteção. Hidden on Remoção: someone
          reading the status of their own LGPD requests is not in an emergency,
          and a red panic row under it only muddies the screen. */}
      <div className={`px-5 pb-6 pt-2 ${pill === "remocao" ? "hidden" : ""}`}>
        <button
          onClick={() => goToTab("incidente")}
          className="flex w-full items-center gap-3 rounded-2xl border border-[var(--color-danger)]/25 bg-[var(--color-danger)]/5 px-4 py-3.5 text-left transition active:scale-[0.99]"
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--color-danger)]/12">
            <IncidentMark className="h-7 w-7" />
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
