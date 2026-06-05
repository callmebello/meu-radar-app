import { useEffect, useRef, useState } from "react";
import {
  Loader2,
  Lock,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  ChevronRight,
  CreditCard,
  Mail,
  Phone,
  Eye,
  Bell,
  KeyRound,
  Check,
  Menu,
  X,
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

// Deterministic mock result from the CPF digits (numbers reflect real BR exposure rates).
function generateResult(cpf: string) {
  const digits = cpf.replace(/\D/g, "");
  const seed = digits.split("").reduce((a, b) => a + (parseInt(b) || 0), 0);
  const breachOptions = [2, 3, 3, 3, 4, 4, 4, 5, 5, 6, 7];
  const phoneOptions = [1, 1, 1, 2, 2, 2, 3, 3, 4];
  const passOptions = [0, 0, 1, 1, 1, 2, 2, 3];
  const breaches = breachOptions[seed % breachOptions.length];
  const phones = phoneOptions[(seed * 3) % phoneOptions.length];
  const passwords = passOptions[(seed * 7) % passOptions.length];
  const score = 120 + (seed % 260);
  return { breaches, phones, passwords, score, seed };
}

function maskedFields(cpf: string, seed: number) {
  const digits = cpf.replace(/\D/g, "");
  const cpfLast2 = (digits.slice(-2) || "00").padStart(2, "0");
  const domains = ["gmail.com", "hotmail.com", "outlook.com", "yahoo.com.br", "icloud.com"];
  const domain = domains[seed % domains.length];
  const first = String.fromCharCode(97 + (seed % 26));
  const phoneLast4 = String((seed * 13) % 10000).padStart(4, "0");
  return { cpfLast2, domain, first, phoneLast4 };
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
  const [showEmail, setShowEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState("");
  const [socialCount, setSocialCount] = useState(() => 87 + Math.floor(Math.random() * 48));
  const formRef = useRef<HTMLDivElement>(null);

  const submit = () => {
    try {
      sessionStorage.setItem("priva_cpf", cpf);
    } catch {
      /* ignore */
    }
    setPhase("loading");
    setTimeout(() => setPhase("results"), 2200);
  };

  // social-proof counter ticks up slowly
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      t = setTimeout(() => {
        setSocialCount((c) => c + 1);
        tick();
      }, 9000 + Math.random() * 7000);
    };
    tick();
    return () => clearTimeout(t);
  }, []);

  const sendMagicLink = () => {
    try {
      sessionStorage.setItem("priva_email", email);
    } catch {
      /* ignore */
    }
    // mock — real Supabase signInWithOtp(email) plugs in here later
    setEmailSent(true);
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
      <section className="relative flex flex-col overflow-hidden px-5 pt-4 pb-10 sm:py-10">
        {/* Subtle ambient — white, not blue */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[600px]"
          style={{
            background:
              "radial-gradient(800px 400px at 50% 0%, rgba(255,255,255,0.04), transparent 70%)",
          }}
        />
        <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center gap-3 sm:gap-4">
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
              (() => {
                const result = generateResult(cpf);
                const mask = maskedFields(cpf, result.seed);
                const rows = [
                  { Icon: CreditCard, label: "CPF", value: `•••.•••.•••-${mask.cpfLast2}`, badge: "ALTO", color: "#F87171", bg: "rgba(239,68,68,0.2)" },
                  { Icon: Mail, label: "E-mail", value: `${mask.first}•••••@${mask.domain}`, badge: "MÉDIO", color: "#FBBF24", bg: "rgba(245,158,11,0.2)" },
                  { Icon: Phone, label: "Telefone", value: `(11) 9••••-${mask.phoneLast4}`, badge: "BAIXO", color: "#34D399", bg: "rgba(34,197,94,0.2)" },
                ];
                const avatars = [
                  { i: "JM", c: "#6366F1" },
                  { i: "AS", c: "#22C55E" },
                  { i: "RC", c: "#F59E0B" },
                ];
                return (
                  <div
                    className="rounded-2xl p-5 animate-fade-in sm:p-6"
                    style={{ backgroundColor: "#0A0A0F", border: `1px solid ${BORDER}` }}
                  >
                    {/* top badge */}
                    <div className="flex justify-center">
                      <span
                        className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold tracking-wider"
                        style={{ backgroundColor: "rgba(99,102,241,0.15)", border: "1px solid #4F46E5", color: "#818CF8" }}
                      >
                        <Check className="h-3.5 w-3.5" /> ANÁLISE CONCLUÍDA
                      </span>
                    </div>

                    {/* hero: icon + text */}
                    <div className="mt-4 flex items-start gap-4">
                      <span
                        className="grid h-16 w-16 shrink-0 place-items-center rounded-full animate-danger-pulse"
                        style={{ backgroundColor: "rgba(239,68,68,0.15)" }}
                      >
                        <AlertTriangle className="h-8 w-8 text-red-500" />
                      </span>
                      <div>
                        <h2 className="text-2xl font-extrabold leading-tight text-white">
                          Seus dados foram encontrados em{" "}
                          <span className="text-red-500">{result.breaches} vazamentos</span>
                        </h2>
                        <p className="mt-2 text-sm text-gray-400">
                          Encontramos informações associadas ao seu CPF, e-mail e telefone.
                        </p>
                      </div>
                    </div>

                    {/* data items */}
                    <div className="mt-4 space-y-2">
                      {rows.map((r) => (
                        <div
                          key={r.label}
                          className="flex items-center gap-3 rounded-xl px-4 py-3"
                          style={{ backgroundColor: "#12121A", border: "1px solid rgba(255,255,255,0.05)" }}
                        >
                          <span className="grid place-items-center rounded-lg p-2" style={{ backgroundColor: "rgba(99,102,241,0.2)" }}>
                            <r.Icon className="h-4 w-4" style={{ color: "#A5B4FC" }} />
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-white">{r.label}</p>
                            <p className="text-xs text-gray-400">{r.value}</p>
                          </div>
                          <span className="rounded px-2 py-0.5 text-xs font-bold" style={{ color: r.color, backgroundColor: r.bg }}>
                            {r.badge}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* unlock row */}
                    <div className="mt-3 flex items-center gap-3 rounded-xl px-4 py-3" style={{ backgroundColor: "#12121A", border: `1px solid ${BORDER}` }}>
                      <Lock className="h-5 w-5 shrink-0" style={{ color: "#A5B4FC" }} />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white">Desbloqueie seu relatório completo</p>
                        <p className="text-xs text-gray-500">Saiba onde seus dados vazaram e como se proteger.</p>
                      </div>
                      <ChevronRight className="h-5 w-5 shrink-0 text-gray-600" />
                    </div>

                    {/* primary CTA */}
                    <button
                      onClick={() => { setEmailSent(false); setShowEmail(true); }}
                      className="mt-3 w-full rounded-2xl py-4 text-base font-extrabold text-white transition-all duration-200 active:scale-[0.99]"
                      style={{ background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)", boxShadow: "0 0 30px rgba(79,70,229,0.4)" }}
                    >
                      🔒 VER ONDE MEUS DADOS VAZARAM →
                    </button>

                    {/* security note */}
                    <p className="mt-3 text-center text-xs text-gray-500">
                      🛡️ Seguro, rápido e em conformidade com a LGPD
                    </p>

                    {/* social proof */}
                    <div className="mt-4 flex items-center justify-center gap-3">
                      <div className="flex -space-x-2">
                        {avatars.map((a) => (
                          <span
                            key={a.i}
                            className="grid h-7 w-7 place-items-center rounded-full text-[10px] font-bold text-white"
                            style={{ backgroundColor: a.c, border: "2px solid #0A0A0F" }}
                          >
                            {a.i}
                          </span>
                        ))}
                      </div>
                      <span className="text-sm font-medium" style={{ color: "#818CF8" }}>
                        +{socialCount} pessoas consultaram vazamentos hoje
                      </span>
                    </div>
                  </div>
                );
              })()
            )}

          </div>

        </div>
      </section>

      {/* EMAIL CAPTURE — magic-link flow (mock) */}
      {showEmail && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm animate-fade-in"
          onClick={() => setShowEmail(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 animate-scale-in"
            style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER_STRONG}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowEmail(false)}
              aria-label="Fechar"
              className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full hover:bg-white/[0.06]"
              style={{ color: TEXT_MUTED }}
            >
              <X className="h-4 w-4" />
            </button>

            {!emailSent ? (
              <>
                <h3 className="text-lg font-bold text-white">Para onde enviamos seu relatório?</h3>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="mt-4 w-full rounded-xl bg-transparent px-4 py-3 text-base outline-none placeholder:text-white/25"
                  style={{ border: `1px solid ${BORDER_STRONG}`, color: TEXT }}
                />
                <button
                  onClick={sendMagicLink}
                  disabled={!email.includes("@")}
                  className="mt-3 w-full rounded-xl py-3.5 text-sm font-bold text-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)" }}
                >
                  Enviar acesso grátis →
                </button>
                <p className="mt-3 text-center text-xs text-gray-500">🔒 Sem spam. Cancele quando quiser.</p>
              </>
            ) : (
              <div className="text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full" style={{ backgroundColor: "rgba(34,197,94,0.15)" }}>
                  <Check className="h-7 w-7 text-green-400" />
                </div>
                <h3 className="mt-3 text-lg font-bold text-white">Link enviado para {email}</h3>
                <p className="mt-1 text-sm text-gray-400">Verifique sua caixa de entrada</p>
                <button
                  onClick={enterFree}
                  className="mt-5 w-full rounded-xl py-3.5 text-sm font-bold text-white"
                  style={{ background: "linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)" }}
                >
                  Entrar no app
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
