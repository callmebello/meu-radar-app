import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Calendar,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Eye,
  Globe,
  IdCard,
  KeyRound,
  Lock,
  Mail,
  Phone,
  ShieldAlert,
  Share2,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { highlightedReportLabels, readQuizAnswers } from "@/lib/quiz";
import { startCheckout, type CheckoutPlan } from "@/lib/checkout";
import { track, gaEvent } from "@/lib/analytics";
import { useIsDark } from "@/hooks/use-is-dark";
import { ShareResultSheet } from "@/components/meu-radar/ShareResultSheet";
import { computeScore, riskLevel } from "@/lib/riskScore";
import {
  displayName,
  logoOf,
  pwnCountLabel,
  rankForDisplay,
  recognisableCompanies,
  type Breach,
} from "@/lib/breaches";

export const Route = createFileRoute("/relatorio")({
  head: () => ({ meta: [{ title: "Relatório de Exposição — Priva" }] }),
  component: RelatorioPage,
});

type RawBreach = Breach;
type StoredScan = {
  breachCount?: number;
  hibp?: { count?: number; breaches?: RawBreach[] } | null;
};
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
  ts
    ? new Date(ts).toLocaleDateString("pt-BR", { month: "short", year: "numeric" }).replace(".", "")
    : "";
const has = (b: RawBreach, re: RegExp) =>
  (b.DataClasses ?? []).some((d) => re.test(d.toLowerCase()));

function clarityTag(key: string, value: string) {
  const c = (window as unknown as { clarity?: (...a: unknown[]) => void }).clarity;
  if (typeof c === "function") c("set", key, value);
}

/** Maps a score factor to its icon, keeping lib/riskScore free of UI imports. */
const FACTOR_ICON = { eye: Eye, key: KeyRound, clock: Clock, globe: Globe } as const;

/** The four data types we can state something about, with their own icon. */
const DATA_TYPES = [
  { label: "E-mail", Icon: Mail },
  { label: "CPF", Icon: IdCard },
  { label: "Senha", Icon: KeyRound },
  { label: "Telefone", Icon: Phone },
] as const;

function RelatorioPage() {
  const navigate = useNavigate();
  const isDark = useIsDark();
  const firedView = useRef(false);
  const firedEvidence = useRef(false);
  const plansRef = useRef<HTMLDivElement | null>(null);
  const evidenceRef = useRef<HTMLDivElement | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [showSticky, setShowSticky] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [expandedType, setExpandedType] = useState<string | null>(null);
  const [whereOpen, setWhereOpen] = useState(false);
  const [failedLogos, setFailedLogos] = useState<Set<string>>(new Set());
  const [mounted, setMounted] = useState(false);

  // Scan is read from localStorage AND re-read for a few seconds: the HIBP
  // result can land right after the scan navigation, so poll until breaches
  // appear (or give up) instead of rendering an empty report forever.
  const [scan, setScan] = useState<StoredScan | null>(() =>
    readJSON<StoredScan>("priva_scan_result"),
  );
  useEffect(() => {
    if ((scan?.hibp?.breaches?.length ?? 0) > 0) return;
    let tries = 0;
    const id = setInterval(() => {
      tries += 1;
      const fresh = readJSON<StoredScan>("priva_scan_result");
      if ((fresh?.hibp?.breaches?.length ?? 0) > 0 || tries >= 20) {
        if (fresh) setScan(fresh);
        clearInterval(id);
      }
    }, 500);
    return () => clearInterval(id);
  }, [scan]);

  const exposure = readJSON<Exposure>("priva_exposure");
  const cpf = typeof window !== "undefined" ? sessionStorage.getItem("priva_cpf") || "" : "";
  const isPaid = typeof window !== "undefined" && localStorage.getItem("priva_is_paid") === "true";

  const breaches = useMemo(() => (scan?.hibp?.breaches ?? []).filter(Boolean), [scan]);
  const breachCount = scan?.hibp?.count ?? breaches.length;

  // Recognisable companies lead; stealer logs sink.
  const ranked = useMemo(() => rankForDisplay(breaches), [breaches]);
  const companies = useMemo(() => recognisableCompanies(breaches), [breaches]);
  const firstBreach = useMemo(
    () => [...breaches].filter(tsOf).sort((a, b) => tsOf(a) - tsOf(b))[0],
    [breaches],
  );
  const firstTs = firstBreach ? tsOf(firstBreach) : 0;

  // What the person told us in the quiz comes back as "você indicou".
  const flagged = useMemo(() => new Set(highlightedReportLabels(readQuizAnswers().q2)), []);

  // Per-type findings. Memoised: it feeds the score memo below, and a fresh
  // object each render would recompute (and re-animate) on every state change.
  const phoneHits = exposure?.phone?.count ?? 0;
  const cpfHits = exposure?.cpf?.count ?? 0;
  const githubHits = exposure?.github?.count ?? 0;
  const counts: Record<string, number> = useMemo(
    () => ({
      "E-mail": breaches.filter((b) => has(b, /email/)).length,
      Senha: breaches.filter((b) => has(b, /password/)).length,
      Telefone: breaches.filter((b) => has(b, /phone/)).length + phoneHits,
      CPF: breaches.filter((b) => has(b, /government|credit card|national id/)).length + cpfHits,
    }),
    [breaches, phoneHits, cpfHits],
  );
  const publicHits = cpfHits + phoneHits + githubHits;
  const recent = breaches.some((b) => tsOf(b) && Date.now() - tsOf(b) < 365 * 86_400_000);

  // Deterministic score from the evidence — see lib/riskScore.
  const { score, factors } = useMemo(
    () =>
      computeScore({
        breachCount,
        passwordExposed: counts["Senha"] > 0,
        recent,
        publicHits,
      }),
    [breachCount, counts, recent, publicHits],
  );
  const risk = riskLevel(score);

  // The person hands us e-mail and CPF, so those two are always answered — and
  // "NÃO ENCONTRADO" is a real, reassuring answer. Senha is always relevant
  // because it is what a breach usually leaks. Telefone only appears when they
  // actually gave one (or we found something), so the list stays truthful
  // rather than padded with rows we never looked into.
  const hasPhone = useMemo(() => {
    if (typeof window === "undefined") return false;
    try {
      const prof = JSON.parse(localStorage.getItem("priva_profile") || "{}");
      return Boolean(prof.extraPhone);
    } catch {
      return false;
    }
  }, []);
  const shownTypes = DATA_TYPES.filter((t) =>
    t.label === "Telefone" ? hasPhone || counts[t.label] > 0 || flagged.has(t.label) : true,
  );
  const exposedTypes = shownTypes.filter((t) => counts[t.label] > 0).map((t) => t.label);

  /** Which breaches carried a given data type — powers the expanded row. */
  const breachesWithType = (label: string) => {
    const re =
      label === "E-mail"
        ? /email/
        : label === "Senha"
          ? /password/
          : label === "Telefone"
            ? /phone/
            : /government|credit card|national id/;
    return ranked.filter((b) => has(b, re)).slice(0, 6);
  };

  // No scan on file → back to the funnel start.
  useEffect(() => {
    if (!scan && !cpf) navigate({ to: "/" });
  }, [scan, cpf, navigate]);

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    if (firedView.current) return;
    firedView.current = true;
    track("ViewContent", { content_name: "Relatorio Resumido", value: 9.9, currency: "BRL" });
    gaEvent("view_relatorio", { breach_count: breachCount, risk_level: risk.label });
    clarityTag("breach_count", String(breachCount));
  }, [breachCount, risk.label]);

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
    const obs = new IntersectionObserver(([e]) => setShowSticky(!e.isIntersecting), {
      threshold: 0.25,
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [isPaid]);

  const checkout = async (plan: CheckoutPlan) => {
    setRedirecting(true);
    await startCheckout(plan);
    setRedirecting(false);
  };

  const goPlans = () => plansRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });

  const logo = isDark ? "/PRIVA_logo_dark_theme.png" : "/PRIVA_logo_light_theme.png";
  const listSource = companies.length > 0 ? companies : ranked;
  // One source, then up to three, then the rest behind the plan.
  const openRows = isPaid
    ? listSource
    : whereOpen
      ? listSource.slice(0, 3)
      : listSource.slice(0, 1);
  const lockedRows = isPaid ? [] : listSource.slice(3, 6);
  const lockedCount = Math.max(0, listSource.length - 3);

  /** One source line. Falls back to the initial when the logo can't load. */
  const SourceRow = ({ b, first }: { b: RawBreach; first: boolean }) => {
    const name = displayName(b);
    const src = logoOf(b);
    const broken = !src || failedLogos.has(name);
    const dcs = (b.DataClasses ?? []).map(translateDC).slice(0, 3);
    const scale = pwnCountLabel(b);
    return (
      <div
        className={`flex items-center gap-3 px-4 py-3.5 ${first ? "" : "border-t border-border"}`}
      >
        {broken ? (
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--color-navy)]/10 text-[15px] font-bold text-[var(--color-navy)]">
            {name[0]?.toUpperCase() ?? "?"}
          </span>
        ) : (
          <img
            src={src}
            alt=""
            loading="lazy"
            onError={() => setFailedLogos((prev) => new Set(prev).add(name))}
            className="h-10 w-10 shrink-0 rounded-full bg-white object-contain p-1"
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold text-foreground">{name}</p>
          <p className="truncate text-[12px] text-muted-foreground">
            {dcs.length > 0 ? dcs.join(" · ") : "Dados pessoais"}
            {scale ? ` · ${scale}` : ""}
          </p>
        </div>
        <span className="shrink-0 text-[12px] text-muted-foreground">
          {monthYear(tsOf(b)) || "—"}
        </span>
      </div>
    );
  };

  const headlineTypes =
    exposedTypes.length === 0
      ? "Seus dados"
      : exposedTypes.length === 1
        ? `Seu ${exposedTypes[0].toLowerCase()}`
        : `Seu ${exposedTypes[0].toLowerCase()} e ${exposedTypes[1].toLowerCase()}`;

  return (
    <div className="min-h-screen bg-background">
      <div className="animate-report-drop mx-auto max-w-md pb-40">
        {/* Header */}
        <header className="sticky top-0 z-10 flex items-center justify-between bg-background px-5 py-4">
          <button
            onClick={() => navigate({ to: "/" })}
            aria-label="Voltar"
            className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <img src={logo} alt="PRIVA" className="h-5 w-auto object-contain" />
          <button
            onClick={() => {
              setShareOpen(true);
              gaEvent("share_opened");
            }}
            aria-label="Compartilhar resultado"
            className="grid h-10 w-10 place-items-center rounded-full bg-secondary text-foreground"
          >
            <Share2 className="h-5 w-5" />
          </button>
        </header>

        {/* ── 1. VERDICT — the value, first ────────────────────────── */}
        <section className="px-5">
          <div
            className="relative overflow-hidden rounded-3xl border p-6"
            style={{ borderColor: `${risk.color}33`, backgroundColor: risk.bg }}
          >
            <span
              className="pointer-events-none absolute -right-8 -top-8 h-44 w-44 rounded-full opacity-20"
              style={{ backgroundColor: risk.color, filter: "blur(48px)" }}
              aria-hidden
            />
            <span
              className="relative inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
              style={{ backgroundColor: `${risk.color}1f`, color: risk.color }}
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              {risk.label}
            </span>

            <h1 className="relative mt-3 text-[27px] font-bold leading-tight tracking-tight text-foreground">
              Encontramos dados
              <br />
              seus <span style={{ color: risk.color }}>expostos</span>.
            </h1>

            <p className="relative mt-3 max-w-[17rem] text-[14.5px] leading-relaxed text-muted-foreground">
              {headlineTypes} {exposedTypes.length > 1 ? "apareceram" : "apareceu"} em{" "}
              <span className="font-bold text-foreground">
                {breachCount} {breachCount === 1 ? "vazamento" : "vazamentos"}
              </span>{" "}
              identificados pela Priva.
            </p>

            {firstTs > 0 && (
              <p className="relative mt-4 flex items-center gap-1.5 text-[12.5px] text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                Primeiro registro: {monthYear(firstTs)}
              </p>
            )}
          </div>
        </section>

        {/* ── 2. WHAT WE FOUND — one row per data type ─────────── */}
        <section className="mt-7 px-5">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-[17px] font-bold text-foreground">O que encontramos</h2>
            <span className="rounded-full bg-[var(--color-navy)]/10 px-2 py-0.5 text-[11px] font-semibold text-[var(--color-navy)]">
              {breachCount} {breachCount === 1 ? "exposição" : "exposições"}
            </span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {shownTypes.map((t, i) => {
              const n = counts[t.label];
              const exposed = n > 0;
              const open = expandedType === t.label;
              const where = exposed ? breachesWithType(t.label) : [];
              return (
                <div key={t.label} className={i > 0 ? "border-t border-border" : undefined}>
                  <button
                    type="button"
                    // Nothing to open when there is nothing to show.
                    onClick={() => exposed && setExpandedType(open ? null : t.label)}
                    className={`flex w-full items-center gap-3 px-4 py-3.5 text-left ${exposed ? "" : "cursor-default"}`}
                  >
                    {/* The icon stays brand indigo whatever the finding — the badge
                        carries the verdict. Red icons made the whole list read as
                        alarm, which is not what "não encontrado" means. */}
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--color-navy)]/10">
                      <t.Icon
                        className="h-[18px] w-[18px] text-[var(--color-navy)]"
                        strokeWidth={1.9}
                      />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-[14.5px] font-bold text-foreground">{t.label}</span>
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                          style={{
                            backgroundColor: exposed
                              ? "rgba(220,38,38,0.10)"
                              : "rgba(15,169,104,0.10)",
                            color: exposed ? "#DC2626" : "#0FA968",
                          }}
                        >
                          {exposed ? (
                            <>
                              <ShieldAlert className="h-3 w-3" /> EXPOSTO
                            </>
                          ) : (
                            <>
                              <ShieldCheck className="h-3 w-3" /> NÃO ENCONTRADO
                            </>
                          )}
                        </span>
                        {flagged.has(t.label) && (
                          <span className="rounded-full bg-[var(--color-navy)]/10 px-1.5 py-0.5 text-[9.5px] font-semibold text-[var(--color-navy)]">
                            você indicou
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-[12.5px] text-muted-foreground">
                        {exposed
                          ? `Encontrado em ${n} ${n === 1 ? "vazamento" : "vazamentos"}`
                          : "Nenhum vazamento encontrado"}
                      </span>
                    </span>

                    {exposed && (
                      <ChevronDown
                        className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300"
                        style={{ transform: open ? "rotate(180deg)" : "none" }}
                      />
                    )}
                  </button>

                  {/* Grid-rows trick: animates open without knowing the height. */}
                  <div
                    className="grid transition-all duration-300 ease-out"
                    style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
                  >
                    <div className="overflow-hidden">
                      <ul className="space-y-1.5 px-4 pb-3.5 pl-[68px]">
                        {where.map((b, j) => (
                          <li
                            key={j}
                            className="flex items-center justify-between gap-3 text-[12.5px]"
                          >
                            <span className="truncate text-foreground">{displayName(b)}</span>
                            <span className="shrink-0 text-muted-foreground">
                              {monthYear(tsOf(b)) || "—"}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 3. WHERE — one source, then three, then the locked rest ── */}
        {listSource.length > 0 && (
          <section className="mt-7 px-5">
            <h2 className="mb-3 text-[17px] font-bold text-foreground">
              {companies.length > 0 ? "Onde seus dados apareceram" : "Onde seus dados foram vistos"}
            </h2>
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              {openRows.map((b, i) => (
                <SourceRow key={i} b={b} first={i === 0} />
              ))}

              {/* Collapsed: a single source and the invitation to see the rest. */}
              {!whereOpen && listSource.length > 1 && (
                <button
                  onClick={() => setWhereOpen(true)}
                  className="flex w-full items-center justify-center gap-1.5 border-t border-border py-3.5 text-[13.5px] font-bold text-[var(--color-navy)]"
                >
                  Ver onde mais apareceram <ChevronDown className="h-4 w-4" />
                </button>
              )}

              {/* Expanded and unpaid: the next sources are there, blurred, so the
                  value of subscribing is visible rather than described. */}
              {whereOpen && !isPaid && lockedRows.length > 0 && (
                <div className="relative border-t border-border">
                  <div aria-hidden style={{ filter: "blur(5px)" }} className="pointer-events-none">
                    {lockedRows.map((b, i) => (
                      <SourceRow key={i} b={b} first={i === 0} />
                    ))}
                  </div>
                  <button
                    onClick={goPlans}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6"
                    style={{ background: "color-mix(in srgb, var(--color-card) 55%, transparent)" }}
                  >
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--color-navy)]/12">
                      <Lock className="h-4 w-4 text-[var(--color-navy)]" />
                    </span>
                    <span className="text-center text-[13.5px] font-bold text-foreground">
                      Mais {lockedCount} {lockedCount === 1 ? "fonte" : "fontes"} encontradas
                    </span>
                    <span className="rounded-full bg-[var(--color-navy)] px-3.5 py-1.5 text-[12px] font-bold text-white">
                      Ver relatório completo
                    </span>
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        <div ref={evidenceRef} className="h-px" />

        {/* ── 4. SCORE — verdict after the evidence ────────────────── */}
        <section className="mt-7 px-5">
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex items-start gap-4 p-5">
              <span className="hidden h-12 w-12 shrink-0 place-items-center rounded-full bg-[var(--color-navy)]/10 sm:grid">
                <ShieldCheck className="h-6 w-6 text-[var(--color-navy)]" strokeWidth={1.9} />
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-bold text-foreground">Sua pontuação de exposição</p>
                <p
                  className="mt-2 text-[44px] font-extrabold leading-none"
                  style={{ color: risk.color }}
                >
                  {score}
                  <span className="text-[20px] font-semibold text-muted-foreground">/100</span>
                </p>
              </div>

              {/* Gauge — fills with the score, coloured by risk band. */}
              <div className="relative h-[104px] w-[104px] shrink-0">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="var(--color-border)"
                    strokeWidth="9"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke={risk.color}
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeDasharray={2 * Math.PI * 42}
                    strokeDashoffset={2 * Math.PI * 42 * (1 - (mounted ? score : 0) / 100)}
                    style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.22,1,0.36,1)" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center px-2 text-center">
                  <span className="text-[9.5px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Risco
                  </span>
                  <span
                    className="text-[15px] font-extrabold uppercase leading-none"
                    style={{ color: risk.color }}
                  >
                    {risk.label.replace("RISCO ", "")}
                  </span>
                </div>
              </div>
            </div>

            <ul className="border-t border-border">
              {factors.map((f) => (
                <li
                  key={f.label}
                  className="flex items-center gap-3 border-b border-border px-5 py-3.5 last:border-b-0"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--color-navy)]/10">
                    {(() => {
                      const FIcon = FACTOR_ICON[f.icon];
                      return (
                        <FIcon className="h-4 w-4 text-[var(--color-navy)]" strokeWidth={1.9} />
                      );
                    })()}
                  </span>
                  <span className="min-w-0 flex-1 text-[13.5px] text-foreground">{f.label}</span>
                  <span className="shrink-0 text-[15px] font-bold" style={{ color: risk.color }}>
                    −{f.weight}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── 5. RECOMMENDATIONS — things they can do themselves ───── */}
        <section className="mt-7 px-5">
          <h2 className="mb-3 text-[17px] font-bold text-foreground">
            O que recomendamos para você
          </h2>
          <div className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-3">
            {[
              {
                Icon: KeyRound,
                title: "Troque a senha comprometida",
                text: "Use uma senha forte e única em cada conta importante.",
              },
              {
                Icon: Lock,
                title: "Ative a verificação em duas etapas",
                text: "Mesmo com a senha vazada, ninguém entra sem o segundo fator.",
              },
              {
                Icon: ShieldCheck,
                title: "Assine a Priva",
                text: "Pedimos a remoção dos seus dados nas fontes e seguimos monitorando para avisar de vazamentos novos.",
              },
            ].map((r) => (
              <div key={r.title} className="flex gap-3 bg-card px-4 py-4 sm:flex-col sm:gap-2">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--color-navy)]/10">
                  <r.Icon className="h-4 w-4 text-[var(--color-navy)]" strokeWidth={1.9} />
                </span>
                <div className="min-w-0">
                  <p className="text-[13.5px] font-bold leading-snug text-foreground">{r.title}</p>
                  <p className="mt-1 text-[12px] leading-snug text-muted-foreground">{r.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 6. THE OFFER — how do you want to solve it ───────────── */}
        {isPaid ? (
          <section className="mt-8 px-5 text-center">
            <p className="flex items-center justify-center gap-2 text-[17px] font-bold text-[var(--color-success)]">
              <ShieldCheck className="h-5 w-5" /> Você já está protegido
            </p>
            <button
              onClick={() => navigate({ to: "/" })}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-navy)] py-4 font-bold text-white transition active:scale-[0.99]"
            >
              Voltar ao app <ArrowRight className="h-4 w-4" />
            </button>
          </section>
        ) : (
          <section className="mt-8 px-5">
            <h2 className="mb-4 text-[19px] font-bold text-foreground">Como você quer resolver?</h2>

            <div ref={plansRef} className="space-y-3">
              {/* Acompanhar */}
              <div className="rounded-2xl border border-border bg-card p-5">
                <span className="inline-block rounded-full bg-secondary px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">
                  Priva Essencial
                </span>
                <p className="mt-3 text-[28px] font-extrabold leading-none text-foreground">
                  R$ 9,90
                  <span className="text-[14px] font-normal text-muted-foreground">/mês</span>
                </p>
                <p className="mt-1.5 text-[13.5px] font-semibold text-foreground">
                  Você fica sabendo de tudo
                </p>
                <ul className="mt-3.5 space-y-2">
                  {[
                    `Relatório completo dos ${breachCount} vazamentos`,
                    "Monitoramento contínuo dos seus dados",
                    "Alerta quando aparecer vazamento novo",
                    "Verificação ilimitada de link, Pix e mensagem",
                  ].map((f) => (
                    <li key={f} className="flex gap-2 text-[13px] text-foreground">
                      <Check
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-navy)]"
                        strokeWidth={3}
                      />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => checkout("essencial")}
                  disabled={redirecting}
                  className="mt-4 w-full rounded-xl border-[1.5px] border-[var(--color-navy)] py-3 text-[14px] font-bold text-[var(--color-navy)] transition active:scale-[0.99] disabled:opacity-60"
                >
                  Assinar Essencial
                </button>
              </div>

              {/* Resolver — recommended */}
              <div
                className="relative rounded-2xl bg-card p-5"
                style={{
                  border: "1.5px solid #4F46E5",
                  boxShadow: "0 12px 34px rgba(79,70,229,0.16)",
                }}
              >
                <span className="absolute -top-2.5 left-5 rounded-full bg-[#4F46E5] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  Recomendado
                </span>
                <span className="inline-block rounded-full bg-[var(--color-navy)]/10 px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-wide text-[var(--color-navy)]">
                  Priva Protege
                </span>
                <p className="mt-3 text-[28px] font-extrabold leading-none text-foreground">
                  R$ 24,90
                  <span className="text-[14px] font-normal text-muted-foreground">/mês</span>
                </p>
                <p className="mt-1.5 text-[13.5px] font-semibold text-foreground">
                  Nossa equipe pede a remoção
                </p>
                <ul className="mt-3.5 space-y-2">
                  {[
                    "Tudo do plano ao lado",
                    "Solicitações de remoção feitas pela nossa equipe",
                    "Carta LGPD enviada às fontes em até 48h",
                    "Acompanhamento do caso até a resposta",
                  ].map((f) => (
                    <li key={f} className="flex gap-2 text-[13px] text-foreground">
                      <Check
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#4F46E5]"
                        strokeWidth={3}
                      />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => checkout("protecao_total")}
                  disabled={redirecting}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-[14.5px] font-bold text-white transition active:scale-[0.99] disabled:opacity-60"
                  style={{
                    background: "linear-gradient(135deg,#4F46E5,#6366F1)",
                    boxShadow: "0 8px 24px rgba(79,70,229,0.35)",
                  }}
                >
                  <Trash2 className="h-4 w-4" /> Remover dados vazados
                </button>
              </div>
            </div>

            <p className="mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-[11.5px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Lock className="h-3 w-3" /> Pagamento seguro via Stripe
              </span>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Conforme a LGPD
              </span>
            </p>
          </section>
        )}

        {/* Public exposure note — factual, low emphasis */}
        {publicHits > 0 && (
          <section className="mt-6 px-5">
            <p className="flex items-start gap-2 text-[12px] leading-snug text-muted-foreground">
              <Globe className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Também encontramos {publicHits} {publicHits === 1 ? "ocorrência" : "ocorrências"} dos
              seus dados em fontes públicas da internet.
            </p>
          </section>
        )}
      </div>

      {shareOpen && (
        <ShareResultSheet
          breachCount={breachCount}
          score={score}
          onClose={() => setShareOpen(false)}
        />
      )}

      {/* Sticky conversion CTA */}
      {!isPaid && (
        <div
          className={`fixed bottom-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 px-4 pt-6 transition-transform duration-300 ${showSticky ? "translate-y-0" : "translate-y-full"}`}
          style={{
            background: "linear-gradient(to top, var(--color-background) 55%, transparent)",
            paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))",
          }}
        >
          <button
            onClick={goPlans}
            className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-base font-bold text-white transition active:scale-[0.99]"
            style={{
              background: "linear-gradient(135deg,#4F46E5,#6366F1)",
              boxShadow: "0 8px 28px rgba(79,70,229,0.45)",
            }}
          >
            Resolver minha exposição <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
