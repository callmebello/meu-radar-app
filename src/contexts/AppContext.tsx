import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
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
};

const AppCtx = createContext<Ctx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [goToTabFn, setGoToTabFn] = useState<{ fn: (t: TabId) => void }>({ fn: () => {} });

  const openPaywall = useCallback(() => setPaywallOpen(true), []);
  const closePaywall = useCallback(() => setPaywallOpen(false), []);
  const setGoToTab = useCallback((fn: (t: TabId) => void) => {
    setGoToTabFn({ fn });
  }, []);
  const goToTab = useCallback((t: TabId) => goToTabFn.fn(t), [goToTabFn]);

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
