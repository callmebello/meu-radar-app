import { useEffect, useRef, useState } from "react";
import {
  Loader2,
  Lock,
  ShieldCheck,
  AlertTriangle,
  Zap,
  Bell,
  FileText,
  Activity,
  ArrowRight,
  Star,
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { PrivaLogo } from "@/components/meu-radar/PrivaLogo";

function formatCPF(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  let out = d;
  if (d.length > 3) out = d.slice(0, 3) + "." + d.slice(3);
  if (d.length > 6) out = d.slice(0, 3) + "." + d.slice(3, 6) + "." + d.slice(6);
  if (d.length > 9)
    out = d.slice(0, 3) + "." + d.slice(3, 6) + "." + d.slice(6, 9) + "-" + d.slice(9);
  return out;
}

const BG = "#070A12";
const SURFACE = "#0B1220";
const BORDER = "rgba(255,255,255,0.06)";
const BORDER_STRONG = "rgba(255,255,255,0.1)";
const CYAN = "#2DD4FF";
const RED = "#FF4D5E";

export function CPFEntry() {
  const { setHasChecked, setIsPremium } = useApp();
  const [cpf, setCpf] = useState("");
  const [phase, setPhase] = useState<"form" | "loading" | "results">("form");
  const [focused, setFocused] = useState(false);
  const [verifiedCount, setVerifiedCount] = useState(12851);
  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => setVerifiedCount((n) => n + 1), 12000);
    return () => clearInterval(id);
  }, []);

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
    }, 400);
  };

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: BG }}>
      {/* Ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 h-[600px]"
        style={{
          background:
            "radial-gradient(900px 500px at 50% -10%, rgba(45,212,255,0.10), transparent 60%)",
        }}
      />

      {/* Navbar */}
      <nav
        className="sticky top-0 z-30 backdrop-blur-xl"
        style={{
          backgroundColor: "rgba(7,10,18,0.7)",
          borderBottom: `1px solid ${BORDER}`,
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-5 sm:py-3.5">
          <PrivaLogo
            size={36}
            showWordmark={false}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          />
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium text-gray-300 sm:px-3 sm:py-1.5 sm:text-xs"
            style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER_STRONG}` }}
          >
            <ShieldCheck className="h-3.5 w-3.5" style={{ color: CYAN }} />
            LGPD compliant
          </span>
        </div>
      </nav>

      {/* HERO — above the fold, CPF dominates */}
      <section className="relative px-5 pt-12 pb-16 sm:pt-20">
        <div className="mx-auto flex max-w-xl flex-col items-center text-center">
          {/* Tiny breach pill */}
          <span
            className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider"
            style={{
              backgroundColor: "rgba(255,77,94,0.08)",
              color: RED,
              border: "1px solid rgba(255,77,94,0.2)",
            }}
          >
            <span className="relative flex h-1.5 w-1.5">
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                style={{ backgroundColor: RED }}
              />
              <span
                className="relative inline-flex h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: RED }}
              />
            </span>
            220M+ CPFs vazados no Brasil
          </span>

          <h1 className="mt-5 text-[44px] font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
            Seu CPF foi
            <br />
            <span style={{ color: CYAN }}>vazado?</span>
          </h1>

          <p className="mt-5 max-w-md text-base text-gray-400 sm:text-lg">
            Descubra em segundos se seus dados estão entre os mais de 220 milhões de CPFs
            expostos no Brasil.
          </p>

          {/* Trust row */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-gray-400">
            <span className="inline-flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" style={{ color: CYAN }} /> Sem cadastro
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5" style={{ color: CYAN }} /> Resultado em segundos
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" style={{ color: CYAN }} /> Dados não armazenados
            </span>
          </div>

          {/* CPF form — the visual center */}
          {phase !== "results" ? (
            <div
              ref={formRef}
              className="relative mt-9 w-full rounded-2xl p-6 sm:p-7"
              style={{
                backgroundColor: SURFACE,
                border: `1px solid ${focused ? "rgba(45,212,255,0.4)" : BORDER_STRONG}`,
                boxShadow: focused
                  ? "0 0 0 4px rgba(45,212,255,0.10), 0 30px 80px -20px rgba(45,212,255,0.25), 0 20px 60px -20px rgba(0,0,0,0.6)"
                  : "0 30px 80px -30px rgba(0,0,0,0.7)",
                transition: "all 250ms ease",
              }}
            >
              <label
                htmlFor="cpf-input"
                className="block text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500"
              >
                Digite seu CPF
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
                className="mt-2 w-full rounded-xl bg-transparent px-4 py-4 text-xl font-semibold tracking-wider text-white outline-none transition-all duration-200 placeholder:text-gray-600 sm:text-2xl"
                style={{
                  border: `1px solid ${focused ? CYAN : BORDER_STRONG}`,
                  boxShadow: focused ? `0 0 0 4px rgba(45,212,255,0.12)` : "none",
                }}
              />

              <button
                onClick={submit}
                disabled={cpf.length < 14 || phase === "loading"}
                className="group mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-4 text-base font-bold text-[#04121A] transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
                style={{
                  background: `linear-gradient(180deg, ${CYAN} 0%, #1AB8E0 100%)`,
                  boxShadow:
                    "0 0 0 1px rgba(45,212,255,0.5), 0 18px 40px -12px rgba(45,212,255,0.55)",
                }}
              >
                {phase === "loading" ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Verificando bases de dados...
                  </>
                ) : (
                  <>
                    Verificar meu CPF agora
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>

              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-gray-500">
                <ShieldCheck className="h-3.5 w-3.5" />
                Consulta gratuita e segura
              </p>
            </div>
          ) : (
            <div className="mt-9 w-full animate-fade-in text-left">
              <div className="flex flex-col items-center text-center">
                <span
                  className="relative grid h-20 w-20 place-items-center rounded-full"
                  style={{ backgroundColor: "rgba(255,77,94,0.12)" }}
                >
                  <span
                    className="absolute inset-0 animate-ping rounded-full"
                    style={{ backgroundColor: "rgba(255,77,94,0.25)" }}
                  />
                  <AlertTriangle className="relative h-10 w-10" style={{ color: RED }} />
                </span>
                <h2 className="mt-5 text-2xl font-extrabold text-white sm:text-3xl">
                  CPF encontrado em{" "}
                  <span style={{ color: RED }}>3 vazamentos</span>
                </h2>
                <p className="mt-2 text-xs text-gray-500">Análise concluída · {cpf}</p>
              </div>

              <ul className="mt-6 space-y-2.5">
                {["HackBR — 2024", "VarejoBR — 2024", "StreamBR — 2023"].map((s) => (
                  <li
                    key={s}
                    className="flex items-center gap-3 rounded-xl p-3.5"
                    style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER_STRONG}` }}
                  >
                    <span
                      className="grid h-9 w-9 place-items-center rounded-lg"
                      style={{ backgroundColor: "rgba(255,255,255,0.04)" }}
                    >
                      <Lock className="h-4 w-4 text-gray-400" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="select-none text-sm font-semibold text-white blur-[5px]">
                        {s}
                      </p>
                      <p className="text-[10px] text-gray-500">Origem oculta · Risco alto</p>
                    </div>
                  </li>
                ))}
              </ul>

              <p className="mt-5 text-center text-xs text-gray-400">
                Ative o plano gratuito para ver os detalhes completos
              </p>

              <div className="mt-4 space-y-2.5">
                <button
                  onClick={enterFree}
                  className="w-full rounded-xl py-3.5 text-sm font-bold text-[#04121A] transition-all duration-200 hover:scale-[1.01]"
                  style={{
                    background: `linear-gradient(180deg, ${CYAN} 0%, #1AB8E0 100%)`,
                    boxShadow:
                      "0 0 0 1px rgba(45,212,255,0.5), 0 14px 30px -10px rgba(45,212,255,0.5)",
                  }}
                >
                  Ver detalhes grátis
                </button>
                <button
                  onClick={enterPremium}
                  className="w-full rounded-xl py-3.5 text-sm font-bold text-white transition-all duration-200 hover:bg-white/5"
                  style={{ border: `1px solid ${BORDER_STRONG}` }}
                >
                  Ativar proteção completa · R$19/mês
                </button>
              </div>
            </div>
          )}

          {/* Social proof */}
          {phase !== "results" && (
            <div className="mt-8 flex flex-col items-center gap-3">
              <div className="flex -space-x-2">
                {[
                  "https://i.pravatar.cc/40?img=12",
                  "https://i.pravatar.cc/40?img=32",
                  "https://i.pravatar.cc/40?img=45",
                  "https://i.pravatar.cc/40?img=68",
                ].map((src) => (
                  <img
                    key={src}
                    src={src}
                    alt=""
                    className="h-7 w-7 rounded-full object-cover"
                    style={{ border: `2px solid ${BG}` }}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-400">
                <span className="font-semibold text-white">
                  {verifiedCount.toLocaleString("pt-BR")}
                </span>{" "}
                pessoas verificaram hoje
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <div className="flex gap-0.5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <Star
                      key={i}
                      className="h-3.5 w-3.5"
                      fill="#FACC15"
                      stroke="#FACC15"
                    />
                  ))}
                </div>
                <span>
                  <span className="font-semibold text-white">4.9/5</span> · 1.250+ avaliações
                </span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Benefits — 3 cards only */}
      <section className="px-5 pb-20">
        <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-3">
          {[
            { Icon: Activity, title: "Score de identidade" },
            { Icon: Bell, title: "Alerta de vazamentos" },
            { Icon: FileText, title: "Relatório detalhado" },
          ].map(({ Icon, title }) => (
            <div
              key={title}
              className="rounded-2xl p-5"
              style={{ backgroundColor: SURFACE, border: `1px solid ${BORDER}` }}
            >
              <span
                className="grid h-10 w-10 place-items-center rounded-lg"
                style={{ backgroundColor: "rgba(45,212,255,0.1)" }}
              >
                <Icon className="h-5 w-5" style={{ color: CYAN }} />
              </span>
              <h3 className="mt-4 text-sm font-semibold text-white">{title}</h3>
            </div>
          ))}
        </div>

        {/* Closing CTA */}
        <div className="mx-auto mt-10 max-w-xl text-center">
          <button
            onClick={focusCpf}
            className="inline-flex items-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold text-[#04121A] transition-all duration-200 hover:scale-[1.02]"
            style={{
              background: `linear-gradient(180deg, ${CYAN} 0%, #1AB8E0 100%)`,
              boxShadow:
                "0 0 0 1px rgba(45,212,255,0.5), 0 18px 40px -12px rgba(45,212,255,0.55)",
            }}
          >
            Verificar meu CPF agora
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>
    </div>
  );
}
