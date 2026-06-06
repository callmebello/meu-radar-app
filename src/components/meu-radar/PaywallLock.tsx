import { ChevronRight } from "lucide-react";
import { useApp } from "@/contexts/AppContext";

export function PaywallLock({ className = "" }: { className?: string }) {
  const { openScan } = useApp();
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        openScan();
      }}
      className={`inline-flex items-center gap-1 text-xs font-medium text-indigo-400 ${className}`}
    >
      Fazer scan grátis <ChevronRight className="h-3 w-3" />
    </button>
  );
}
