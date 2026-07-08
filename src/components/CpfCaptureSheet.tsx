import { useState } from "react";
import { ShieldCheck, IdCard, Mail, X } from "lucide-react";
import { formatCPF, isValidCPF, isValidEmail } from "@/lib/funnel";
import { suggestEmailFix } from "@/lib/emailSuggest";
import { EmailTypoHint } from "@/components/EmailTypoHint";
import type { CaptureReason } from "@/contexts/AppContext";

const COPY: Record<CaptureReason, { title: string; subtitle: string; confirm: string }> = {
  postpay: {
    title: "Pagamento confirmado!",
    subtitle: "Para gerar seu relatório, precisamos confirmar seu CPF.",
    confirm: "Confirmar e gerar relatório",
  },
  scan: {
    title: "Verificar seus dados",
    subtitle: "Confirme seu CPF para fazer o scan.",
    confirm: "Fazer scan",
  },
};

/**
 * Minimal CPF (+ e-mail when unknown) capture — NOT the full sales landing.
 * Used as the post-payment "confirm your CPF to generate the report" fallback
 * and as the Scan-button capture for already-unlocked users.
 */
export function CpfCaptureSheet({
  reason,
  defaultEmail = "",
  onConfirm,
  onClose,
}: {
  reason: CaptureReason;
  defaultEmail?: string;
  onConfirm: (cpf: string, email: string) => void;
  onClose?: () => void;
}) {
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState(defaultEmail);
  const [emailFix, setEmailFix] = useState<string | null>(null);
  const needEmail = !isValidEmail(defaultEmail);
  const valid = isValidCPF(cpf) && (!needEmail || isValidEmail(email));
  const c = COPY[reason];

  const submit = () => {
    if (valid) onConfirm(cpf, (needEmail ? email : defaultEmail).trim());
  };

  const inputClass =
    "w-full rounded-xl border border-border bg-secondary py-3.5 pl-4 pr-11 text-foreground outline-none placeholder:text-muted-foreground/60";

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-sm rounded-3xl border border-border bg-card p-6 shadow-2xl">
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary/60"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[var(--color-navy)]/12">
          <ShieldCheck className="h-7 w-7 text-[var(--color-navy)]" />
        </div>
        <h2 className="mt-4 text-center text-xl font-bold text-foreground">{c.title}</h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">{c.subtitle}</p>

        <label className="mt-5 block text-sm font-semibold text-foreground">CPF</label>
        <div className="relative mt-2">
          <input
            value={cpf}
            onChange={(e) => setCpf(formatCPF(e.target.value))}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            inputMode="numeric"
            placeholder="000.000.000-00"
            className={inputClass}
          />
          <IdCard className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
        </div>

        {needEmail && (
          <>
            <label className="mt-4 block text-sm font-semibold text-foreground">E-mail</label>
            <div className="relative mt-2">
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailFix(null); }}
                onBlur={() => setEmailFix(suggestEmailFix(email))}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="seu@email.com"
                className={inputClass}
              />
              <Mail className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            </div>
            {emailFix && (
              <EmailTypoHint suggestion={emailFix} onAccept={() => { setEmail(emailFix); setEmailFix(null); }} />
            )}
          </>
        )}

        <button
          onClick={submit}
          disabled={!valid}
          className="mt-5 w-full rounded-2xl py-3.5 text-base font-bold text-white transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
          style={{ background: "linear-gradient(135deg,#4F46E5,#6366F1)", boxShadow: "0 8px 28px rgba(79,70,229,0.4)" }}
        >
          {c.confirm}
        </button>

        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3 w-3" /> Seguro · não armazenamos seu CPF
        </p>
      </div>
    </div>
  );
}
