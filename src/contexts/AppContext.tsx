import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { TabId } from "@/components/meu-radar/BottomNav";

type Ctx = {
  isPremium: boolean;
  setIsPremium: (v: boolean) => void;
  hasChecked: boolean;
  setHasChecked: (v: boolean) => void;
  paywallOpen: boolean;
  openPaywall: () => void;
  closePaywall: () => void;
  goToTab: (t: TabId) => void;
  setGoToTab: (fn: (t: TabId) => void) => void;
  openScan: () => void;
  setOpenScan: (fn: () => void) => void;
  openCapture: (reason: CaptureReason) => void;
  setOpenCapture: (fn: (reason: CaptureReason) => void) => void;
  scanning: boolean;
  setScanning: (v: boolean) => void;
  scanResult: ScanResult | null;
  setScanResult: (v: ScanResult | null) => void;
  exposure: ExposureResult | null;
  setExposure: (v: ExposureResult | null) => void;
  familyAddPending: boolean;
  requestFamilyAdd: () => void;
  clearFamilyAdd: () => void;
};

export type ScanResult = {
  breachCount: number;
  hibp?: { count: number; breaches: unknown[] } | null;
};

// "postpay" = paid but no scan on file (confirm CPF to generate the report);
// "scan" = generic CPF capture from the Scan button.
export type CaptureReason = "postpay" | "scan";

export type ExposureSource = { title: string; link: string; snippet: string };
export type GithubRepo = { repo: string; path: string; url: string };
export type ExposureResult = {
  github?: { found: boolean; count: number; repos: GithubRepo[] };
  cpf?: { found: boolean; count: number; sources: ExposureSource[] };
  phone?: { found: boolean; count: number; sources: ExposureSource[] } | null;
};

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isPremium, setIsPremiumState] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  // Restore paid state from localStorage ('priva_is_paid')
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("priva_is_paid") === "true") {
      setIsPremiumState(true);
    }
  }, []);

  const setIsPremium = useCallback((v: boolean) => {
    setIsPremiumState(v);
    if (typeof window !== "undefined") {
      localStorage.setItem("priva_is_paid", v ? "true" : "false");
    }
  }, []);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [goToTabFn, setGoToTabFn] = useState<{ fn: (t: TabId) => void }>({ fn: () => {} });

  const openPaywall = useCallback(() => setPaywallOpen(true), []);
  const closePaywall = useCallback(() => setPaywallOpen(false), []);
  const setGoToTab = useCallback((fn: (t: TabId) => void) => {
    setGoToTabFn({ fn });
  }, []);
  const goToTab = useCallback((t: TabId) => goToTabFn.fn(t), [goToTabFn]);

  const [openScanFn, setOpenScanFn] = useState<{ fn: () => void }>({ fn: () => {} });
  const setOpenScan = useCallback((fn: () => void) => setOpenScanFn({ fn }), []);
  const openScan = useCallback(() => openScanFn.fn(), [openScanFn]);

  const [openCaptureFn, setOpenCaptureFn] = useState<{ fn: (r: CaptureReason) => void }>({
    fn: () => {},
  });
  const setOpenCapture = useCallback(
    (fn: (r: CaptureReason) => void) => setOpenCaptureFn({ fn }),
    [],
  );
  const openCapture = useCallback((r: CaptureReason) => openCaptureFn.fn(r), [openCaptureFn]);

  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [exposure, setExposure] = useState<ExposureResult | null>(null);

  // Persist the scan result + exposure so the dashboard keeps real data across a
  // full reload (e.g. the Mercado Pago redirect back to ?payment=success).
  // Hydrated post-mount to avoid SSR/client mismatch.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const s = localStorage.getItem("priva_scan_result");
      if (s) setScanResult(JSON.parse(s));
      const e = localStorage.getItem("priva_exposure");
      if (e) setExposure(JSON.parse(e));
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    if (typeof window === "undefined" || !scanResult) return;
    try {
      localStorage.setItem("priva_scan_result", JSON.stringify(scanResult));
    } catch {
      /* ignore */
    }
  }, [scanResult]);
  useEffect(() => {
    if (typeof window === "undefined" || !exposure) return;
    try {
      localStorage.setItem("priva_exposure", JSON.stringify(exposure));
    } catch {
      /* ignore */
    }
  }, [exposure]);

  const [familyAddPending, setFamilyAddPending] = useState(false);
  const requestFamilyAdd = useCallback(() => setFamilyAddPending(true), []);
  const clearFamilyAdd = useCallback(() => setFamilyAddPending(false), []);

  return (
    <AppCtx.Provider
      value={{
        isPremium,
        setIsPremium,
        hasChecked,
        setHasChecked,
        paywallOpen,
        openPaywall,
        closePaywall,
        goToTab,
        setGoToTab,
        openScan,
        setOpenScan,
        openCapture,
        setOpenCapture,
        scanning,
        setScanning,
        scanResult,
        setScanResult,
        exposure,
        setExposure,
        familyAddPending,
        requestFamilyAdd,
        clearFamilyAdd,
      }}
    >
      {children}
    </AppCtx.Provider>
  );
}

export function useApp() {
  const v = useContext(AppCtx);
  if (!v) throw new Error("useApp must be used inside AppProvider");
  return v;
}
