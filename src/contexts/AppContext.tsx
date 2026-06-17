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
  scanning: boolean;
  setScanning: (v: boolean) => void;
  scanResult: ScanResult | null;
  setScanResult: (v: ScanResult | null) => void;
  familyAddPending: boolean;
  requestFamilyAdd: () => void;
  clearFamilyAdd: () => void;
};

export type ScanResult = {
  breachCount: number;
  hibp?: { count: number; breaches: unknown[] } | null;
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

  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
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
        scanning,
        setScanning,
        scanResult,
        setScanResult,
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
