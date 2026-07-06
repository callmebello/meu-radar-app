import { useEffect, useState } from "react";
import { Trash2, ChevronRight, X } from "lucide-react";
import { startCheckout } from "@/lib/checkout";
import { track } from "@/lib/analytics";

// Timed reveal: don't nag on entry — wait 5 min, then show once per session.
const REVEAL_DELAY_MS = 5 * 60 * 1000;
const ENTERED_KEY = "priva_entered_at";
const DISMISSED_KEY = "priva_upsell_dismissed";

/**
 * Upsell to "Proteção Total" (R$29,90) — shown to paid Essencial users on the
 * dashboard / Segurança tab. Opens the Stripe Checkout.
 *
 * Reveal rules (non-intrusive):
 *  - appears only 5 minutes after the user first enters the app;
 *  - shows once per session and, once dismissed, stays hidden until a new one;
 *  - never interrupts the user — it's an inline banner, not a modal.
 */
export function UpsellBanner({ className = "" }: { className?: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Dismissed earlier this session → stay hidden until a new session.
    if (sessionStorage.getItem(DISMISSED_KEY) === "1") return;

    // Anchor the 5-min countdown to the first app entry this session, so
    // navigating between tabs doesn't restart the timer.
    let enteredAt = Number(sessionStorage.getItem(ENTERED_KEY));
    if (!enteredAt) {
      enteredAt = Date.now();
      sessionStorage.setItem(ENTERED_KEY, String(enteredAt));
    }
    const remaining = REVEAL_DELAY_MS - (Date.now() - enteredAt);
    if (remaining <= 0) {
      setVisible(true);
      return;
    }
    const t = setTimeout(() => setVisible(true), remaining);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    try {
      sessionStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  return (
    <div className={`animate-fade-in relative ${className}`}>
      <button
        onClick={() => {
          track("InitiateCheckout");
          void startCheckout("protecao_total");
        }}
        className="flex w-full items-center gap-3 rounded-2xl p-4 pr-10 text-left transition-all active:scale-[0.99]"
        style={{
          background: "linear-gradient(135deg,#1a0a2e,#2d1264)",
          border: "1px solid rgba(168,85,247,0.2)",
        }}
      >
        <Trash2 className="h-5 w-5 shrink-0 text-red-400" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">Remova seus dados da internet</p>
          <p className="mt-0.5 text-xs text-gray-400">Solicite exclusão via LGPD por R$29,90/mês</p>
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-gray-600" />
      </button>
      <button
        onClick={dismiss}
        aria-label="Dispensar"
        className="absolute right-2.5 top-2.5 grid h-6 w-6 place-items-center rounded-full text-gray-500 transition hover:bg-white/10 hover:text-gray-300"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

// Whether to show the upsell: paid users not already on Proteção Total.
export function shouldShowUpsell(isPremium: boolean): boolean {
  if (!isPremium) return false;
  const plan = typeof window !== "undefined" ? localStorage.getItem("priva_plan") : null;
  return plan !== "protecao_total";
}
