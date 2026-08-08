import { AppHeader } from "./Header";
import { ShieldCheck, CircleCheck, Zap, ArrowRight } from "lucide-react";

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
 * Initial scan landing (Início, before the first scan). Sells the scan and hands
 * off to the pre-scan quiz — CPF/e-mail are collected on the quiz's last step,
 * after the lead has answered 3 questions about their own exposure.
 */
export function ScanLanding({ onStart }: { onStart: () => void }) {
  return (
    <>
      <AppHeader title="" showBell />
      {/* Desktop (lg+) only: center the landing in a narrow column with more
          breathing room so it doesn't read as a stretched phone screen. */}
      <div className="flex flex-1 flex-col justify-between px-6 pb-7 pt-5 lg:mx-auto lg:max-w-lg lg:justify-center lg:gap-8 lg:px-8">
        {/* headline */}
        <div>
          <h1 className="text-center text-3xl font-extrabold leading-tight text-foreground md:text-4xl">
            Seu CPF foi <span className="text-indigo-600 dark:text-indigo-400">vazado?</span>
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-center text-base leading-relaxed text-muted-foreground">
            Descubra e remova seus dados da internet.
          </p>
          <p className="mx-auto mt-3 max-w-sm text-center text-sm leading-relaxed text-muted-foreground">
            Analisamos CPF, e-mail, telefone e possíveis vazamentos para proteger sua identidade
            digital.
          </p>
        </div>

        {/* CTA — opens the 3-question pre-scan quiz */}
        <div className="py-2">
          <button
            onClick={onStart}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-lg font-bold text-white transition-all active:scale-[0.99]"
            style={{
              background: "linear-gradient(135deg,#4F46E5,#6366F1)",
              boxShadow: "0 8px 28px rgba(79,70,229,0.4)",
            }}
          >
            Fazer Scan Grátis <ArrowRight className="h-5 w-5" />
          </button>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            ✓ Grátis · ✓ 3 perguntas rápidas · ✓ Resultado na hora
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
              <p className="text-xs text-muted-foreground">
                Milhares de brasileiros já verificaram seus dados.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
