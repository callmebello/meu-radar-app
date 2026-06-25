import { useState } from "react";
import { AppHeader } from "./Header";
import { ShieldCheck, CircleCheck, Zap, IdCard, Mail, ArrowRight } from "lucide-react";
import { formatCPF, isValidCPF, isValidEmail } from "@/lib/funnel";

const FEATURES = [
  { Icon: CircleCheck, title: "100% gratuito" },
  { Icon: Zap, title: "Resultado rápido" },
  { Icon: ShieldCheck, title: "Conforme LGPD" },
];

const AVATARS = [
  "https://i.pravatar.cc/64?img=12",
  "https://i.pravatar.cc/64?img=32",
  "https://i.pravatar.cc/64?img=45",
];

/**
 * Initial scan landing (Início, before the first scan). Collects CPF + e-mail
 * and starts the scan. Theme-aware (works on light & dark); fits a phone with no
 * scroll, and centers in a narrow column on desktop (lg+).
 */
export function ScanLanding({ onSubmit }: { onSubmit: (cpf: string, email: string) => void }) {
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");

  const valid = isValidCPF(cpf) && isValidEmail(email);
  const submit = () => {
    if (!valid) return;
    onSubmit(cpf, email.trim());
  };

  const inputClass =
    "w-full rounded-xl border border-[var(--color-navy)]/30 bg-secondary py-4 pl-4 pr-12 text-foreground outline-none placeholder:text-muted-foreground/60";

  return (
    <>
      <AppHeader title="" showBell />
      {/* Desktop (lg+) only: center the landing in a narrow column with more
          breathing room so it doesn't read as a stretched phone screen. */}
      <div className="flex flex-1 flex-col justify-between px-6 pb-7 pt-5 lg:mx-auto lg:max-w-lg lg:justify-center lg:gap-8 lg:px-8">
        {/* headline */}
        <div>
          <h1 className="text-center text-3xl font-extrabold leading-tight text-foreground md:text-4xl">
            Seu CPF foi <span className="text-indigo-400">vazado?</span>
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-center text-base leading-relaxed text-muted-foreground">
            Descubra e remova seus dados da internet.
          </p>
          <p className="mx-auto mt-3 max-w-sm text-center text-sm leading-relaxed text-muted-foreground">
            Analisamos CPF, e-mail, telefone e possíveis vazamentos para proteger sua identidade digital.
          </p>
        </div>

        {/* form */}
        <div className="py-2">
          {/* CPF */}
          <label className="block text-sm font-semibold text-foreground">CPF</label>
          <div className="relative mt-2">
            <span
              className="animate-nudge-bounce absolute -top-2.5 right-3 z-10 rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow-lg"
              style={{ background: "linear-gradient(135deg,#4F46E5,#6366F1)" }}
            >
              Scan 100% grátis
            </span>
            <input
              value={cpf}
              onChange={(e) => setCpf(formatCPF(e.target.value))}
              inputMode="numeric"
              placeholder="000.000.000-00"
              className={inputClass}
            />
            <IdCard className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          </div>

          {/* E-mail */}
          <label className="mt-4 block text-sm font-semibold text-foreground">E-mail</label>
          <div className="relative mt-2">
            <span
              className="animate-nudge-bounce absolute -top-2.5 right-3 z-10 rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow-lg"
              style={{ background: "linear-gradient(135deg,#4F46E5,#6366F1)", animationDelay: "0.5s" }}
            >
              Receba o resultado grátis
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="seu@email.com"
              className={inputClass}
            />
            <Mail className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          </div>

          {/* CTA */}
          <button
            onClick={submit}
            disabled={!valid}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-lg font-bold text-white transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,#4F46E5,#6366F1)", boxShadow: "0 8px 28px rgba(79,70,229,0.4)" }}
          >
            Fazer Scan Grátis <ArrowRight className="h-5 w-5" />
          </button>

          {/* Terms / LGPD consent */}
          <p className="mt-3 text-center text-[11px] leading-snug text-muted-foreground">
            Ao continuar, você concorda com os{" "}
            <a href="/termos" target="_blank" rel="noopener noreferrer" className="text-indigo-400 underline">
              Termos
            </a>{" "}
            e a{" "}
            <a
              href="https://www.iubenda.com/privacy-policy/23107752"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 underline"
            >
              Política de Privacidade
            </a>
            .
          </p>
        </div>

        {/* bottom: cards + social proof */}
        <div>
          {/* feature cards */}
          <div className="grid grid-cols-3 gap-2.5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="flex flex-col items-center gap-1.5 rounded-xl border border-border/60 bg-card px-2 py-4 text-center shadow-sm"
              >
                <f.Icon className="h-6 w-6 text-indigo-400" strokeWidth={1.8} />
                <p className="text-xs font-semibold leading-tight text-foreground">{f.title}</p>
              </div>
            ))}
          </div>

          {/* social proof */}
          <div className="mt-5 flex items-center gap-3">
            <div className="flex -space-x-2.5">
              {AVATARS.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt=""
                  loading="lazy"
                  className="h-9 w-9 rounded-full border-2 object-cover"
                  style={{ borderColor: "var(--color-background)" }}
                />
              ))}
            </div>
            <div>
              <p className="text-sm text-foreground">
                <span className="font-bold text-indigo-400">+18.427</span> verificações realizadas
              </p>
              <p className="text-xs text-muted-foreground">Milhares de brasileiros já verificaram seus dados.</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
