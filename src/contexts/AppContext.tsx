import { createContext, useContext, useState, type ReactNode } from "react";
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
  const [goToTabFn, setGoToTabFn] = useState<(t: TabId) => void>(() => () => {});

  return (
    <AppCtx.Provider
      value={{
        isPremium,
        setIsPremium,
        hasChecked,
        setHasChecked,
        paywallOpen,
        openPaywall: () => setPaywallOpen(true),
        closePaywall: () => setPaywallOpen(false),
        goToTab: goToTabFn,
        setGoToTab: (fn) => setGoToTabFn(() => fn),
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
