import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { useApp } from "@/contexts/AppContext";

export function LiveAlertBanner() {
  const [visible, setVisible] = useState(false);
  const { goToTab } = useApp();

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 3000);
    const t2 = setTimeout(() => setVisible(false), 11000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="sticky top-0 z-30 flex items-center gap-3 bg-[var(--color-warning)] px-4 py-2.5 text-[#1a1a1a] shadow-md animate-fade-in cursor-pointer"
      onClick={() => {
        goToTab("seguranca");
        setVisible(false);
      }}
    >
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <p className="flex-1 text-xs font-semibold leading-tight">
        Novo vazamento detectado — Fórum HackBR agora mesmo
      </p>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setVisible(false);
        }}
        className="grid h-6 w-6 place-items-center rounded-full hover:bg-black/10 transition"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
