import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BottomNav, type TabId } from "@/components/meu-radar/BottomNav";
import { RadarTab } from "@/components/meu-radar/tabs/RadarTab";
import { SegurancaTab } from "@/components/meu-radar/tabs/SegurancaTab";
import { FamiliaTab } from "@/components/meu-radar/tabs/FamiliaTab";
import { PerfilTab } from "@/components/meu-radar/tabs/PerfilTab";
import { Toaster } from "@/components/ui/sonner";
import { AppProvider, useApp } from "@/contexts/AppContext";
import { PaywallModal } from "@/components/meu-radar/PaywallModal";
import { ScanFunnel } from "@/components/meu-radar/ScanFunnel";
import { TopBanner } from "@/components/meu-radar/TopBanner";
import { LiveAlertBanner } from "@/components/meu-radar/LiveAlertBanner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Priva — Descubra se seus dados vazaram" },
      { name: "description", content: "Verifique gratuitamente se seu CPF, e-mail e telefone foram expostos em vazamentos. Monitore sua identidade digital com a Priva." },
      { property: "og:title", content: "Priva — Proteção de Identidade Digital" },
      { property: "og:description", content: "Descubra onde seus dados vazaram e proteja-se em segundos." },
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
  const [funnelOpen, setFunnelOpen] = useState(false);
  const { setGoToTab, isPremium } = useApp();

  useEffect(() => {
    setGoToTab((t: TabId) => setTab(t));
  }, [setGoToTab]);

  const onScan = () => setFunnelOpen(true);

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="mx-auto flex min-h-screen max-w-[420px] flex-col bg-background shadow-2xl sm:max-w-[640px] lg:max-w-[820px]">
        {!isPremium && <TopBanner onScan={onScan} />}
        <LiveAlertBanner />
        <main className="flex-1 pb-2">
          {tab === "radar" && <RadarTab />}
          {tab === "seguranca" && <SegurancaTab />}
          {tab === "familia" && <FamiliaTab />}
          {tab === "perfil" && <PerfilTab />}
        </main>
        <BottomNav active={tab} onChange={setTab} onScan={onScan} scanning={false} />
      </div>

      <ScanFunnel open={funnelOpen} onClose={() => setFunnelOpen(false)} />
      <PaywallModal />
      <Toaster position="top-center" />
    </div>
  );
}
