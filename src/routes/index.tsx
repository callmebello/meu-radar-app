import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BottomNav, type TabId } from "@/components/meu-radar/BottomNav";
import { RadarTab } from "@/components/meu-radar/tabs/RadarTab";
import { CredenciaisTab } from "@/components/meu-radar/tabs/CredenciaisTab";
import { ScoreTab } from "@/components/meu-radar/tabs/ScoreTab";
import { FamiliaTab } from "@/components/meu-radar/tabs/FamiliaTab";
import { DarkWebTab } from "@/components/meu-radar/tabs/DarkWebTab";
import { PerfilTab } from "@/components/meu-radar/tabs/PerfilTab";
import { Toaster } from "@/components/ui/sonner";
import { AppProvider, useApp } from "@/contexts/AppContext";
import { PaywallModal } from "@/components/meu-radar/PaywallModal";
import { CPFEntry } from "@/components/meu-radar/CPFEntry";
import { LiveAlertBanner } from "@/components/meu-radar/LiveAlertBanner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Meu Radar — Proteção de Identidade Digital" },
      { name: "description", content: "Monitore vazamentos, senhas comprometidas e exposição na dark web com o Meu Radar." },
      { property: "og:title", content: "Meu Radar" },
      { property: "og:description", content: "Sua identidade digital protegida em um só lugar." },
    ],
  }),
  component: () => (
    <AppProvider>
      <Index />
    </AppProvider>
  ),
});

function Index() {
  const [tab, setTab] = useState<TabId>("radar");
  const { hasChecked, setGoToTab } = useApp();

  useEffect(() => {
    setGoToTab((t: TabId) => setTab(t));
  }, [setGoToTab]);

  if (!hasChecked) {
    return (
      <>
        <CPFEntry />
        <Toaster position="top-center" />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="mx-auto flex min-h-screen max-w-[420px] flex-col bg-background shadow-2xl sm:max-w-[640px] lg:max-w-[820px]">
        <LiveAlertBanner />
        <main className="flex-1 pb-2">
          {tab === "radar" && <RadarTab />}
          {tab === "credenciais" && <CredenciaisTab />}
          {tab === "score" && <ScoreTab />}
          {tab === "familia" && <FamiliaTab />}
          {tab === "darkweb" && <DarkWebTab />}
          {tab === "perfil" && <PerfilTab />}
        </main>
        <BottomNav active={tab} onChange={setTab} />
      </div>
      <PaywallModal />
      <Toaster position="top-center" />
    </div>
  );
}
