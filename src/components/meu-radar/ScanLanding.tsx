import { AppHeader } from "./Header";
import { ArrowRight, ChevronRight, CircleCheck, Eraser, Lock, Search, Shield } from "lucide-react";

const TRUST = ["100% Grátis", "Dados protegidos", "Rápido e Seguro"];

// The whole product in one glance: find it → get it removed → keep watching.
const VALUE = [
  { Icon: Search, title: "DETECTA", text: "Encontra exposições" },
  { Icon: Eraser, title: "REMOVE", text: "Ajuda a remover" },
  { Icon: Shield, title: "MONITORA", text: "Acompanha novos riscos" },
];

const AVATARS = [
  "https://i.pravatar.cc/64?img=12",
  "https://i.pravatar.cc/64?img=32",
  "https://i.pravatar.cc/64?img=45",
];

/**
 * Idle radar behind the hero card. Deliberately low-contrast and slow — it
 * should register as "something is watching" in peripheral vision and never
 * pull the eye off the headline or the CTA. Motion is dropped entirely under
 * prefers-reduced-motion (see styles.css).
 */
function RadarBackdrop() {
  return (
    <svg
      viewBox="0 0 200 200"
      className="h-full w-full text-indigo-500"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="radar-sweep-grad"
          x1="100"
          y1="100"
          x2="100"
          y2="10"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.22" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* static grid */}
      <g stroke="currentColor" strokeWidth="0.7" opacity="0.28">
        <circle cx="100" cy="100" r="32" />
        <circle cx="100" cy="100" r="58" />
        <circle cx="100" cy="100" r="82" />
        <circle cx="100" cy="100" r="99" />
        <line x1="100" y1="1" x2="100" y2="199" />
        <line x1="1" y1="100" x2="199" y2="100" />
      </g>

      {/* slow sweep */}
      <g className="radar-sweep-idle">
        <path d="M100 100 L100 2 A98 98 0 0 1 169 30 Z" fill="url(#radar-sweep-grad)" />
        <line
          x1="100"
          y1="100"
          x2="100"
          y2="2"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.4"
        />
      </g>

      {/* contacts */}
      <circle cx="100" cy="100" r="3.5" fill="currentColor" opacity="0.85" />
      <circle cx="146" cy="66" r="2.6" fill="currentColor" className="radar-blip" />
      <circle cx="72" cy="139" r="2" fill="currentColor" className="radar-blip-late" />
    </svg>
  );
}

/** Small inline BR flag — an icon, not an emoji, so it renders identically everywhere. */
function FlagBR({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 20" className={className} aria-hidden="true">
      <rect width="28" height="20" rx="3" fill="#009C3B" />
      <path d="M14 3.2 24.4 10 14 16.8 3.6 10Z" fill="#FFDF00" />
      <circle cx="14" cy="10" r="4" fill="#002776" />
    </svg>
  );
}

/**
 * Initial scan landing (Início, before the first scan). Sells the scan and hands
 * off to the pre-scan quiz — CPF/e-mail are collected on the quiz's last step,
 * after the lead has answered 3 questions about their own exposure.
 */
export function ScanLanding({ onStart }: { onStart: () => void }) {
  return (
    <>
      <AppHeader title="" />
      {/* Desktop (lg+) only: centre the landing in a narrow column so it doesn't
          read as a stretched phone screen. */}
      <div className="flex flex-1 flex-col px-6 pb-6 pt-3 lg:mx-auto lg:max-w-lg lg:px-8">
        <h1 className="text-[2rem] font-extrabold leading-[1.15] tracking-tight text-foreground">
          Seu CPF pode estar{" "}
          <span className="text-indigo-600 dark:text-indigo-400">exposto na internet.</span>
        </h1>
        <p className="mt-3 max-w-[19rem] text-[15px] leading-relaxed text-muted-foreground">
          Descubra em segundos se seus dados apareceram em vazamentos.
        </p>

        {/* Hero — idle radar with a sample finding card over it */}
        <div className="relative mt-5 h-[158px]">
          <div className="pointer-events-none absolute -right-10 top-1/2 h-[210px] w-[210px] -translate-y-1/2">
            <RadarBackdrop />
          </div>

          <div
            className="absolute left-0 top-1/2 w-[85%] -translate-y-1/2 rounded-2xl border border-border bg-card p-4"
            style={{ boxShadow: "0 10px 34px rgba(15,15,30,0.10)" }}
          >
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-500/10">
                <Lock className="h-5 w-5 text-indigo-500" strokeWidth={1.9} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold leading-tight text-foreground">E-mail encontrado</p>
                <p className="text-xs font-semibold text-indigo-500">em 2 vazamentos</p>
                <p className="mt-0.5 truncate text-xs text-muted-foreground">joa******@****.com</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </div>
            <div className="mt-3 flex gap-1.5">
              {[0.9, 0.6, 0.35, 0.18].map((o, i) => (
                <span
                  key={i}
                  className="h-1.5 flex-1 rounded-full bg-indigo-500"
                  style={{ opacity: o }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* CTA — opens the 3-question pre-scan quiz */}
        <button
          onClick={onStart}
          className="relative mt-5 w-full rounded-2xl py-4 text-[17px] font-bold text-white transition-all active:scale-[0.99]"
          style={{
            background: "linear-gradient(135deg,#4F46E5,#6366F1)",
            boxShadow: "0 10px 30px rgba(79,70,229,0.35)",
          }}
        >
          Verificar meus dados grátis
          <span className="absolute right-4 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white/15">
            <ArrowRight className="h-4 w-4" />
          </span>
        </button>

        <div className="mt-4 flex items-center justify-between gap-1">
          {TRUST.map((t) => (
            <span key={t} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <CircleCheck className="h-3.5 w-3.5 shrink-0 text-indigo-400" strokeWidth={2} />
              {t}
            </span>
          ))}
        </div>

        {/* Value proposition — DETECTA → REMOVE → MONITORA. Kept deliberately
            light (thin strokes, small type, soft shadow) so it never competes
            with the CTA above it. */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          {VALUE.map((v) => (
            <div
              key={v.title}
              className="rounded-xl border border-indigo-500/10 bg-card px-2 py-2.5 text-center"
              style={{ boxShadow: "0 2px 8px rgba(15,15,30,0.05)" }}
            >
              <v.Icon
                className="mx-auto mb-1.5 h-[18px] w-[18px]"
                strokeWidth={1.5}
                color="#6C5CE7"
              />
              <p className="text-[11px] font-semibold leading-none tracking-wide text-foreground">
                {v.title}
              </p>
              <p className="mt-1 text-[10px] leading-tight text-muted-foreground">{v.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3">
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

        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
          <Lock className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.9} />
          <p className="flex-1 text-xs text-muted-foreground">Seguimos rigorosamente a LGPD</p>
          <span className="flex shrink-0 items-center gap-1.5 rounded-lg bg-secondary px-2 py-1">
            <FlagBR className="h-3 w-[17px] rounded-[2px]" />
            <span className="text-[11px] font-bold text-foreground">LGPD</span>
          </span>
        </div>

        <p className="mt-auto pt-4 text-center text-[11px] text-muted-foreground/70">
          PRIVA © {new Date().getFullYear()} · Todos os direitos reservados.
        </p>
      </div>
    </>
  );
}
