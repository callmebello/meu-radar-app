import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, Lock, Shield, X as XIcon } from "lucide-react";
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
  "dates of birth": "Data de nascimento",
  "geographic locations": "Localização",
  "ip addresses": "IP",
  "credit cards": "Cartão de crédito",
  "government issued ids": "Documento",
};
const translateDC = (dc: string) => DATA_CLASS_PT[dc.toLowerCase()] || dc;

// One breach row — ultra-compact: source name · data types · risk badge.
// Identical layout whether real or locked (blurred); optional staggered reveal.
function BreachCard({
  name,
  types,
  hiddenCount,
  sevLabel,
  sevClass,
  locked = false,
  delayMs,
}: {
  name: string;
  types: string[];
  hiddenCount: number;
  sevLabel: string;
  sevClass: string;
  locked?: boolean;
  delayMs?: number;
}) {
  return (
    <div
      className={`mb-2.5 flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 ${delayMs !== undefined ? "animate-fade-in" : ""}`}
      style={delayMs !== undefined ? { animationDelay: `${delayMs}ms`, animationDuration: "180ms", animationFillMode: "backwards" } : undefined}
    >
      <div className="min-w-0">
        <p className={`truncate text-sm font-bold text-foreground ${locked ? "select-none blur-sm" : ""}`}>{name}</p>
        <p className={`mt-0.5 truncate text-xs text-muted-foreground ${locked ? "select-none blur-sm" : ""}`}>
          {types.join(" • ")}
          {hiddenCount > 0 && <span className="text-muted-foreground/70"> • +{hiddenCount}</span>}
        </p>
      </div>
      <span className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold ${sevClass}`}>{sevLabel}</span>
    </div>
  );
}

function RelatorioPage() {
  const navigate = useNavigate();
  const isDark = useIsDark();
  const firedView = useRef(false);
  const [redirecting, setRedirecting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const scan = readJSON<StoredScan>("priva_scan_result");
  const cpf = typeof window !== "undefined" ? sessionStorage.getItem("priva_cpf") || "" : "";
  const isPaid = typeof window !== "undefined" && localStorage.getItem("priva_is_paid") === "true";

  const breaches = useMemo(() => (scan?.hibp?.breaches ?? []).filter(Boolean), [scan]);
  const breachCount = scan?.hibp?.count ?? scan?.breachCount ?? breaches.length;
  const displayCount = Math.max(2, breachCount);
  const score = cpf ? getScore(cpf, breachCount) : 46;

  const risk =
    score < 40
      ? { color: "#EF4444", label: "RISCO ALTO", badge: "bg-red-500/10 text-red-600" }
      : score < 70
        ? { color: "#F59E0B", label: "RISCO MÉDIO", badge: "bg-amber-500/10 text-amber-600" }
        : { color: "#10B981", label: "BAIXO", badge: "bg-emerald-500/10 text-emerald-600" };

  const years = breaches.map((b) => new Date(b.BreachDate || b.AddedDate || "").getFullYear()).filter((y) => !isNaN(y)).sort();
  const yearFirst = years[0] || "—";
  const yearLast = years[years.length - 1] || "—";

  useEffect(() => {
    if (!scan && !cpf) navigate({ to: "/" });
  }, [scan, cpf, navigate]);

  useEffect(() => {
    if (firedView.current) return;
    firedView.current = true;
    track("ViewContent", { content_name: "Relatorio Resumido", value: 9.9, currency: "BRL" });
    gaEvent("view_relatorio", { breach_count: displayCount, risk_level: risk.label });
  }, [displayCount, risk.label]);

  const checkout = async (plan: CheckoutPlan) => {
    // InitiateCheckout (Pixel) + begin_checkout (GA4) fire inside startCheckout.
    setRedirecting(true);
    await startCheckout(plan);
    setRedirecting(false);
  };

  // Build the card list. 2 real breaches when opened (authority), everything
  // else locked/blurred — the curiosity comes from the volume of locked cards.
  const realCards = breaches.slice(0, 2).map((b, i) => {
    const dcs = (b.DataClasses ?? []).map(translateDC);
    return {
      name: b.Name || b.Title || "Vazamento detectado",
      types: dcs.slice(0, 2),
      hiddenCount: Math.max(0, dcs.length - 2),
      sevLabel: i === 0 ? "ALTO" : "MÉDIO",
      sevClass: i === 0 ? "text-red-600 bg-red-500/10" : "text-amber-600 bg-amber-500/10",
      locked: false,
    };
  });
  // If the scan returned no real breaches, still show one collapsed (locked) card.
  if (realCards.length === 0) {
    realCards.push({ name: "Base de dados comprometida", types: ["Senha"], hiddenCount: 2, sevLabel: "ALTO", sevClass: "text-red-600 bg-red-500/10", locked: true });
  }
  const lockedCount = Math.max(0, displayCount - realCards.length);
  const lockedCards = Array.from({ length: Math.min(6, lockedCount) }).map(() => ({
    name: "••••••••••••",
    types: ["••••• • •••••"],
    hiddenCount: 0,
    sevLabel: "MÉDIO",
    sevClass: "text-amber-600 bg-amber-500/10",
    locked: true,
  }));

  const logo = isDark ? "/PRIVA_logo_dark_theme.png" : "/PRIVA_logo_light_theme.png";

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-md px-5 pb-16">
        {/* Header */}
        <header className="sticky top-0 z-10 -mx-5 flex items-center justify-between bg-background px-5 py-4">
          <button onClick={() => navigate({ to: "/" })} aria-label="Voltar" className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-foreground hover:opacity-80">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <img src={logo} alt="PRIVA" className="h-5 w-auto object-contain" />
          <span className="h-9 w-9" />
        </header>

        {/* SECTION 1 — Score card (radial gauge: instant risk read, no prose) */}
        <section className="mt-2 rounded-3xl border border-indigo-500/25 bg-card p-6 text-center shadow-sm">
          <p className="text-xs tracking-widest text-muted-foreground">RELATÓRIO DE EXPOSIÇÃO DIGITAL</p>
          <div className="mt-4 flex justify-center">
            <AnimatedScoreGauge score={score} max={100} showMax />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Analisamos {Math.max(3, displayCount)} fontes verificadas</p>
          <div className="mt-5 grid grid-cols-3 border-t border-border pt-4 text-center">
            <div>
              <p className="text-2xl font-extrabold text-foreground">{displayCount}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">Vazamentos</p>
            </div>
            <div className="border-x border-border">
              <p className="text-2xl font-extrabold text-foreground">{yearFirst}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">Primeiro registro</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-foreground">{yearLast}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">Mais recente</p>
            </div>
          </div>
        </section>

        {/* SECTION 2 — Exposições encontradas. Closed: 1 real card + "Abrir
            relatório". Open (one-way): 2 real + locked/blurred rest, revealed
            one by one (~180ms stagger). Curiosity = volume of locked cards. */}
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-bold text-foreground">Exposições encontradas</h2>

          <BreachCard {...realCards[0]} />

          {expanded && (
            <>
              {realCards.slice(1).map((c, i) => (
                <BreachCard key={`r${i}`} {...c} delayMs={i * 150} />
              ))}
              {lockedCards.map((c, i) => (
                <BreachCard key={`l${i}`} {...c} delayMs={(realCards.length - 1 + i) * 150} />
              ))}
            </>
          )}

          {!expanded && (realCards.length > 1 || lockedCards.length > 0) && (
            <button
              onClick={() => setExpanded(true)}
              className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-3 text-sm font-semibold text-[var(--color-navy)] transition hover:bg-secondary/40"
            >
              Abrir relatório →
            </button>
          )}
        </section>

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
            <p className="mb-4 mt-6 text-center text-base font-semibold text-foreground">O que você está perdendo</p>
            <div className="grid grid-cols-2 gap-3">
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
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-purple-600 px-3 py-1 text-[10px] font-bold text-white">MAIS ESCOLHIDO</span>
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

            {/* Social proof + trust */}
            <div className="mt-6 flex items-center justify-center gap-2">
              <div className="flex -space-x-2">
                {["12", "32", "45"].map((n) => (
                  <img key={n} src={`https://i.pravatar.cc/48?img=${n}`} alt="" className="h-6 w-6 rounded-full border-2 border-background" />
                ))}
              </div>
              <span className="text-xs text-indigo-600">+{87 + (displayCount % 40)} pessoas protegidas hoje</span>
            </div>
            <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> LGPD</span>
              <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> Seguro</span>
              <span className="flex items-center gap-1"><XIcon className="h-3 w-3" /> Cancele quando quiser</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
