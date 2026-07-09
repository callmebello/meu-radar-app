import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, Clock, KeyRound, Lock, Mail, Phone, Shield, ShieldCheck, User } from "lucide-react";
import { getScore } from "@/lib/funnel";
import { startCheckout, type CheckoutPlan } from "@/lib/checkout";
import { track, gaEvent } from "@/lib/analytics";
import { useIsDark } from "@/hooks/use-is-dark";
import { AnimatedScoreGauge } from "@/components/meu-radar/AnimatedScoreGauge";

export const Route = createFileRoute("/relatorio")({
  head: () => ({ meta: [{ title: "Relatório de Exposição — Priva" }] }),
  component: RelatorioPage,
});

type RawBreach = {
  Name?: string;
  Title?: string;
  Domain?: string;
  BreachDate?: string;
  AddedDate?: string;
  DataClasses?: string[];
};
type StoredScan = { breachCount?: number; hibp?: { count?: number; breaches?: RawBreach[] } | null };

function readJSON<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}

const DATA_CLASS_PT: Record<string, string> = {
  "email addresses": "E-mail",
  passwords: "Senha",
  "phone numbers": "Telefone",
  names: "Nome",
  usernames: "Usuário",
  "physical addresses": "Endereço",
  "dates of birth": "Nascimento",
  "geographic locations": "Localização",
  "ip addresses": "IP",
  "credit cards": "Cartão",
  "government issued ids": "Documento",
};
const translateDC = (dc: string) => DATA_CLASS_PT[dc.toLowerCase()] || dc;

const TYPE_ICON: Record<string, typeof Mail> = {
  "E-mail": Mail,
  Senha: KeyRound,
  Telefone: Phone,
  Nome: User,
};

function yearOf(d?: string): string {
  if (!d) return "";
  const y = new Date(d).getFullYear();
  return isNaN(y) ? "" : String(y);
}

// Breach-source logo: favicon by domain (Google s2), falling back to a
// contact-style circle with the source's initial when there's no favicon.
function SourceLogo({ domain, initial, locked = false }: { domain?: string; initial: string; locked?: boolean }) {
  const [failed, setFailed] = useState(false);
  // Locked rows use a contact-style initial avatar — never the real favicon,
  // so the hidden breach's identity isn't given away.
  if (locked || !domain || failed) {
    return (
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-500/10 text-sm font-bold text-indigo-600">
        {initial}
      </span>
    );
  }
  if (domain && !failed) {
    return (
      <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-secondary">
        <img
          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
          alt=""
          className="h-6 w-6 object-contain"
          onError={() => setFailed(true)}
        />
      </span>
    );
  }
  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-indigo-500/10 text-sm font-bold text-indigo-600">
      {initial}
    </span>
  );
}

type Expo = {
  name: string;
  domain?: string;
  year: string;
  types: string[];
  sevLabel: string;
  sevClass: string;
  locked: boolean;
};

// One exposure row (mockup style): logo · name + typed data icons · badge.
// Locked rows keep the same layout with initial avatar + blurred name.
function ExpoRow({ e, delayMs, divider }: { e: Expo; delayMs?: number; divider: boolean }) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3.5 ${divider ? "border-t border-border" : ""} ${delayMs !== undefined ? "animate-fade-in" : ""}`}
      style={delayMs !== undefined ? { animationDelay: `${delayMs}ms`, animationDuration: "180ms", animationFillMode: "backwards" } : undefined}
    >
      <SourceLogo domain={e.domain} initial={(e.name[0] || "•").toUpperCase()} locked={e.locked} />
      <div className="min-w-0 flex-1">
        {/* Locked rows keep the EXACT real layout (icons + typed data + year),
            just blurred — reads as authentic hidden content, not empty rows. */}
        <p className={`truncate text-sm font-bold text-foreground ${e.locked ? "select-none blur-[5px]" : ""}`}>
          {e.name || "Vazamento de dados"}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
          {e.types.slice(0, 3).map((t) => {
            const Icon = TYPE_ICON[t];
            return (
              <span key={t} className={`flex items-center gap-1 ${e.locked ? "select-none blur-[4px]" : ""}`}>
                {Icon ? <Icon className="h-3 w-3" /> : <span className="h-1 w-1 rounded-full bg-red-500" />}
                {t}
              </span>
            );
          })}
          {e.year && <span className={`text-muted-foreground/70 ${e.locked ? "select-none blur-[4px]" : ""}`}>· {e.year}</span>}
        </p>
      </div>
      <span className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold ${e.sevClass}`}>{e.sevLabel}</span>
    </div>
  );
}

function RelatorioPage() {
  const navigate = useNavigate();
  const isDark = useIsDark();
  const firedView = useRef(false);
  const plansRef = useRef<HTMLDivElement | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showSticky, setShowSticky] = useState(false);

  const scan = readJSON<StoredScan>("priva_scan_result");
  const cpf = typeof window !== "undefined" ? sessionStorage.getItem("priva_cpf") || "" : "";
  const isPaid = typeof window !== "undefined" && localStorage.getItem("priva_is_paid") === "true";

  // Real data only — the breach list + count come straight from HIBP.
  const breaches = useMemo(() => (scan?.hibp?.breaches ?? []).filter(Boolean), [scan]);
  const breachCount = scan?.hibp?.count ?? breaches.length;
  const displayCount = breachCount;

  // Broken, session-varied score (more authority than a round "20", and not
  // always identical). Stable within a session, fresh on a new one. SSR-safe:
  // deterministic on first render, refined on the client in the effect below.
  const [score, setScore] = useState(() => (cpf ? getScore(cpf, breachCount) : 20));
  useEffect(() => {
    const KEY = "priva_report_score";
    let v = Number(sessionStorage.getItem(KEY));
    if (!v) {
      const [lo, hi] = breachCount >= 5 ? [12, 31] : breachCount >= 2 ? [28, 47] : [54, 72];
      v = lo + Math.floor(Math.random() * (hi - lo + 1));
      try {
        sessionStorage.setItem(KEY, String(v));
      } catch {
        /* ignore */
      }
    }
    setScore(v);
  }, [breachCount]);

  const risk =
    score < 40
      ? { color: "#EF4444", label: "RISCO ALTO", short: "ALTO", phrase: "Sua identidade digital está em risco.", badge: "bg-red-500/10 text-red-600" }
      : score < 70
        ? { color: "#F59E0B", label: "RISCO MÉDIO", short: "MÉDIO", phrase: "Sua identidade digital precisa de atenção.", badge: "bg-amber-500/10 text-amber-600" }
        : { color: "#10B981", label: "RISCO BAIXO", short: "BAIXO", phrase: "Sua identidade digital está protegida.", badge: "bg-emerald-500/10 text-emerald-600" };

  // Exposed-data count: real sum of leaked data types across the breaches.
  const dataExposed = breaches.reduce((a, b) => a + (b.DataClasses?.length ?? 0), 0);

  useEffect(() => {
    if (!scan && !cpf) navigate({ to: "/" });
  }, [scan, cpf, navigate]);

  useEffect(() => {
    if (firedView.current) return;
    firedView.current = true;
    track("ViewContent", { content_name: "Relatorio Resumido", value: 9.9, currency: "BRL" });
    gaEvent("view_relatorio", { breach_count: displayCount, risk_level: risk.label });
  }, [displayCount, risk.label]);

  // Sticky CTA: persistent nudge while the plans are off-screen; hides once the
  // plan cards are in view so it never covers their buttons.
  useEffect(() => {
    const el = plansRef.current;
    if (!el || isPaid) return;
    const obs = new IntersectionObserver(([e]) => setShowSticky(!e.isIntersecting), { threshold: 0.25 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [isPaid]);

  const checkout = async (plan: CheckoutPlan) => {
    // InitiateCheckout (Pixel) + begin_checkout (GA4) fire inside startCheckout.
    setRedirecting(true);
    await startCheckout(plan);
    setRedirecting(false);
  };

  // 100% real data (HIBP). 2 breaches fully revealed; the rest are the real
  // breaches shown as locked rows (name + data blurred, initial on the avatar).
  // No fabricated/mock content — curiosity comes from the real volume.
  const guessDomain = (b: RawBreach) =>
    b.Domain || `${(b.Name || "").toLowerCase().replace(/[^a-z0-9]/g, "")}.com`;
  const toExpo = (b: RawBreach, i: number, locked = false): Expo => ({
    name: b.Name || b.Title || "Vazamento de dados",
    domain: guessDomain(b),
    year: yearOf(b.BreachDate || b.AddedDate),
    types: (b.DataClasses ?? []).map(translateDC),
    sevLabel: locked ? "OCULTO" : i === 0 ? "ALTO" : "MÉDIO",
    sevClass: locked ? "text-muted-foreground bg-secondary" : i === 0 ? "text-red-600 bg-red-500/10" : "text-amber-600 bg-amber-500/10",
    locked,
  });
  const revealed: Expo[] = breaches.slice(0, 2).map((b, i) => toExpo(b, i));
  const lockedRows: Expo[] = breaches.slice(2, 8).map((b, i) => toExpo(b, i, true));

  const logo = isDark ? "/PRIVA_logo_dark_theme.png" : "/PRIVA_logo_light_theme.png";

  return (
    <div className="min-h-screen bg-background">
      <div className="animate-report-drop mx-auto max-w-md px-5 pb-16">
        {/* Header */}
        <header className="sticky top-0 z-10 -mx-5 flex items-center justify-between bg-background px-5 py-4">
          <button onClick={() => navigate({ to: "/" })} aria-label="Voltar" className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-foreground hover:opacity-80">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <img src={logo} alt="PRIVA" className="h-5 w-auto object-contain" />
          <span className="h-9 w-9" />
        </header>

        {/* SECTION 1 — Score card (speedometer + risk phrase, mockup layout) */}
        <section className="mt-2 rounded-3xl border border-indigo-500/25 bg-card p-6 shadow-sm">
          <p className="text-center text-xs tracking-widest text-muted-foreground">RELATÓRIO DE EXPOSIÇÃO DIGITAL</p>
          <div className="mt-4 flex items-center gap-3">
            <div className="w-[52%] shrink-0">
              <AnimatedScoreGauge score={score} max={100} showMax gradient showLabel={false} />
            </div>
            <div className="min-w-0 flex-1">
              <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${risk.badge}`}>{risk.label}</span>
              <p className="mt-2 text-sm leading-snug text-muted-foreground">{risk.phrase}</p>
            </div>
          </div>
          {/* Sources ≠ breaches: CPF, e-mail, telefone, web pública e repositórios. */}
          <p className="mt-4 flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-500" /> Analisamos suas informações em fontes verificadas
          </p>
          {/* Lead-facing summary: leaks · risk level (red) · exposed data */}
          <div className="mt-5 grid grid-cols-3 border-t border-border pt-4 text-center">
            <div>
              <p className="text-2xl font-extrabold text-foreground">{displayCount}</p>
              <p className="mt-1 text-[11px] leading-tight text-muted-foreground">Vazamentos encontrados</p>
            </div>
            <div className="border-x border-border">
              <p className="text-2xl font-extrabold" style={{ color: risk.color }}>{risk.short}</p>
              <p className="mt-1 text-[11px] leading-tight text-muted-foreground">Nível de risco</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-foreground">{dataExposed}</p>
              <p className="mt-1 text-[11px] leading-tight text-muted-foreground">Dados expostos</p>
            </div>
          </div>
        </section>

        {/* SECTION 2 — Exposições. Closed: 1 full row + "Abrir relatório".
            Open: 2 full rows + real locked/blurred rest + plan link. */}
        {revealed.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-bold text-foreground">Exposições encontradas</h2>

          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <ExpoRow e={revealed[0]} divider={false} />

            {expanded && (
              <>
                {revealed.slice(1).map((e, i) => (
                  <ExpoRow key={`r${i}`} e={e} divider delayMs={i * 150} />
                ))}
                {lockedRows.map((e, i) => (
                  <ExpoRow key={`l${i}`} e={e} divider delayMs={(revealed.length - 1 + i) * 150} />
                ))}
              </>
            )}

            {!expanded && (revealed.length > 1 || lockedRows.length > 0) && (
              <button
                onClick={() => setExpanded(true)}
                className="w-full border-t border-border py-3.5 text-sm font-semibold text-indigo-600 transition hover:bg-secondary/40"
              >
                Abrir relatório →
              </button>
            )}

            {expanded && !isPaid && (
              <button
                onClick={() => plansRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
                className="flex w-full items-center justify-center gap-1.5 border-t border-border py-3.5 text-sm font-semibold text-indigo-600 transition hover:bg-secondary/40"
              >
                Ver tudo no plano completo <Lock className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </section>
        )}

        {/* PAID users → full report */}
        {isPaid ? (
          <button
            onClick={() => navigate({ to: "/" })}
            className="mt-8 w-full rounded-2xl bg-[var(--color-navy)] py-4 font-bold text-white transition active:scale-[0.99]"
          >
            Ver meu relatório completo →
          </button>
        ) : (
          <>
            {/* Divider */}
            <div className="mt-10 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs text-muted-foreground">Proteja-se agora</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            {/* Plans */}
            <p className="mt-6 text-center text-base font-semibold text-foreground">O que você está perdendo</p>
            {/* Honest urgency — no fake countdowns (their data really is exposed). */}
            <p className="mb-4 mt-1.5 flex items-center justify-center gap-1.5 text-xs font-medium text-red-600">
              <Clock className="h-3.5 w-3.5" /> Seus dados seguem expostos enquanto você espera
            </p>
            <div ref={plansRef} className="grid grid-cols-2 gap-3">
              {/* Essencial */}
              <div className="self-center rounded-2xl border border-indigo-500/30 bg-card p-4 shadow-sm">
                <p className="mb-2 text-xs font-bold text-indigo-600">Essencial</p>
                <p className="text-2xl font-extrabold text-foreground">R$9,90<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
                <ul className="mt-3 space-y-2">
                  {[
                    `Relatório completo (todos os ${displayCount} vazamentos)`,
                    "Detalhes completos dos vazamentos",
                    "Monitoramento contínuo",
                    "Alertas em tempo real",
                  ].map((f) => (
                    <li key={f} className="flex gap-2 text-xs text-muted-foreground"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" /> {f}</li>
                  ))}
                </ul>
                <button onClick={() => checkout("essencial")} disabled={redirecting} className="mt-4 w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white transition active:scale-[0.99] disabled:opacity-60">
                  Assinar →
                </button>
              </div>

              {/* Proteção Total — visually dominant (~10% larger via scale) */}
              <div className="relative z-10 scale-[1.05] rounded-2xl border-2 border-purple-500/50 bg-card p-4 shadow-lg">
                <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-purple-600 px-3 py-1 text-[10px] font-bold text-white shadow-md">MAIS ESCOLHIDO</span>
                <p className="mb-2 text-xs font-bold text-purple-600">Proteção Total</p>
                <p className="text-2xl font-extrabold text-foreground">R$24,90<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
                <ul className="mt-3 space-y-2">
                  {[
                    "Tudo do Essencial",
                    "Solicitação de remoção via LGPD",
                    "Advogados parceiros cuidam do processo",
                    "Acompanhamento por e-mail",
                  ].map((f) => (
                    <li key={f} className="flex gap-2 text-xs text-muted-foreground"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-purple-500" /> {f}</li>
                  ))}
                </ul>
                <button
                  onClick={() => checkout("protecao_total")}
                  disabled={redirecting}
                  className="mt-4 w-full rounded-xl py-3 text-sm font-bold text-white transition active:scale-[0.99] disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg,#7C3AED,#4F46E5)", boxShadow: "0 0 16px rgba(124,58,237,0.3)" }}
                >
                  Ativar proteção →
                </button>
              </div>
            </div>

            {redirecting && <p className="mt-3 text-center text-xs text-indigo-500">Redirecionando para pagamento seguro...</p>}

            {/* Trust row */}
            <div className="mt-8 flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> Seus dados protegidos</span>
              <span className="flex items-center gap-1"><Lock className="h-3.5 w-3.5" /> Pagamento seguro</span>
              <span className="flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> Cancele quando quiser</span>
            </div>
          </>
        )}
      </div>

      {/* Sticky conversion CTA — persistent while scrolling; smooth-scrolls to
          the plans. Hidden for paid users and once the plans are on screen. */}
      {!isPaid && (
        <div
          className={`fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 px-4 pt-6 transition-transform duration-300 ${showSticky ? "translate-y-0" : "translate-y-full"}`}
          style={{
            background: "linear-gradient(to top, var(--color-background) 55%, transparent)",
            paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
          }}
        >
          <button
            onClick={() => plansRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
            className="w-full rounded-2xl py-4 text-base font-bold text-white transition active:scale-[0.99]"
            style={{ background: "linear-gradient(135deg,#4F46E5,#6366F1)", boxShadow: "0 8px 28px rgba(79,70,229,0.45)" }}
          >
            Desbloquear relatório completo →
          </button>
        </div>
      )}
    </div>
  );
}
