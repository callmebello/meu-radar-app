import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BottomNav, type TabId } from "@/components/meu-radar/BottomNav";
import { DesktopSidebar } from "@/components/meu-radar/DesktopSidebar";
import { RadarTab } from "@/components/meu-radar/tabs/RadarTab";
import { ProtecaoTab } from "@/components/meu-radar/tabs/ProtecaoTab";
import { AtividadeTab } from "@/components/meu-radar/tabs/AtividadeTab";
import { FamiliaTab } from "@/components/meu-radar/tabs/FamiliaTab";
import { PerfilTab } from "@/components/meu-radar/tabs/PerfilTab";
import { IncidentMode } from "@/components/meu-radar/IncidentMode";
import { Toaster } from "@/components/ui/sonner";
import { AppProvider, useApp, type CaptureReason } from "@/contexts/AppContext";
import { CpfCaptureSheet } from "@/components/CpfCaptureSheet";
import { PreScanQuiz } from "@/components/quiz/PreScanQuiz";
import { PaywallModal } from "@/components/meu-radar/PaywallModal";
import { ScanFunnel } from "@/components/meu-radar/ScanFunnel";
import { ScanningOverlay } from "@/components/meu-radar/ScanningOverlay";
import { ScanNudge } from "@/components/meu-radar/ScanNudge";
import { ScanLanding } from "@/components/meu-radar/ScanLanding";
import { PaymentReturn } from "@/components/PaymentReturn";
import { isValidCPF, generateResult, getScore } from "@/lib/funnel";
import { track } from "@/lib/analytics";
import { saveUser } from "@/lib/api/saveUser";
import { attributionParams, getFirstTouch } from "@/lib/attribution";
import { saveScan } from "@/lib/api/saveScan";
import { checkHibp } from "@/lib/api/hibp.functions";
import { searchExposure } from "@/lib/api/serpapi.functions";
import { searchGithubExposure } from "@/lib/api/github.functions";
import { getUser } from "@/lib/auth";
import {
  getCpf,
  getEmail,
  hasCompletedQuiz,
  markQuizCompleted,
  rememberIdentity,
} from "@/lib/identity";
import { getUserPlan } from "@/lib/api/account.functions";
import { syncLeadProfile } from "@/lib/api/quiz.functions";
import { readQuizAnswers } from "@/lib/quiz";

import { AppHeader } from "@/components/meu-radar/Header";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Priva — Descubra se seus dados vazaram" },
      {
        name: "description",
        content:
          "Verifique gratuitamente se seu CPF, e-mail e telefone foram expostos em vazamentos. Monitore sua identidade digital com a Priva.",
      },
      { property: "og:title", content: "Priva — Proteção de Identidade Digital" },
      {
        property: "og:description",
        content: "Descubra onde seus dados vazaram e proteja-se em segundos.",
      },
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
  // Hydrated post-mount: reading localStorage during render would break SSR.
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    setSignedIn(localStorage.getItem("priva_signed_in") === "true");
    // Shared into the app from another app (Web Share Target, Android PWA):
    // land straight on the verification tools with the content ready.
    if (new URLSearchParams(window.location.search).get("verificar")) setTab("atividade");
  }, []);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [captureReason, setCaptureReason] = useState<CaptureReason>("scan");
  const [quizOpen, setQuizOpen] = useState(false);
  const {
    setGoToTab,
    isPremium,
    setIsPremium,
    setOpenScan,
    setOpenCapture,
    scanning,
    setScanning,
    scanResult,
    setScanResult,
    setExposure,
  } = useApp();
  const navigate = useNavigate();

  // Restore the logged-in account on load: if there's a Supabase session, sync
  // the plan/paid state and e-mail so the user stays logged in with their data.
  useEffect(() => {
    (async () => {
      const user = await getUser();
      if (!user?.email) return;
      try {
        sessionStorage.setItem("priva_email", user.email);
      } catch {
        /* ignore */
      }
      try {
        const res = await getUserPlan({ data: { email: user.email } });
        if (res.found) {
          if (res.isPaid) setIsPremium(true);
          try {
            localStorage.setItem("priva_plan", res.plan);
          } catch {
            /* ignore */
          }
          setHasScanned(true);
        }
      } catch {
        /* best-effort */
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Core scan: spins the button, slides up the scanning box, then opens the
  // result sheet. In parallel it persists the user (hashed CPF), queries HIBP for
  // the real breach count, and caches the scan — all best-effort (guarded).
  const runScan = (cpf: string, email: string, opts?: { silent?: boolean }) => {
    setHasScanned(true);
    setTab("radar");
    setFunnelOpen(false);
    setScanning(true);

    const mock = generateResult(cpf);
    let breachCount = mock.breaches;

    const cpfDigits = cpf.replace(/\D/g, "");
    const cpfLast2 = cpfDigits.slice(-2);
    let profileName = "";
    let phone = "";
    try {
      const prof = JSON.parse(localStorage.getItem("priva_profile") || "{}");
      profileName = (prof.cpfName as string) || "";
      phone = (prof.extraPhone as string) || "";
    } catch {
      /* ignore */
    }

    // Fire user + all sources in parallel (best-effort, guarded). The dashboard
    // cards + result sheet update as each resolves; the full scan is persisted
    // once everything settles so the PDF generators have real data.
    const userP = saveUser({
      data: { email, cpf, attribution: getFirstTouch() ?? undefined },
    }).catch(() => null);
    const hibpP = email ? checkHibp({ data: { email } }).catch(() => null) : Promise.resolve(null);
    const ghP = email
      ? searchGithubExposure({ data: { email } }).catch(() => null)
      : Promise.resolve(null);
    const cpfP = cpfDigits
      ? searchExposure({ data: { query: cpfDigits, type: "cpf" } }).catch(() => null)
      : Promise.resolve(null);
    const phoneP = phone
      ? searchExposure({ data: { query: phone, type: "phone" } }).catch(() => null)
      : Promise.resolve(null);

    // initial result-sheet count from the mock; HIBP refines it below
    setScanResult({ breachCount, hibp: null });

    void userP.then((u) => {
      if (u?.userId) {
        try {
          localStorage.setItem("priva_user_id", u.userId);
        } catch {
          /* ignore */
        }
      }
    });

    void hibpP.then((h) => {
      if (h && typeof h.count === "number" && h.count > 0) breachCount = h.count;
      const sr = { breachCount, hibp: h };
      setScanResult(sr);
      // Persist directly too — the /relatorio route reads this from localStorage
      // and the AppProvider effect may not flush before we navigate away.
      try {
        localStorage.setItem("priva_scan_result", JSON.stringify(sr));
      } catch {
        /* ignore */
      }
    });

    // Dashboard-only real free sources (GitHub + SerpAPI). The LP mock
    // (ScanFunnel result) is untouched; this only feeds the dashboard cards.
    void Promise.all([ghP, cpfP, phoneP]).then(([gh, cpfRes, phoneRes]) => {
      setExposure({
        github: gh ?? undefined,
        cpf: cpfRes ?? undefined,
        phone: phoneRes ?? null,
      });
    });

    // Marketing profile — fired here because this is the first moment where the
    // user id and the hashed CPF exist alongside the quiz answers and the real
    // breach count. Joining them is what makes segmented remarketing possible.
    void Promise.all([userP, hibpP]).then(([u, h]) => {
      if (!email) return;
      const count = h && typeof h.count === "number" ? h.count : undefined;
      void syncLeadProfile({
        data: {
          email,
          userId: u?.userId ?? null,
          cpfHash: u?.cpfHash,
          breachCount: count,
          ...readQuizAnswers(),
        },
      }).catch(() => null);
    });

    // Persist the rich scan (HIBP breach list + public exposure) for PDFs.
    void Promise.all([userP, hibpP, ghP, cpfP, phoneP]).then(([u, h, gh, cpfRes, phoneRes]) => {
      const finalBreaches = h && typeof h.count === "number" && h.count > 0 ? h.count : breachCount;
      const hibpStored = h
        ? {
            count: h.count,
            breaches: (h.breaches ?? []).map((raw) => {
              const b = raw as Record<string, unknown>;
              // Title is the readable name ("LinkedIn"); Name is the machine key
              // ("June2026StealerLogs"). Keep the brand fields too so the stored
              // scan can render logos and rank companies, same as the report.
              return {
                name: String(b.Title ?? b.Name ?? "Vazamento"),
                date: String(b.BreachDate ?? b.AddedDate ?? ""),
                domain: String(b.Domain ?? ""),
                logoPath: String(b.LogoPath ?? ""),
                pwnCount: typeof b.PwnCount === "number" ? b.PwnCount : 0,
                isStealerLog: b.IsStealerLog === true,
                dataClasses: Array.isArray(b.DataClasses) ? (b.DataClasses as string[]) : [],
              };
            }),
          }
        : null;
      void saveScan({
        data: {
          userId: u?.userId ?? null,
          cpfHash: u?.cpfHash ?? "",
          email,
          result: {
            breachCount: finalBreaches,
            score: getScore(cpf, finalBreaches),
            name: profileName,
            cpfLast2,
            email,
            hibp: hibpStored,
            exposure: { github: gh ?? null, cpf: cpfRes ?? null, phone: phoneRes ?? null },
            mock,
          },
          breachCount: finalBreaches,
        },
      }).catch(() => {});
    });

    // Land on /relatorio only once the real HIBP result is in (so the report
    // never opens empty), keeping the ≥3.5s scan animation and capping the wait
    // at 7s if HIBP is slow. Paid users (silent) stay on the dashboard.
    const minAnim = new Promise<void>((res) => setTimeout(res, 3500));
    const hibpReady = Promise.race([hibpP, new Promise((res) => setTimeout(res, 7000))]);
    void Promise.all([minAnim, hibpReady]).then(() => {
      setScanning(false);
      if (!opts?.silent) navigate({ to: "/relatorio" });
    });
  };

  // Single entry point from the pre-scan quiz's CPF step. The Pixel `Lead` is
  // fired by the quiz the moment that step is reached (not here), so it counts
  // leads that got to the form — firing it again on submit would double it.
  const beginScan = (cpf: string, email: string) => {
    setQuizOpen(false);
    rememberIdentity(cpf, email);
    markQuizCompleted();
    runScan(cpf, email);
  };

  // CPF capture (post-payment "confirm CPF" fallback, or Scan-button capture for
  // already-unlocked users). Paid users scan silently (no sales funnel).
  const confirmCapture = (cpf: string, email: string) => {
    setCaptureOpen(false);
    rememberIdentity(cpf, email);
    track("Lead", attributionParams());
    runScan(cpf, email, { silent: isPremium });
  };

  // Central scan button: scan inline if CPF is known, else capture it. Free
  // leads go through the pre-scan quiz (the sales flow); paid users skip it and
  // get the bare CPF sheet — they've already converted, don't re-sell them.
  const onScan = () => {
    const c = getCpf();
    const e = getEmail();

    // Already scanned → show what we found instead of re-running it. Tapping the
    // mark when there's a result should answer "what did you find?", not start
    // the whole thing over.
    if (hasScanned && scanResult) {
      navigate({ to: "/relatorio" });
      return;
    }

    if (c && isValidCPF(c)) {
      runScan(c, e, { silent: isPremium });
      return;
    }

    // No CPF on file. Someone who already answered the quiz never sees it
    // again — they just get the short capture sheet.
    if (isPremium || hasCompletedQuiz()) {
      setCaptureReason("scan");
      setCaptureOpen(true);
      return;
    }

    setQuizOpen(true);
  };

  useEffect(() => {
    setGoToTab((t: TabId) => setTab(t));
    setOpenScan(() => onScan());
    setOpenCapture((reason: CaptureReason) => {
      setCaptureReason(reason);
      setCaptureOpen(true);
    });
    if (getCpf()) setHasScanned(true);
    // The landing page is the entry — no auto CPF modal pop-up. The modal only
    // opens as a fallback if the user taps Scan without a stored CPF (onScan).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setGoToTab, setOpenScan, setOpenCapture]);

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

  // Someone who signed in from /inicio lands inside the app, not back on the
  // pre-scan sales landing — they already have an account.
  const showEmpty = tab === "radar" && !isPremium && !hasScanned && !scanning && !signedIn;

  return (
    <div className="min-h-screen bg-muted/40">
      <div className="relative mx-auto flex min-h-screen max-w-[420px] bg-background shadow-2xl sm:max-w-[640px] lg:max-w-[1120px]">
        {/* Desktop-only left nav (lg+). Mobile keeps the BottomNav untouched.
            Both are hidden on the pre-scan landing: it's a funnel entry page,
            not a place to wander off into empty tabs. */}
        {!showEmpty && (
          <DesktopSidebar active={tab} onChange={setTab} onScan={onScan} scanning={scanning} />
        )}

        {/* Content column */}
        <div className="relative flex min-h-screen flex-1 flex-col">
          <main className="flex flex-1 flex-col pb-2 lg:mx-auto lg:w-full lg:max-w-3xl lg:px-2">
            {showEmpty ? (
              <ScanLanding onStart={() => setQuizOpen(true)} />
            ) : (
              <>
                {tab === "radar" && <RadarTab />}
                {tab === "protecao" && <ProtecaoTab />}
                {tab === "atividade" && <AtividadeTab />}
                {tab === "incidente" && <IncidentMode />}
                {tab === "familia" && <FamiliaTab />}
                {tab === "perfil" && <PerfilTab />}
              </>
            )}
          </main>
          <ScanningOverlay open={scanning} />
          {/* Nudge stays visible until the lead converts (buys). Hidden on desktop
              (no bottom scan button to point at — the sidebar has its own). */}
          <ScanNudge show={!showEmpty && !isPremium && !scanning && !funnelOpen} onScan={onScan} />
          {!showEmpty && (
            <BottomNav active={tab} onChange={setTab} onScan={onScan} scanning={scanning} />
          )}
        </div>
      </div>

      <PaymentReturn />
      {quizOpen && (
        <PreScanQuiz
          defaultEmail={
            (typeof window !== "undefined" && sessionStorage.getItem("priva_email")) || ""
          }
          onComplete={beginScan}
          onExit={() => setQuizOpen(false)}
        />
      )}
      {captureOpen && (
        <CpfCaptureSheet
          reason={captureReason}
          defaultEmail={
            (typeof window !== "undefined" && sessionStorage.getItem("priva_email")) || ""
          }
          onConfirm={confirmCapture}
          onClose={captureReason === "scan" ? () => setCaptureOpen(false) : undefined}
        />
      )}
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
          style={{
            background: "radial-gradient(circle at center,#6366F1,#4F46E5)",
            border: "2px solid rgba(255,255,255,0.15)",
          }}
        >
          <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="8" stroke="white" strokeWidth="1.2" fill="none" />
            <circle
              cx="24"
              cy="24"
              r="16"
              stroke="white"
              strokeWidth="1.2"
              fill="none"
              opacity="0.7"
            />
            <circle
              cx="24"
              cy="24"
              r="22"
              stroke="white"
              strokeWidth="1.2"
              fill="none"
              opacity="0.4"
            />
            <line
              x1="24"
              y1="24"
              x2="40"
              y2="8"
              stroke="white"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
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
