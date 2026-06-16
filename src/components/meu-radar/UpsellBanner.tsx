import { Trash2, ChevronRight } from "lucide-react";
import { MP_PROTECAO_URL, openCheckout } from "@/lib/funnel";
import { track } from "@/lib/analytics";

/**
 * Upsell to "Proteção Total" (R$29,90) — shown to paid Essencial users on the
 * dashboard / Segurança tab. Opens the Mercado Pago checkout.
 */
export function UpsellBanner({ className = "" }: { className?: string }) {
  return (
    <button
      onClick={() => {
        track("InitiateCheckout");
        openCheckout(MP_PROTECAO_URL);
      }}
      className={`flex w-full items-center gap-3 rounded-2xl p-4 text-left transition-all active:scale-[0.99] ${className}`}
      style={{ background: "linear-gradient(135deg,#1a0a2e,#2d1264)", border: "1px solid rgba(168,85,247,0.2)" }}
    >
      <Trash2 className="h-5 w-5 shrink-0 text-red-400" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-white">Remova seus dados da internet</p>
        <p className="mt-0.5 text-xs text-gray-400">Solicite exclusão via LGPD por R$29,90/mês</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-gray-600" />
    </button>
  );
}

// Whether to show the upsell: paid users not already on Proteção Total.
export function shouldShowUpsell(isPremium: boolean): boolean {
  if (!isPremium) return false;
  const plan = typeof window !== "undefined" ? localStorage.getItem("priva_plan") : null;
  return plan !== "protecao_total";
}
