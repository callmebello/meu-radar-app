import { useEffect, useRef, useState } from "react";
import {
  Loader2,
  Lock,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Eye,
  Bell,
  KeyRound,
  Check,
  Menu,
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { PrivaLogo } from "@/components/meu-radar/PrivaLogo";
import { LiveMap } from "@/components/meu-radar/LiveMap";

function formatCPF(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  let out = d;
  if (d.length > 3) out = d.slice(0, 3) + "." + d.slice(3);
  if (d.length > 6) out = d.slice(0, 3) + "." + d.slice(3, 6) + "." + d.slice(6);
  if (d.length > 9)
    out = d.slice(0, 3) + "." + d.slice(3, 6) + "." + d.slice(6, 9) + "-" + d.slice(9);
  return out;
}

// Trust-first palette — mono dark + brand blue as the only attention color
const BG = "#06060F";
const SURFACE = "#0D0D17";
const BORDER = "rgba(255,255,255,0.08)";
const BORDER_STRONG = "rgba(255,255,255,0.14)";
const TEXT = "#FDFDFD";
const TEXT_MUTED = "#9B9BA7";
const BLUE = "#4F46E5";
const BLUE_HOVER = "#4338CA";
const DANGER = "#F87171";

export function CPFEntry() {
  const { setHasChecked, setIsPremium } = useApp();
  const [cpf, setCpf] = useState("");
  const [phase, setPhase] = useState<"form" | "loading" | "results">("form");
  const [focused, setFocused] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);

  const submit = () => {
    setPhase("loading");
    setTimeout(() => setPhase("results"), 2200);
  };

  const enterFree = () => setHasChecked(true);
  const enterPremium = () => {
    setIsPremium(true);
    setHasChecked(true);
  };

  const focusCpf = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => {
      const el = document.getElementById("cpf-input") as HTMLInputElement | null;
      el?.focus();
    }, 350);
  };

  useEffect(() => {
    if (phase === "results") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [phase]);

  return (
    <div
      className="min-h-screen antialiased"
      style={{ backgroundColor: BG, color: TEXT }}
    >
      {/* Navbar */}
      <nav
        className="sticky top-0 z-30 backdrop-blur-md"
        style={{
          backgroundColor: BG,
          borderBottom: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <div className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          {/* LEFT — links (desktop) / spacer (mobile) */}
          <div className="hidden items-center gap-8 sm:flex">
            <a href="#como-funciona" className="text-sm text-gray-300 transition-colors duration-200 hover:text-white">
              Como funciona
            </a>
            <a href="#privacidade" className="text-sm text-gray-300 transition-colors duration-200 hover:text-white">
              Planos
            </a>
            <a href="#privacidade" className="text-sm text-gray-300 transition-colors duration-200 hover:text-white">
              Para empresas
            </a>
          </div>
          <div className="h-6 w-6 sm:hidden" aria-hidden />

          {/* CENTER — wordmark logo (absolutely centered) */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label="Priva — topo"
            className="absolute left-1/2 flex -translate-x-1/2 items-center justify-center"
          >
            <img src="/PRIVA_letter_only_logo.png" alt="PRIVA" className="h-6 w-auto object-contain" />
          </button>

          {/* RIGHT — Entrar + CTA (desktop) */}
          <div className="hidden items-center sm:flex">
            <button onClick={focusCpf} className="mr-4 text-sm text-gray-300 transition-colors duration-200 hover:text-white">
              Entrar
            </button>
            <button
              onClick={focusCpf}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BLUE_HOVER)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = BLUE)}
              className="rounded-full px-4 py-2 text-sm font-semibold text-white transition-all duration-200"
              style={{ backgroundColor: BLUE }}
            >
              Verificar gratuitamente →
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="sm:hidden"
            style={{ color: TEXT }}
            aria-label="Abrir menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </nav>

      {/* Mobile full-screen menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 sm:hidden" onClick={() => setMenuOpen(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute right-3 top-16 w-56 rounded-2xl p-2 shadow-2xl animate-scale-in"
            style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}
          >
            <a
              href="#como-funciona"
              onClick={() => setMenuOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm text-gray-300 transition-colors hover:bg-white/[0.05] hover:text-white"
            >
              Como funciona
            </a>
            <a
              href="#privacidade"
              onClick={() => setMenuOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm text-gray-300 transition-colors hover:bg-white/[0.05] hover:text-white"
            >
              Planos
            </a>
            <a
              href="#privacidade"
              onClick={() => setMenuOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm text-gray-300 transition-colors hover:bg-white/[0.05] hover:text-white"
            >
              Para empresas
            </a>

            <div className="my-1 h-px" style={{ backgroundColor: BORDER }} />

            <button
              onClick={() => { setMenuOpen(false); focusCpf(); }}
              className="block w-full rounded-lg px-3 py-2.5 text-left text-sm text-gray-300 transition-colors hover:bg-white/[0.05] hover:text-white"
            >
              Entrar
            </button>
            <button
              onClick={() => { setMenuOpen(false); focusCpf(); }}
              className="mt-1 w-full rounded-full py-2.5 text-sm font-semibold text-white"
              style={{ backgroundColor: BLUE }}
            >
              Verificar gratuitamente →
            </button>
          </div>
        </div>
      )}

      {/* HERO */}
      <section className="relative flex min-h-[calc(100svh-3rem)] flex-col justify-start overflow-hidden px-5 pt-4 pb-4 sm:py-6">
        {/* Subtle ambient — white, not blue */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[600px]"
          style={{
            background:
              "radial-gradient(800px 400px at 50% 0%, rgba(255,255,255,0.04), transparent 70%)",
          }}
        />
        <div className="relative mx-auto flex w-full max-w-5xl flex-1 flex-col items-center gap-3 sm:gap-4">
          {/* Badge — centered at top */}
          {phase !== "results" && (
            <span
              className="inline-flex items-center gap-2 self-center rounded-full px-3 py-1.5 text-[10px] font-medium uppercase tracking-[0.12em] sm:text-[11px]"
              style={{ color: TEXT_MUTED, border: `1px solid ${BORDER}`, backgroundColor: SURFACE }}
            >
              <span className="relative flex h-2 w-2 mr-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6366F1] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4F46E5]"></span>
              </span>
              PROTEÇÃO DE IDENTIDADE DIGITAL
            </span>
          )}

          {/* Top row: headline (left) + Live Map (right) — always side by side */}
          <div className="flex w-full flex-row items-center justify-between gap-3 sm:gap-8">
          <div
            className={`flex w-[45%] flex-col items-start gap-2 text-left transition-all duration-500 ease-out sm:gap-4 md:w-[58%] ${
              phase === "results"
                ? "pointer-events-none max-h-0 -translate-y-3 overflow-hidden opacity-0"
                : "max-h-[600px] translate-y-0 opacity-100"
            }`}
          >
          <h1
            className="max-w-[20ch] text-xl font-extrabold leading-[1.08] tracking-[-0.03em] sm:max-w-none sm:text-4xl md:text-5xl"
            style={{ color: TEXT }}
          >
            Descubra onde seus dados pessoais estão expostos.
          </h1>

          <p
            className="mt-1 max-w-xl text-sm leading-relaxed sm:mt-4 sm:text-base md:text-lg"
            style={{ color: TEXT_MUTED }}
          >
            A Priva verifica sua exposição digital e ajuda você a recuperar o controle da sua privacidade.
          </p>
          </div>

          {phase !== "results" && (
            <div className="w-[55%] shrink-0 md:w-[40%]">
              <LiveMap />
            </div>
          )}
          </div>


          {/* CPF form — visual gravity center, neutral surface */}
          <div
            ref={formRef}
            className={`relative w-full max-w-md text-left transition-all duration-500 ease-out ${
              phase === "results" ? "mt-0" : "mt-4 sm:mt-8"
            }`}
          >
            {phase !== "results" ? (
              <div
                className="rounded-2xl p-5 sm:p-7"
                style={{
                  backgroundColor: SURFACE,
                  border: `1px solid ${focused ? BLUE : BORDER}`,
                  boxShadow: focused
                    ? "0 0 0 4px rgba(59,130,246,0.10), 0 30px 60px -30px rgba(0,0,0,0.6)"
                    : "0 30px 60px -30px rgba(0,0,0,0.5)",
                  transition: "all 250ms ease",
                }}
              >
                <label
                  htmlFor="cpf-input"
                  className="block text-[11px] font-medium uppercase tracking-[0.14em]"
                  style={{ color: TEXT_MUTED }}
                >
                  Verifique seu CPF
                </label>
                <input
                  id="cpf-input"
                  value={cpf}
                  onChange={(e) => setCpf(formatCPF(e.target.value))}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="000.000.000-00"
                  inputMode="numeric"
                  disabled={phase === "loading"}
                  className="mt-2 w-full bg-transparent py-1.5 text-xl font-medium tracking-wide outline-none transition-all duration-200 placeholder:text-white/20 sm:text-3xl"
                  style={{ color: TEXT }}
                />
                <div
                  className="mt-1 h-px w-full"
                  style={{
                    backgroundColor: focused ? BLUE : BORDER_STRONG,
                    transition: "background-color 200ms ease",
                  }}
                />

                <button
                  onClick={submit}
                  disabled={cpf.length < 14 || phase === "loading"}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = BLUE_HOVER)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = BLUE)
                  }
                  className="group mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 sm:mt-6 sm:rounded-full sm:py-4 sm:text-base"
                  style={{ backgroundColor: BLUE }}
                >
                  {phase === "loading" ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analisando…
                    </>
                  ) : (
                  <>
                      Verificar gratuitamente →
                  </>
                  )}
                </button>

                <button
                  onClick={() => (window.location.href = "#privacidade")}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-all duration-200 hover:bg-white/[0.04] sm:rounded-full sm:py-4 sm:text-base"
                  style={{ color: TEXT, border: `1px solid ${BORDER_STRONG}` }}
                >
                  Soluções para empresas →
                </button>

                <p
                  className="mt-3 flex items-center justify-center gap-1.5 text-[11px]"
                  style={{ color: TEXT_MUTED }}
                >
                  <Lock className="h-3 w-3" />
                  Criptografado. Sem cadastro. Conforme a LGPD.
                </p>

                <p className="mt-3 flex items-center justify-center text-center text-[11px] text-green-400">
                  <span className="relative mr-2 flex h-2 w-2 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500"></span>
                  </span>
                  Milhares de brasileiros verificam seus dados todos os dias
                </p>
              </div>

            ) : (
              <div
                className="relative overflow-hidden rounded-2xl p-6 animate-fade-in sm:p-7"
                style={{
                  backgroundColor: SURFACE,
                  border: `1px solid ${BORDER_STRONG}`,
                  boxShadow:
                    "0 0 0 4px rgba(248,113,113,0.06), 0 30px 80px -30px rgba(248,113,113,0.35)",
                }}
              >
                {/* ambient glow */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 -top-24 h-48"
                  style={{
                    background:
                      "radial-gradient(420px 200px at 30% 50%, rgba(248,113,113,0.25), transparent 70%)",
                  }}
                />

                <div className="relative flex items-center gap-3">
                  <span
                    className="grid h-12 w-12 place-items-center rounded-full animate-danger-pulse"
                    style={{
                      backgroundColor: "rgba(248,113,113,0.14)",
                      boxShadow: "0 0 0 6px rgba(248,113,113,0.08)",
                    }}
                  >
                    <AlertTriangle className="h-6 w-6" style={{ color: DANGER }} />
                  </span>
                  <div>
                    <p
                      className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-green-400"
                    >
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
                      </span>
                      Análise concluída
                    </p>
                    <h2 className="mt-0.5 text-2xl font-bold tracking-tight" style={{ color: TEXT }}>
                      <span style={{ color: DANGER }}>3 exposições</span> encontradas
                    </h2>
                  </div>
                </div>

                {/* quick stats */}
                <div className="relative mt-5 grid grid-cols-3 gap-2">
                  {[
                    { label: "Alto", count: 1, color: "#F87171", bg: "rgba(248,113,113,0.10)" },
                    { label: "Médio", count: 1, color: "#FBBF24", bg: "rgba(251,191,36,0.10)" },
                    { label: "Baixo", count: 1, color: "#34D399", bg: "rgba(52,211,153,0.10)" },
                  ].map((s) => (
                    <div
                      key={s.label}
                      className="rounded-xl px-2 py-3 text-center"
                      style={{ backgroundColor: s.bg, border: `1px solid ${s.color}33` }}
                    >
                      <div className="text-xl font-extrabold" style={{ color: s.color }}>
                        {s.count}
                      </div>
                      <div
                        className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider"
                        style={{ color: s.color }}
                      >
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>

                <ul
                  className="relative mt-5 space-y-px overflow-hidden rounded-xl"
                  style={{ border: `1px solid ${BORDER}` }}
                >
                  {[
                    { name: "HackBR — 2024", risk: "Alto", color: "#F87171", bg: "rgba(248,113,113,0.10)" },
                    { name: "VarejoBR — 2024", risk: "Médio", color: "#FBBF24", bg: "rgba(251,191,36,0.10)" },
                    { name: "StreamBR — 2023", risk: "Baixo", color: "#34D399", bg: "rgba(52,211,153,0.10)" },
                  ].map((b) => (
                    <li
                      key={b.name}
                      className="flex items-center justify-between px-4 py-3"
                      style={{ backgroundColor: BG }}
                    >
                      <div className="flex items-center gap-3">
                        <Lock className="h-3.5 w-3.5" style={{ color: TEXT_MUTED }} />
                        <span
                          className="select-none text-sm font-medium blur-[5px]"
                          style={{ color: TEXT }}
                        >
                          {b.name}
                        </span>
                      </div>
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: b.color, backgroundColor: b.bg, border: `1px solid ${b.color}33` }}
                      >
                        {b.risk}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="relative mt-6 space-y-2.5">
                  <button
                    onClick={enterFree}
                    onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(1.1)")}
                    onMouseLeave={(e) => (e.currentTarget.style.filter = "brightness(1)")}
                    className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-200"
                    style={{
                      background: `linear-gradient(135deg, ${BLUE} 0%, #7C3AED 100%)`,
                      boxShadow: "0 12px 30px -10px rgba(79,70,229,0.6)",
                    }}
                  >
                    Ver detalhes completos
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </button>
                  <button
                    onClick={enterPremium}
                    className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-medium transition-all duration-200 hover:bg-white/[0.04]"
                    style={{ color: TEXT, border: `1px solid ${BORDER_STRONG}` }}
                  >
                    <ShieldCheck className="h-4 w-4" style={{ color: BLUE }} />
                    Ativar proteção contínua
                  </button>
                </div>

                <p
                  className="relative mt-4 flex items-center justify-center gap-1.5 text-[11px]"
                  style={{ color: TEXT_MUTED }}
                >
                  <Lock className="h-3 w-3" />
                  Seus dados permanecem criptografados e privados.
                </p>
              </div>
            )}

          </div>

        </div>
      </section>

      {/* HOW IT WORKS — neutral surfaces, blue only in numerals */}
      <section
        id="como-funciona"
        className="px-5 py-24 sm:py-32"
        style={{ borderTop: `1px solid ${BORDER}` }}
      >
        <div className="mx-auto max-w-5xl">
          <div className="max-w-2xl">
            <p
              className="text-[11px] font-medium uppercase tracking-[0.14em]"
              style={{ color: BLUE }}
            >
              Como funciona
            </p>
            <h2
              className="mt-3 text-3xl font-semibold tracking-[-0.02em] sm:text-5xl"
              style={{ color: TEXT }}
            >
              Inteligência silenciosa.
              <br />
              <span style={{ color: TEXT_MUTED }}>Trabalha enquanto você não pensa nisso.</span>
            </h2>
          </div>

          <div className="mt-14 grid gap-px overflow-hidden rounded-2xl sm:grid-cols-3" style={{ border: `1px solid ${BORDER}` }}>
            {[
              {
                step: "01",
                icon: Eye,
                title: "Análise contínua",
                desc:
                  "Cruzamos seu CPF contra bilhões de registros vazados em fóruns, dark web e bases comprometidas.",
              },
              {
                step: "02",
                icon: Bell,
                title: "Alerta antecipado",
                desc:
                  "No momento em que seus dados aparecem em algum lugar, você é o primeiro a saber.",
              },
              {
                step: "03",
                icon: KeyRound,
                title: "Ação assistida",
                desc:
                  "Receba o passo exato para conter o risco — sem jargão, sem ruído, sem perda de tempo.",
              },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div
                key={step}
                className="p-7 sm:p-8"
                style={{ backgroundColor: SURFACE }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-xs font-mono tracking-wider"
                    style={{ color: BLUE }}
                  >
                    {step}
                  </span>
                  <Icon className="h-4 w-4" style={{ color: TEXT_MUTED }} />
                </div>
                <h3
                  className="mt-8 text-lg font-semibold tracking-tight"
                  style={{ color: TEXT }}
                >
                  {title}
                </h3>
                <p
                  className="mt-2 text-sm leading-relaxed"
                  style={{ color: TEXT_MUTED }}
                >
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRIVACY MANIFESTO */}
      <section
        id="privacidade"
        className="px-5 py-24 sm:py-32"
        style={{ borderTop: `1px solid ${BORDER}` }}
      >
        <div className="mx-auto grid max-w-5xl gap-16 sm:grid-cols-2 sm:gap-20">
          <div>
            <p
              className="text-[11px] font-medium uppercase tracking-[0.14em]"
              style={{ color: BLUE }}
            >
              Privacidade por design
            </p>
            <h2
              className="mt-3 text-3xl font-semibold leading-tight tracking-[-0.02em] sm:text-5xl"
              style={{ color: TEXT }}
            >
              Seus dados nunca
              <br />
              saem do seu controle.
            </h2>
            <p
              className="mt-6 max-w-md text-base leading-relaxed"
              style={{ color: TEXT_MUTED }}
            >
              Não vendemos. Não compartilhamos. Não treinamos modelos com você.
              A Priva existe para reduzir sua exposição — não para criar mais.
            </p>
          </div>

          <ul className="space-y-5">
            {[
              "Verificação local quando possível",
              "CPF nunca armazenado em texto plano",
              "Sem terceiros de publicidade ou rastreamento",
              "Conformidade total com LGPD",
              "Exclusão de conta e dados em um clique",
            ].map((line) => (
              <li
                key={line}
                className="flex items-start gap-3 pb-5"
                style={{ borderBottom: `1px solid ${BORDER}` }}
              >
                <Check className="mt-0.5 h-4 w-4 shrink-0" style={{ color: BLUE }} />
                <span className="text-sm leading-relaxed" style={{ color: TEXT }}>
                  {line}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CLOSING CTA */}
      <section
        className="px-5 py-24 sm:py-32"
        style={{ borderTop: `1px solid ${BORDER}` }}
      >
        <div className="mx-auto max-w-2xl text-center">
          <h2
            className="text-3xl font-semibold tracking-[-0.02em] sm:text-5xl"
            style={{ color: TEXT }}
          >
            Comece em segundos.
          </h2>
          <p
            className="mx-auto mt-5 max-w-md text-base leading-relaxed"
            style={{ color: TEXT_MUTED }}
          >
            Uma verificação. Zero cadastro. Tranquilidade contínua.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <button
              onClick={focusCpf}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BLUE_HOVER)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = BLUE)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-sm font-semibold text-white transition-all duration-200 sm:w-auto"
              style={{ backgroundColor: BLUE }}
            >
              Verificar meu CPF
              <ArrowRight className="h-4 w-4" />
            </button>
            <a
              href="#privacidade"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-7 py-3.5 text-sm font-medium transition-all duration-200 hover:bg-white/[0.04] sm:w-auto"
              style={{ color: TEXT, border: `1px solid ${BORDER_STRONG}` }}
            >
              Como protegemos seus dados
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer
        className="px-5 py-10"
        style={{ borderTop: `1px solid ${BORDER}` }}
      >
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-3">
            <PrivaLogo size={24} showWordmark={false} />
            <span className="text-xs" style={{ color: TEXT_MUTED }}>
              © {new Date().getFullYear()} Priva. Sua identidade, protegida em silêncio.
            </span>
          </div>
          <div className="flex items-center gap-6 text-xs" style={{ color: TEXT_MUTED }}>
            <a href="#" className="transition-colors hover:text-white">Privacidade</a>
            <a href="#" className="transition-colors hover:text-white">Termos</a>
            <a href="#" className="transition-colors hover:text-white">Contato</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
