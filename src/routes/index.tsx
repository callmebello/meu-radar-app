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
import { ScanningOverlay } from "@/components/meu-radar/ScanningOverlay";
import { TopBanner } from "@/components/meu-radar/TopBanner";
import { WelcomeGate } from "@/components/meu-radar/WelcomeGate";
import { isValidCPF } from "@/lib/funnel";

import { AppHeader } from "@/components/meu-radar/Header";

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
  const [hasScanned, setHasScanned] = useState(false);
  const { setGoToTab, isPremium, setOpenScan, scanning, setScanning } = useApp();

  // Run the inline scan (button spins + box slides up over the blurred app),
  // then open the result sheet. Keeps the footer visible the whole time.
  const runScan = () => {
    setHasScanned(true);
    setTab("radar");
    setFunnelOpen(false);
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setFunnelOpen(true); // ScanFunnel opens straight to result (CPF already stored)
    }, 3500);
  };

  // Central scan button: if CPF already known, scan inline; else ask for it first.
  const onScan = () => {
    const stored = typeof window !== "undefined" ? sessionStorage.getItem("priva_cpf") : null;
    if (stored && isValidCPF(stored)) {
      runScan();
    } else {
      setFunnelOpen(true); // ScanFunnel opens the CPF entry modal
    }
  };

  useEffect(() => {
    setGoToTab((t: TabId) => setTab(t));
    setOpenScan(() => onScan());
    if (typeof window !== "undefined" && sessionStorage.getItem("priva_cpf")) {
      setHasScanned(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setGoToTab, setOpenScan]);

  // CPF entered in the funnel → run the inline scan
  const onScanStart = () => runScan();

  const closeFunnel = () => {
    setFunnelOpen(false);
    if (typeof window !== "undefined" && sessionStorage.getItem("priva_cpf")) {
      setHasScanned(true);
    }
  };

  const showEmpty = tab === "radar" && !isPremium && !hasScanned && !scanning;

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="relative mx-auto flex min-h-screen max-w-[420px] flex-col bg-background shadow-2xl sm:max-w-[640px] lg:max-w-[820px]">
        {!isPremium && <TopBanner onScan={onScan} />}
        <main className="flex flex-1 flex-col pb-2">
          {showEmpty ? (
            <ScanEmptyState onScan={onScan} />
          ) : (
            <>
              {tab === "radar" && <RadarTab />}
              {tab === "seguranca" && <SegurancaTab />}
              {tab === "familia" && <FamiliaTab />}
              {tab === "perfil" && <PerfilTab />}
            </>
          )}
        </main>
        <ScanningOverlay open={scanning} />
        <BottomNav active={tab} onChange={setTab} onScan={onScan} scanning={scanning} />
      </div>

      <WelcomeGate />
      <ScanFunnel open={funnelOpen} onClose={closeFunnel} onScanStart={onScanStart} />
      <PaywallModal />
      <Toaster position="top-center" />
    </div>
  );
}

function ScanEmptyState({ onScan }: { onScan: () => void }) {
  return (
    <>
      <AppHeader title="" showBell />
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <button
        onClick={onScan}
        aria-label="Fazer scan grátis"
        className="scan-breathe grid h-20 w-20 place-items-center rounded-full"
        style={{ background: "radial-gradient(circle at center,#6366F1,#4F46E5)", border: "2px solid rgba(255,255,255,0.15)" }}
      >
        <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="8" stroke="white" strokeWidth="1.2" fill="none" />
          <circle cx="24" cy="24" r="16" stroke="white" strokeWidth="1.2" fill="none" opacity="0.7" />
          <circle cx="24" cy="24" r="22" stroke="white" strokeWidth="1.2" fill="none" opacity="0.4" />
          <line x1="24" y1="24" x2="40" y2="8" stroke="white" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="24" cy="24" r="2" fill="white" />
        </svg>
      </button>
      <p className="mt-4 text-xl font-bold text-white">Fazer Scan Grátis</p>
      <p className="mt-2 text-sm text-gray-400">Descubra se seus dados estão expostos</p>
      <p className="mt-3 text-xs text-gray-600">✓ Grátis · ✓ 5 segundos · ✓ Sem cadastro</p>
      </div>
    </>
  );
}
