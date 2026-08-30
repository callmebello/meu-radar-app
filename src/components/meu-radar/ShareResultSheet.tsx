import { useEffect, useState } from "react";
import { Check, Copy, MessageCircle, Share2, X } from "lucide-react";

/**
 * Share the result — deliberately partial.
 *
 * Nothing identifying leaves: no CPF, no e-mail, no company names. Only the
 * headline number and the invitation, so a shared message can never expose the
 * person who ran the scan. That restraint is also what makes it shareable —
 * people forward "3 vazamentos", not their own breach list.
 */
export function ShareResultSheet({
  breachCount,
  score,
  onClose,
}: {
  breachCount: number;
  score: number;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [nativeAvailable, setNativeAvailable] = useState(false);

  useEffect(() => {
    setNativeAvailable(typeof navigator !== "undefined" && !!navigator.share);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const url = "https://privaapp.com.br";
  const text =
    breachCount > 0
      ? `Descobri que meus dados apareceram em ${breachCount} ${breachCount === 1 ? "vazamento" : "vazamentos"} — minha pontuação de exposição deu ${score}/100. Faça o teste gratuito:`
      : `Testei minha exposição de dados na Priva e minha pontuação deu ${score}/100. Faça o teste gratuito:`;
  const full = `${text} ${url}`;

  const shareNative = async () => {
    try {
      await navigator.share({ title: "Priva — Exposição de dados", text, url });
      onClose();
    } catch {
      /* user dismissed the native sheet */
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(full);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the text is selectable below */
    }
  };

  const whatsapp = `https://wa.me/?text=${encodeURIComponent(full)}`;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-t-3xl border border-border bg-card p-6 pb-8 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Compartilhar resultado"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[19px] font-bold text-foreground">Compartilhar resultado</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Enviamos só o resumo — nenhum dado seu vai junto.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Preview of exactly what gets sent */}
        <div className="rounded-2xl border border-border bg-background p-4">
          <p className="text-[13.5px] leading-relaxed text-foreground">{text}</p>
          <p className="mt-1 text-[13px] font-semibold text-[var(--color-navy)]">{url}</p>
        </div>

        <div className="mt-4 space-y-2.5">
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-bold text-white transition active:scale-[0.99]"
            style={{ backgroundColor: "#25D366" }}
          >
            <MessageCircle className="h-4 w-4" /> Enviar no WhatsApp
          </a>

          {nativeAvailable && (
            <button
              onClick={shareNative}
              className="flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-bold text-white transition active:scale-[0.99]"
              style={{ background: "linear-gradient(135deg,#4F46E5,#6366F1)" }}
            >
              <Share2 className="h-4 w-4" /> Mais opções
            </button>
          )}

          <button
            onClick={copy}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-3.5 text-[15px] font-semibold text-foreground transition active:scale-[0.99]"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-[var(--color-success)]" /> Copiado
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" /> Copiar mensagem
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
