import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { BottomNav, type TabId } from "@/components/meu-radar/BottomNav";
import { RadarTab } from "@/components/meu-radar/tabs/RadarTab";
import { CredenciaisTab } from "@/components/meu-radar/tabs/CredenciaisTab";
import { FamiliaTab } from "@/components/meu-radar/tabs/FamiliaTab";
import { DarkWebTab } from "@/components/meu-radar/tabs/DarkWebTab";
import { PerfilTab } from "@/components/meu-radar/tabs/PerfilTab";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Meu Radar — Proteção de Identidade Digital" },
      { name: "description", content: "Monitore vazamentos, senhas comprometidas e exposição na dark web com o Meu Radar." },
      { property: "og:title", content: "Meu Radar" },
      { property: "og:description", content: "Sua identidade digital protegida em um só lugar." },
    ],
  }),
  component: Index,
});

function Index() {
  const [tab, setTab] = useState<TabId>("radar");
  return (
    <div className="min-h-screen bg-muted/40">
      <div className="mx-auto flex min-h-screen max-w-[420px] flex-col bg-background shadow-2xl">
        <main className="flex-1 pb-2">
          {tab === "radar" && <RadarTab />}
          {tab === "credenciais" && <CredenciaisTab />}
          {tab === "familia" && <FamiliaTab />}
          {tab === "darkweb" && <DarkWebTab />}
          {tab === "perfil" && <PerfilTab />}
        </main>
        <BottomNav active={tab} onChange={setTab} />
      </div>
      <Toaster position="top-center" />
    </div>
  );
}
