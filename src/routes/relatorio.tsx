import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, ChevronDown, ChevronUp, Lock, Shield, X as XIcon } from "lucide-react";
import { getScore } from "@/lib/funnel";
import { startCheckout, type CheckoutPlan } from "@/lib/checkout";
import { track, gaEvent } from "@/lib/analytics";
import { useIsDark } from "@/hooks/use-is-dark";

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
function last2Year(d?: string): string {
  if (!d) return "24";
  const y = new Date(d).getFullYear();
  return isNaN(y) ? "24" : String(y).slice(-2);
}

// One breach row — identical layout whether real or locked (blurred).
function BreachCard({
  name,
  yearLast2,
  types,
  hiddenCount,
  sevLabel,
  sevClass,
  locked = false,
}: {
  name: string;
  yearLast2: string;
  types: string[];
  hiddenCount: number;
  sevLabel: string;
  sevClass: string;
  locked?: boolean;
}) {
  return (
    <div className="mb-3 rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`truncate font-bold text-foreground ${locked ? "select-none blur-sm" : ""}`}>{name}</p>
          <p className="text-xs text-muted-foreground">
            Vazamento · 20<span className="select-none blur-[3px]">{yearLast2}</span>
          </p>
        </div>
        <span className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold ${sevClass}`}>{sevLabel}</span>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {types.map((d, i) => (
          <span key={i} className={`flex items-center gap-1.5 ${locked ? "select-none blur-sm" : ""}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> {d}
          </span>
        ))}
        {hiddenCount > 0 && (
          <span className="flex items-center gap-1.5 text-muted-foreground/70">
            <Lock className="h-3 w-3" /> +{hiddenCount} dados ocultos
          </span>
        )}
      </div>
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
    const value = plan === "essencial" ? 9.9 : 24.9;
    track("InitiateCheckout", { value, currency: "BRL", content_name: plan });
    gaEvent("begin_checkout", { currency: "BRL", value, items: [{ item_name: plan }] });
    setRedirecting(true);
    await startCheckout(plan);
    setRedirecting(false);
  };

  // Build the card list. Real breaches first (up to 3 shown when expanded),
  // remaining slots locked/blurred. Same layout throughout.
  const realCards = breaches.slice(0, 3).map((b, i) => {
    const dcs = (b.DataClasses ?? []).map(translateDC);
    return {
      name: b.Name || b.Title || "Vazamento detectado",
      yearLast2: last2Year(b.BreachDate || b.AddedDate),
      types: dcs.slice(0, 2),
      hiddenCount: Math.max(0, dcs.length - 2),
      sevLabel: i === 0 ? "ALTO" : "MÉDIO",
      sevClass: i === 0 ? "text-red-600 bg-red-500/10" : "text-amber-600 bg-amber-500/10",
      locked: false,
    };
  });
  // If the scan returned no real breaches, still show one collapsed (locked) card.
  if (realCards.length === 0) {
    realCards.push({ name: "Base de dados comprometida", yearLast2: "22", types: ["Senha"], hiddenCount: 2, sevLabel: "ALTO", sevClass: "text-red-600 bg-red-500/10", locked: true });
  }
  const lockedCount = Math.max(0, displayCount - realCards.length);
  const lockedCards = Array.from({ length: Math.min(6, lockedCount) }).map(() => ({
    name: "Exposição em base comprometida",
    yearLast2: "••",
    types: ["Dados sensíveis"],
    hiddenCount: 2,
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

        {/* SECTION 1 — Score card */}
        <section className="mt-2 rounded-3xl border border-indigo-500/25 bg-card p-6 text-center shadow-sm">
          <p className="text-xs tracking-widest text-muted-foreground">RELATÓRIO DE EXPOSIÇÃO DIGITAL</p>
          <p className="mt-3 text-7xl font-extrabold leading-none" style={{ color: risk.color }}>{score}</p>
          <span className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-bold ${risk.badge}`}>{risk.label}</span>
          <p className="mt-3 text-sm text-muted-foreground">Baseado em {Math.max(3, displayCount)} fontes verificadas</p>
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

        {/* SECTION 2 — Exposições encontradas (accordion) */}
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-bold text-foreground">Exposições encontradas</h2>

          {/* Collapsed: 1 real card. Expanded: up to 3 real + locked rest. */}
          <BreachCard {...realCards[0]} />

          {expanded && (
            <>
              {realCards.slice(1).map((c, i) => (
                <BreachCard key={`r${i}`} {...c} />
              ))}
              {lockedCards.map((c, i) => (
                <BreachCard key={`l${i}`} {...c} />
              ))}
            </>
          )}

          {(realCards.length > 1 || lockedCards.length > 0) && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-xl border border-border bg-card py-3 text-sm font-semibold text-[var(--color-navy)] transition hover:bg-secondary/40"
            >
              {expanded ? (
                <>Ver menos <ChevronUp className="h-4 w-4" /></>
              ) : (
                <>Ver todas as {displayCount} exposições <ChevronDown className="h-4 w-4" /></>
              )}
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
              <div className="rounded-2xl border border-indigo-500/30 bg-card p-4 shadow-sm">
                <p className="mb-2 text-xs font-bold text-indigo-600">Essencial</p>
                <p className="text-2xl font-extrabold text-foreground">R$9,90<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
                <ul className="mt-3 space-y-2">
                  {[
                    `Relatório completo (todos os ${displayCount} vazamentos)`,
                    "Dados completos de cada exposição",
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

              {/* Proteção Total */}
              <div className="relative rounded-2xl border-2 border-purple-500/50 bg-card p-4 shadow-sm">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-purple-600 px-3 py-1 text-[10px] font-bold text-white">MAIS COMPLETO</span>
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
                  Remover dados →
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
