import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

/**
 * Floating nudge that hovers just above the central Scan button in the bottom
 * nav, encouraging the lead to tap "Scan Grátis". Replaces the old top banner.
 */
export function ScanNudge({ show, onScan }: { show: boolean; onScan: () => void }) {
  const [dismissed, setDismissed] = useState(false);
  if (!show || dismissed) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[82px] z-40 flex justify-center px-4 lg:hidden">
      <div className="animate-nudge-bounce pointer-events-auto relative">
        <button
          onClick={onScan}
          className="flex items-center gap-2.5 rounded-2xl py-2.5 pl-2.5 pr-9 text-left shadow-xl active:scale-[0.98]"
          style={{ background: "linear-gradient(135deg,#4F46E5,#6366F1)", boxShadow: "0 8px 28px rgba(79,70,229,0.45)" }}
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/20">
            <AlertTriangle className="h-4 w-4 text-white" />
          </span>
          <span>
            <span className="block text-[13px] font-bold leading-tight text-white">
              Seus dados podem estar expostos
            </span>
            <span className="block text-[11px] leading-tight text-white/80">
              Toque em Scan Grátis para verificar
            </span>
          </span>
        </button>

        {/* dismiss */}
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dispensar"
          className="absolute right-1.5 top-1.5 grid h-5 w-5 place-items-center rounded-full bg-black/20 text-white/80 hover:bg-black/30"
        >
          <X className="h-3 w-3" />
        </button>

        {/* tail pointing down to the Scan button */}
        <span
          className="absolute -bottom-1 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 rounded-[2px]"
          style={{ background: "#5a55e6" }}
        />
      </div>
    </div>
  );
}
