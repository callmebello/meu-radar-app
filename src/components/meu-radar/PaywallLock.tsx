import { Lock } from "lucide-react";
import { useApp } from "@/contexts/AppContext";

export function PaywallLock({ children, className = "" }: { children?: React.ReactNode; className?: string }) {
  const { openPaywall } = useApp();
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        openPaywall();
      }}
      className={`inline-flex items-center gap-1.5 rounded-md bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground hover:bg-secondary/80 transition ${className}`}
    >
      <Lock className="h-3 w-3" />
      {children ?? "••••••••"}
    </button>
  );
}
