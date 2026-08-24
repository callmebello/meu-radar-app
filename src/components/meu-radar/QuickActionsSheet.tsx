import { useEffect } from "react";
import { ScanLine, ChevronRight } from "lucide-react";

/**
 * The `+` action sheet from the bottom bar.
 *
 * Only surfaces actions that actually work today — right now that's the scan.
 * The other planned verifications (Pix, link, telefone, e-mail, mensagem/print)
 * and Incident Mode arrive in their own phases and get real rows here then; no
 * dead buttons in the meantime. The coming set is named as plain text so the
 * value is still visible without pretending to be tappable.
 */
export function QuickActionsSheet({
  open,
  onClose,
  onScan,
}: {
  open: boolean;
  onClose: () => void;
  onScan: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center"
      style={{ backgroundColor: "rgba(5,5,13,0.5)", backdropFilter: "blur(2px)" }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="animate-quiz-fade-up w-full max-w-[460px] rounded-t-3xl bg-card p-5 pb-8"
        style={{ boxShadow: "0 -12px 40px rgba(5,5,13,0.25)" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Ações rápidas"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-muted-foreground/25" />
        <h2 className="mb-4 text-center text-[15px] font-bold text-foreground">Verificar</h2>

        <button
          onClick={() => {
            onClose();
            onScan();
          }}
          className="flex w-full items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3.5 text-left transition active:scale-[0.99]"
        >
          <span
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl"
            style={{ backgroundColor: "rgba(99,102,241,0.12)" }}
          >
            <ScanLine className="h-5 w-5" strokeWidth={1.9} style={{ color: "#4F46E5" }} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-bold text-foreground">Escanear meus dados</span>
            <span className="block text-[12px] text-muted-foreground">
              Verifica vazamentos de CPF, e-mail e telefone
            </span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>

        <p className="mt-4 text-center text-[11.5px] leading-relaxed text-muted-foreground">
          Em breve: verificar Pix, link, telefone, e-mail e analisar mensagens.
        </p>
      </div>
    </div>
  );
}
