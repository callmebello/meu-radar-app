import { useState } from "react";
import { ShieldCheck, IdCard, Mail, X, ArrowRight } from "lucide-react";
import { formatCPF, isValidCPF, isValidEmail } from "@/lib/funnel";
import { suggestEmailFix } from "@/lib/emailSuggest";
import { EmailTypoHint } from "@/components/EmailTypoHint";
import type { CaptureReason } from "@/contexts/AppContext";

const COPY: Record<
  CaptureReason,
  { title: string; highlight: string; subtitle: string; confirm: string }
> = {
  postpay: {
    title: "Pagamento ",
    highlight: "confirmado",
    subtitle: "Confirme seus dados para gerarmos o seu relatório completo.",
    confirm: "Gerar relatório",
  },
  scan: {
    title: "Verifique sua ",
    highlight: "identidade",
    subtitle: "Confirme seus dados para iniciarmos a análise da sua exposição digital.",
    confirm: "Iniciar análise",
  },
};

/**
 * Minimal CPF (+ e-mail when unknown) capture — NOT the full sales landing.
 * Opens after the bottom-bar radar sweep, so it slides up as the result of that
 * action. Used post-payment ("confirm your CPF to generate the report") and as
 * the Scan capture for already-unlocked users.
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
    "w-full rounded-2xl border border-border bg-card py-4 pl-12 pr-12 text-[15px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-indigo-500";

  return (
    <div className="fixed inset-0 z-[65] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="animate-quiz-fade-up relative w-full max-w-md rounded-t-[28px] border border-border bg-background p-7 shadow-2xl sm:rounded-[28px]">
        {onClose && (
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="absolute right-5 top-5 grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary/60"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Brand mark in a soft halo — the scan that just ran, personified. */}
        <div
          className="mx-auto grid h-[86px] w-[86px] place-items-center rounded-full"
          style={{
            background:
              "radial-gradient(circle at center, rgba(99,102,241,0.14) 0%, rgba(99,102,241,0.04) 60%, transparent 72%)",
          }}
        >
          <img src="/PRIVA_mark.png" alt="Priva" className="h-16 w-16 object-contain" />
        </div>

        <h2 className="mt-3 text-center text-[26px] font-bold leading-tight tracking-tight text-foreground">
          {c.title}
          <span className="text-[var(--color-navy)]">{c.highlight}</span>
        </h2>
        <p className="mx-auto mt-2.5 max-w-[19rem] text-center text-[14.5px] leading-relaxed text-muted-foreground">
          {c.subtitle}
        </p>

        <label className="mt-7 block text-[14px] font-bold text-foreground">CPF</label>
        <div className="relative mt-2">
          <IdCard className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-navy)]" />
          <input
            value={cpf}
            onChange={(e) => setCpf(formatCPF(e.target.value))}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            inputMode="numeric"
            placeholder="000.000.000-00"
            className={inputClass}
          />
          <IdCard className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/70" />
        </div>

        {needEmail && (
          <>
            <label className="mt-5 block text-[14px] font-bold text-foreground">E-mail</label>
            <div className="relative mt-2">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-navy)]" />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailFix(null);
                }}
                onBlur={() => setEmailFix(suggestEmailFix(email))}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="seu@email.com"
                className={inputClass}
              />
              <Mail className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground/70" />
            </div>
            {emailFix && (
              <EmailTypoHint
                suggestion={emailFix}
                onAccept={() => {
                  setEmail(emailFix);
                  setEmailFix(null);
                }}
              />
            )}
          </>
        )}

        <button
          onClick={submit}
          disabled={!valid}
          className="mt-7 flex w-full items-center justify-center gap-2.5 rounded-2xl py-4 text-[16px] font-bold text-white transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
          style={{
            background: "linear-gradient(135deg,#6366F1,#8B7CFF)",
            boxShadow: "0 10px 30px rgba(99,102,241,0.38)",
          }}
        >
          {c.confirm} <ArrowRight className="h-5 w-5" />
        </button>

        <div className="mt-5 flex items-start justify-center gap-2 px-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-navy)]" />
          <p className="text-center text-[12.5px] leading-relaxed text-muted-foreground">
            Seus dados são usados apenas para realizar a análise. Sua{" "}
            <span className="font-bold text-[var(--color-navy)]">privacidade</span> é a nossa
            prioridade.
          </p>
        </div>
      </div>
    </div>
  );
}
