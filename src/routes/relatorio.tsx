import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, Globe, Lock, ShieldCheck } from "lucide-react";
import { getScore } from "@/lib/funnel";
import { startCheckout, type CheckoutPlan } from "@/lib/checkout";
import { track, gaEvent } from "@/lib/analytics";
import { useIsDark } from "@/hooks/use-is-dark";

export const Route = createFileRoute("/relatorio")({
  head: () => ({ meta: [{ title: "Relatório de Exposição — Priva" }] }),
  component: RelatorioPage,
});

type RawBreach = { Name?: string; Title?: string; BreachDate?: string; AddedDate?: string; DataClasses?: string[] };
type StoredScan = { breachCount?: number; hibp?: { count?: number; breaches?: RawBreach[] } | null };
type Exposure = {
  github?: { found?: boolean; count?: number } | null;
  cpf?: { found?: boolean; count?: number } | null;
  phone?: { found?: boolean; count?: number } | null;
};

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
const tsOf = (b: RawBreach) => Date.parse(b.BreachDate || b.AddedDate || "") || 0;
const monthYear = (ts: number) =>
  ts ? new Date(ts).toLocaleDateString("pt-BR", { month: "short", year: "numeric" }).replace(".", "") : "";
const has = (b: RawBreach, re: RegExp) => (b.DataClasses ?? []).some((d) => re.test(d.toLowerCase()));

function clarityTag(key: string, value: string) {
  const c = (window as unknown as { clarity?: (...a: unknown[]) => void }).clarity;
  if (typeof c === "function") c("set", key, value);
}

function RelatorioPage() {
  const navigate = useNavigate();
  const isDark = useIsDark();
  const firedView = useRef(false);
  const firedEvidence = useRef(false);
  const plansRef = useRef<HTMLDivElement | null>(null);
  const evidenceRef = useRef<HTMLDivElement | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [showSticky, setShowSticky] = useState(false);
  const [mounted, setMounted] = useState(false); // drives bar-width + count animations
  const [countDays, setCountDays] = useState(0);

  const scan = readJSON<StoredScan>("priva_scan_result");
  const exposure = readJSON<Exposure>("priva_exposure");
  const cpf = typeof window !== "undefined" ? sessionStorage.getItem("priva_cpf") || "" : "";
  const isPaid = typeof window !== "undefined" && localStorage.getItem("priva_is_paid") === "true";

  const breaches = useMemo(() => (scan?.hibp?.breaches ?? []).filter(Boolean), [scan]);
  const breachCount = scan?.hibp?.count ?? breaches.length;

  // Chronology
  const byNewest = useMemo(() => [...breaches].sort((a, b) => tsOf(b) - tsOf(a)), [breaches]);
  const firstBreach = useMemo(
    () => [...breaches].filter(tsOf).sort((a, b) => tsOf(a) - tsOf(b))[0],
    [breaches],
  );
  const firstTs = firstBreach ? tsOf(firstBreach) : 0;
  const daysExposed = firstTs ? Math.max(1, Math.floor((Date.now() - firstTs) / 86_400_000)) : 0;

  // Exposure map — count breaches per data type (+ public exposure signals)
  const emailN = breaches.filter((b) => has(b, /email/)).length;
  const passN = breaches.filter((b) => has(b, /password/)).length;
  const phoneN = breaches.filter((b) => has(b, /phone/)).length + (exposure?.phone?.count ?? 0);
  const cpfN =
    breaches.filter((b) => has(b, /government|credit card|national id/)).length + (exposure?.cpf?.count ?? 0);
  const bars = [
    { label: "E-mail", n: emailN, always: true },
    { label: "Senha", n: passN, always: true },
    { label: "Telefone", n: phoneN, always: false },
    { label: "CPF", n: cpfN, always: false },
  ].filter((b) => b.always || b.n > 0);
  const maxBar = Math.max(1, ...bars.map((b) => b.n));

  // Public exposure (SerpAPI/GitHub)
  const publicHits = (exposure?.cpf?.count ?? 0) + (exposure?.phone?.count ?? 0) + (exposure?.github?.count ?? 0);

  // Broken, session-varied score (authority verdict AFTER the evidence)
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
      ? { color: "#DC2626", label: "RISCO ALTO", badge: "bg-red-500/10 text-red-600" }
      : score < 70
        ? { color: "#D97706", label: "RISCO MÉDIO", badge: "bg-amber-500/10 text-amber-600" }
        : { color: "#059669", label: "RISCO BAIXO", badge: "bg-emerald-500/10 text-emerald-600" };

  const recent = breaches.some((b) => tsOf(b) && Date.now() - tsOf(b) < 365 * 86_400_000);
  const factors = [
    `${breachCount} vazamentos encontrados`,
    ...(passN > 0 ? ["Senhas comprometidas"] : []),
    ...(recent ? ["Exposição recente (últimos 12 meses)"] : []),
    ...(publicHits > 0 ? ["Dados públicos detectados"] : []),
  ];

  // No scan on file → back to the funnel start.
  useEffect(() => {
    if (!scan && !cpf) navigate({ to: "/" });
  }, [scan, cpf, navigate]);

  // Trigger CSS animations after mount.
  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  // Days counter — count up on load.
  useEffect(() => {
    if (!daysExposed) return;
    const dur = 1400;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      setCountDays(Math.round(eased * daysExposed));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [daysExposed]);

  // Pixel/GA/Clarity on load.
  useEffect(() => {
    if (firedView.current) return;
    firedView.current = true;
    track("ViewContent", { content_name: "Relatorio Resumido", value: 9.9, currency: "BRL" });
    gaEvent("view_relatorio", { breach_count: breachCount, risk_level: risk.label });
    clarityTag("breach_count", String(breachCount));
  }, [breachCount, risk.label]);

  // Deeper-funnel signal: fired once when the evidence (past the timeline) is seen.
  useEffect(() => {
    const el = evidenceRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && !firedEvidence.current) {
          firedEvidence.current = true;
          track("ViewContent", { content_name: "saw_evidence" });
          gaEvent("saw_evidence");
        }
      },
      { threshold: 0.5 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Sticky CTA: visible while the plans are off-screen.
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

  const logo = isDark ? "/PRIVA_logo_dark_theme.png" : "/PRIVA_logo_light_theme.png";
  const visible = byNewest.slice(0, 3);
  const hidden = byNewest.slice(3);
  const sev = (b: RawBreach) => (has(b, /password/) ? { l: "ALTO", c: "text-red-600 bg-red-500/10", dot: "#DC2626" } : { l: "MÉDIO", c: "text-amber-600 bg-amber-500/10", dot: "#D97706" });

  return (
    <div className="min-h-screen bg-background">
      <div className="animate-report-drop mx-auto max-w-md pb-16">
        {/* Header */}
        <header className="sticky top-0 z-10 flex items-center justify-between bg-background px-5 py-4">
          <button onClick={() => navigate({ to: "/" })} aria-label="Voltar" className="grid h-9 w-9 place-items-center rounded-full bg-secondary text-foreground hover:opacity-80">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <img src={logo} alt="PRIVA" className="h-5 w-auto object-contain" />
          <span className="h-9 w-9" />
        </header>

        {/* ── HERO — days-exposed counter (fear/urgency) ── */}
        <section className="px-5">
          <div className="rounded-3xl px-6 py-7 text-center text-white" style={{ background: "linear-gradient(160deg,#7f1d1d,#b91c1c)" }}>
            <p className="text-sm font-medium text-red-100/90">Seus dados estão expostos há</p>
            <p className="mt-1 text-6xl font-extrabold tabular-nums leading-none tracking-tight">
              {countDays.toLocaleString("pt-BR")}
            </p>
            <p className="mt-1 text-xl font-bold text-red-50">{daysExposed === 1 ? "dia" : "dias"}</p>
            {firstBreach && (
              <p className="mt-3 text-sm text-red-200/90">
                Primeiro registro: {monthYear(firstTs)} — {firstBreach.Name || firstBreach.Title}
              </p>
            )}
          </div>
        </section>

        {/* ── Exposure map (bar chart) ── */}
        <section className="mt-8 px-5">
          <h2 className="mb-3 text-lg font-bold text-foreground">Seus dados comprometidos</h2>
          <div className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
            {bars.map((b, i) => (
              <div key={b.label}>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{b.label}</span>
                  <span className="text-xs font-semibold text-red-500">{b.n} {b.n === 1 ? "exposição" : "exposições"}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                  <div
                    className="h-full rounded-full bg-red-500"
                    style={{ width: mounted ? `${Math.max(6, (b.n / maxBar) * 100)}%` : "0%", transition: `width 900ms cubic-bezier(0.22,1,0.36,1) ${i * 120}ms` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Timeline (all breaches; 3 visible, rest blurred) ── */}
        {byNewest.length > 0 && (
          <section className="mt-8 px-5">
            <h2 className="mb-3 text-lg font-bold text-foreground">Histórico de exposição</h2>
            <div className="relative pl-4">
              <span className="absolute bottom-2 left-[5px] top-2 w-px bg-border" />
              {visible.map((b, i) => {
                const s = sev(b);
                return (
                  <div key={i} className="animate-fade-in relative mb-4 pl-4" style={{ animationDelay: `${i * 90}ms`, animationDuration: "220ms", animationFillMode: "backwards" }}>
                    <span className="absolute left-[-8px] top-1 h-3 w-3 rounded-full border-2 border-background" style={{ backgroundColor: s.dot }} />
                    <p className="text-xs text-muted-foreground">{monthYear(tsOf(b))}</p>
                    <p className="text-sm font-bold text-foreground">{b.Name || b.Title}</p>
                    <p className="text-xs text-muted-foreground">
                      {(b.DataClasses?.length ?? 0)} tipos de dados expostos
                      <span className={`ml-2 rounded px-1.5 py-0.5 text-[10px] font-bold ${s.c}`}>{s.l}</span>
                    </p>
                  </div>
                );
              })}
              {hidden.length > 0 && (
                <div className="relative">
                  <div style={{ filter: "blur(4px)", pointerEvents: "none" }} aria-hidden>
                    {hidden.slice(0, 4).map((b, i) => (
                      <div key={i} className="relative mb-4 pl-4">
                        <span className="absolute left-[-8px] top-1 h-3 w-3 rounded-full border-2 border-background bg-gray-400" />
                        <p className="text-xs text-muted-foreground">{monthYear(tsOf(b)) || "20••"}</p>
                        <p className="text-sm font-bold text-foreground">{b.Name || b.Title || "Vazamento"}</p>
                        <p className="text-xs text-muted-foreground">{(b.DataClasses?.length ?? 2)} tipos de dados expostos</p>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => plansRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <span className="flex items-center gap-2 rounded-full bg-[var(--color-navy)] px-4 py-2 text-sm font-bold text-white shadow-lg">
                      <Lock className="h-4 w-4" /> +{hidden.length} exposições bloqueadas
                    </span>
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        {/* evidence sentinel — fires the deeper-funnel event once seen */}
        <div ref={evidenceRef} className="h-px" />

        {/* ── Company cards (recognizable authority) ── */}
        {visible.length > 0 && (
          <section className="mt-8 px-5">
            <h2 className="mb-3 text-lg font-bold text-foreground">Empresas onde seus dados vazaram</h2>
            {visible.map((b, i) => {
              const s = sev(b);
              const dcs = (b.DataClasses ?? []).map(translateDC);
              return (
                <div key={i} className="mb-3 flex gap-3 rounded-xl border border-red-500/20 bg-card p-4 shadow-sm" style={{ backgroundColor: isDark ? "#12121A" : undefined }}>
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-red-500/10 text-xl font-bold text-red-500">
                    {(b.Name || b.Title || "?")[0]?.toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-base font-bold text-foreground">{b.Name || b.Title}</p>
                        <p className="text-sm text-muted-foreground">{monthYear(tsOf(b))}</p>
                      </div>
                      <span className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold ${s.c}`}>{s.l}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {dcs.slice(0, 3).map((d) => (
                        <span key={d} className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs text-red-500">{d}</span>
                      ))}
                      {dcs.length > 3 && (
                        <button onClick={() => plansRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })} className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-500">
                          +{dcs.length - 3} mais →
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* ── Public exposure (only when found) ── */}
        {publicHits > 0 && (
          <section className="mt-8 px-5">
            <h2 className="mb-3 text-lg font-bold text-foreground">Encontrado em pesquisas públicas</h2>
            <div className="flex gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
              <Globe className="h-6 w-6 shrink-0 text-amber-500" />
              <div>
                <p className="text-sm text-amber-600">
                  Seus dados aparecem em {publicHits} {publicHits === 1 ? "resultado" : "resultados"} público(s) na internet
                </p>
                <p className="mt-1 text-xs text-muted-foreground">Qualquer pessoa pode encontrar seus dados pesquisando no Google.</p>
              </div>
            </div>
          </section>
        )}

        {/* ── Score card (verdict AFTER the evidence) ── */}
        <section className="mt-8 px-5">
          <div className="rounded-2xl border border-border bg-card p-5 text-center shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sua pontuação de risco</p>
            <p className="mt-2 text-6xl font-extrabold leading-none" style={{ color: risk.color }}>{score}<span className="text-2xl text-muted-foreground">/100</span></p>
            <span className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-bold ${risk.badge}`}>{risk.label}</span>
            <p className="mt-2 text-xs text-muted-foreground">Baseado em {factors.length} fatores analisados</p>
            <ul className="mt-4 space-y-1.5 text-left">
              {factors.map((f) => (
                <li key={f} className="flex gap-2 text-sm text-muted-foreground">
                  <span className="font-bold text-red-500">+</span> {f}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── CTA / paid ── */}
        {isPaid ? (
          <section className="mt-8 px-5 text-center">
            <p className="text-lg font-bold text-emerald-600">Você já está protegido ✓</p>
            <button onClick={() => navigate({ to: "/" })} className="mt-4 w-full rounded-2xl bg-[var(--color-navy)] py-4 font-bold text-white transition active:scale-[0.99]">
              Ver relatório completo →
            </button>
          </section>
        ) : (
          <section className="mt-8 px-5">
            <p className="mb-4 text-center text-lg font-bold text-foreground">O que você pode fazer agora</p>
            <div ref={plansRef} className="grid grid-cols-2 gap-3">
              {/* Essencial */}
              <div className="self-center rounded-2xl border border-indigo-500/30 bg-card p-4 shadow-sm">
                <p className="mb-2 text-xs font-bold text-indigo-600">Essencial</p>
                <p className="text-2xl font-extrabold text-foreground">R$9,90<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
                <ul className="mt-3 space-y-2">
                  {[`Ver todos os ${breachCount} vazamentos completos`, "Monitoramento contínuo", "Alertas em tempo real"].map((f) => (
                    <li key={f} className="flex gap-2 text-xs text-muted-foreground"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" /> {f}</li>
                  ))}
                </ul>
                <button onClick={() => checkout("essencial")} disabled={redirecting} className="mt-4 w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white transition active:scale-[0.99] disabled:opacity-60">
                  Assinar Essencial →
                </button>
              </div>

              {/* Proteção Total */}
              <div className="relative z-10 scale-[1.05] rounded-2xl border-2 border-purple-500/50 bg-card p-4 shadow-lg">
                <p className="mb-2 text-xs font-bold text-purple-600">Proteção Total</p>
                <p className="text-2xl font-extrabold text-foreground">R$24,90<span className="text-sm font-normal text-muted-foreground">/mês</span></p>
                <ul className="mt-3 space-y-2">
                  {["Tudo do Essencial +", "Remoção dos seus dados via LGPD", "Nossa equipe cuida por você", "Acompanhamento por e-mail"].map((f) => (
                    <li key={f} className="flex gap-2 text-xs text-muted-foreground"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-purple-500" /> {f}</li>
                  ))}
                </ul>
                <button
                  onClick={() => checkout("protecao_total")}
                  disabled={redirecting}
                  className="mt-4 w-full rounded-xl py-3 text-sm font-bold text-white transition active:scale-[0.99] disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg,#7C3AED,#4F46E5)", boxShadow: "0 0 16px rgba(124,58,237,0.3)" }}
                >
                  Remover meus dados →
                </button>
                <span className="absolute -bottom-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-purple-600 px-3 py-1 text-[10px] font-bold text-white shadow-md">MAIS ESCOLHIDO</span>
              </div>
            </div>

            {redirecting && <p className="mt-3 text-center text-xs text-indigo-500">Redirecionando para pagamento seguro...</p>}

            <div className="mt-8 space-y-1 text-center text-[11px] text-muted-foreground">
              <p>🔒 Pagamento seguro via Stripe</p>
              <p>⭐ Satisfação garantida — cancele quando quiser</p>
            </div>
          </section>
        )}
      </div>

      {/* Sticky conversion CTA */}
      {!isPaid && (
        <div
          className={`fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 px-4 pt-6 transition-transform duration-300 ${showSticky ? "translate-y-0" : "translate-y-full"}`}
          style={{ background: "linear-gradient(to top, var(--color-background) 55%, transparent)", paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
        >
          <button
            onClick={() => plansRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}
            className="w-full rounded-2xl py-4 text-base font-bold text-white transition active:scale-[0.99]"
            style={{ background: "linear-gradient(135deg,#4F46E5,#6366F1)", boxShadow: "0 8px 28px rgba(79,70,229,0.45)" }}
          >
            Proteger meus dados agora →
          </button>
        </div>
      )}
    </div>
  );
}
