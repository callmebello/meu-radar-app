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
import { ScanNudge } from "@/components/meu-radar/ScanNudge";
import { ScanLanding } from "@/components/meu-radar/ScanLanding";
import { CPFModal } from "@/components/CPFModal";
import { AccountCreation } from "@/components/AccountCreation";
import { isValidCPF, generateResult } from "@/lib/funnel";
import { track } from "@/lib/analytics";
import { saveUser } from "@/lib/api/saveUser";
import { saveScan } from "@/lib/api/saveScan";
import { checkHibp } from "@/lib/api/hibp.functions";
import { searchExposure } from "@/lib/api/serpapi.functions";
import { searchGithubExposure } from "@/lib/api/github.functions";

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
  const [showCpfModal, setShowCpfModal] = useState(false);
  const { setGoToTab, isPremium, setOpenScan, scanning, setScanning, setScanResult, setExposure } = useApp();

  // Core scan: spins the button, slides up the scanning box, then opens the
  // result sheet. In parallel it persists the user (hashed CPF), queries HIBP for
  // the real breach count, and caches the scan — all best-effort (guarded).
  const runScan = (cpf: string, email: string) => {
    setHasScanned(true);
    setTab("radar");
    setFunnelOpen(false);
    setScanning(true);

    const mock = generateResult(cpf);
    let breachCount = mock.breaches;
    let userId: string | null = null;
    let cpfHash = "";

    void saveUser({ data: { email, cpf } })
      .then((u) => {
        userId = u.userId;
        cpfHash = u.cpfHash;
        if (u.userId) {
          try {
            localStorage.setItem("priva_user_id", u.userId);
          } catch {
            /* ignore */
          }
        }
      })
      .catch(() => {});

    if (email) {
      void checkHibp({ data: { email } })
        .then((h) => {
          if (h && typeof h.count === "number" && h.count > 0) breachCount = h.count;
          setScanResult({ breachCount, hibp: h });
        })
        .catch(() => {});
    }

    // Dashboard-only real free sources (GitHub + SerpAPI). Best-effort: the LP
    // mock (ScanFunnel result) is untouched; this only feeds the dashboard cards.
    {
      const cpfDigits = cpf.replace(/\D/g, "");
      let phone = "";
      try {
        phone = (JSON.parse(localStorage.getItem("priva_profile") || "{}").extraPhone as string) || "";
      } catch {
        /* ignore */
      }
      void Promise.allSettled([
        email ? searchGithubExposure({ data: { email } }) : Promise.resolve(null),
        cpfDigits ? searchExposure({ data: { query: cpfDigits, type: "cpf" } }) : Promise.resolve(null),
        phone ? searchExposure({ data: { query: phone, type: "phone" } }) : Promise.resolve(null),
      ]).then(([gh, cpfRes, phoneRes]) => {
        setExposure({
          github: gh.status === "fulfilled" && gh.value ? gh.value : undefined,
          cpf: cpfRes.status === "fulfilled" && cpfRes.value ? cpfRes.value : undefined,
          phone: phoneRes.status === "fulfilled" ? phoneRes.value : null,
        });
      });
    }

    setTimeout(() => {
      setScanResult({ breachCount, hibp: null });
      setScanning(false);
      setFunnelOpen(true);
      track("ViewContent");
      void saveScan({
        data: { userId, cpfHash, email, result: { breachCount, mock }, breachCount },
      }).catch(() => {});
    }, 3500);
  };

  // Single entry point used by the landing form and the CPF modal.
  const beginScan = (cpf: string, email: string) => {
    try {
      sessionStorage.setItem("priva_cpf", cpf);
      if (email) sessionStorage.setItem("priva_email", email);
    } catch {
      /* ignore */
    }
    track("Lead");
    setShowCpfModal(false);
    runScan(cpf, email);
  };

  // Central scan button: scan inline if CPF is known, else open the capture modal.
  const onScan = () => {
    const c = typeof window !== "undefined" ? sessionStorage.getItem("priva_cpf") : null;
    const e = (typeof window !== "undefined" ? sessionStorage.getItem("priva_email") : null) ?? "";
    if (c && isValidCPF(c)) runScan(c, e);
    else setShowCpfModal(true);
  };

  useEffect(() => {
    setGoToTab((t: TabId) => setTab(t));
    setOpenScan(() => onScan());
    const storedCpf = typeof window !== "undefined" ? sessionStorage.getItem("priva_cpf") : null;
    if (storedCpf) setHasScanned(true);
    // The landing page is the entry — no auto CPF modal pop-up. The modal only
    // opens as a fallback if the user taps Scan without a stored CPF (onScan).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setGoToTab, setOpenScan]);

  // CPF entered in the legacy funnel modal → run the inline scan from session.
  const onScanStart = () => {
    const c = sessionStorage.getItem("priva_cpf") || "";
    const e = sessionStorage.getItem("priva_email") || "";
    runScan(c, e);
  };

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
        <main className="flex flex-1 flex-col pb-2">
          {showEmpty ? (
            <ScanLanding onSubmit={beginScan} />
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
        <ScanNudge show={!isPremium && !hasScanned && !scanning && !funnelOpen} onScan={onScan} />
        <BottomNav active={tab} onChange={setTab} onScan={onScan} scanning={scanning} />
      </div>

      <ScanFunnel open={funnelOpen} onClose={closeFunnel} onScanStart={onScanStart} />
      {showCpfModal && !isPremium && <CPFModal onSubmit={beginScan} />}
      <AccountCreation />
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
