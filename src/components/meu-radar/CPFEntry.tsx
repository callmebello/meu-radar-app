import { useEffect, useRef, useState } from "react";
import { Loader2, Lock, ShieldCheck, AlertTriangle, Search, BarChart3, Shield } from "lucide-react";
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

export function CPFEntry() {
  const { setHasChecked, setIsPremium } = useApp();
  const [cpf, setCpf] = useState("");
  const [phase, setPhase] = useState<"form" | "loading" | "results">("form");
  const [verifiedCount, setVerifiedCount] = useState(12847);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => setVerifiedCount((n) => n + 1), 10000);
    return () => clearInterval(id);
  }, []);

  const submit = () => {
    setPhase("loading");
    setTimeout(() => setPhase("results"), 2500);
  };

  const enterFree = () => setHasChecked(true);
  const enterPremium = () => {
    setIsPremium(true);
    setHasChecked(true);
  };

  const scrollToForm = () =>
    heroRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const gridBg = {
    backgroundImage:
      "linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)",
    backgroundSize: "40px 40px",
  };

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(1200px 600px at 50% -10%, #0A1020 0%, #050B1A 60%, #050B1A 100%)" }}>
      {/* Navbar */}
      <nav className="sticky top-0 z-30 backdrop-blur-xl" style={{ backgroundColor: "rgba(5,11,26,0.75)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <PrivaLogo />
          <button
            onClick={scrollToForm}
            className="rounded-lg px-4 py-2 text-xs font-bold text-white transition-all duration-200"
            style={{ backgroundColor: "#3B82F6", boxShadow: "0 0 0 1px rgba(59,130,246,0.4), 0 8px 24px -8px rgba(59,130,246,0.6)" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#2563EB")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#3B82F6")}
          >
            Verificar meu CPF →
          </button>
        </div>
        {/* Neon accent line */}
        <div
          className="h-px w-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, #00D4FF, #3B5BDB, transparent)",
          }}
        />
      </nav>

      {/* Hero */}
      <section ref={heroRef} className="relative px-5 py-10" style={gridBg}>
        <div className="mx-auto flex max-w-sm flex-col items-center text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-white leading-[1.05]">
            Seu CPF foi
            <br />
            <span style={{ color: "#00D4FF" }}>vazado?</span>
          </h1>
          <p className="mt-3 text-sm text-gray-300">
            Descubra agora. 220M+ CPFs expostos no Brasil.
          </p>
          <p className="mt-2 text-sm font-medium" style={{ color: "#00D4FF" }}>
            ✓ {verifiedCount.toLocaleString("pt-BR")} pessoas verificaram hoje
          </p>

          {/* Trust pill badges */}
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {["🔒 Sem cadastro", "⚡ Resultado em 5s", "🛡️ LGPD compliant"].map((t) => (
              <span
                key={t}
                className="rounded-full border px-3 py-1 text-xs text-gray-300"
                style={{ backgroundColor: "#162444", borderColor: "#1E3060" }}
              >
                {t}
              </span>
            ))}
          </div>

          {phase !== "results" ? (
            <div
              className="mt-8 w-full rounded-2xl border p-6 text-left"
              style={{
                backgroundColor: "#162444",
                borderColor: "#1E3060",
                boxShadow:
                  "0 0 60px rgba(0,212,255,0.08), 0 25px 50px rgba(0,0,0,0.5)",
              }}
            >
              <h2 className="text-lg font-bold text-white">Verifique sua exposição agora</h2>
              <p className="mt-1 text-xs text-gray-400">
                Gratuito · Sem cadastro · Resultado em segundos
              </p>

              <label className="mt-5 block text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                CPF
              </label>
              <input
                value={cpf}
                onChange={(e) => setCpf(formatCPF(e.target.value))}
                placeholder="000.000.000-00"
                inputMode="numeric"
                disabled={phase === "loading"}
                className="mt-1.5 w-full rounded-xl border px-4 py-3 text-base font-medium tracking-wider text-white outline-none transition-all duration-200 placeholder:text-[#6B7280]"
                style={{ backgroundColor: "#0D1F4E", borderColor: "#1E3060" }}
              />

              <button
                onClick={submit}
                disabled={cpf.length < 14 || phase === "loading"}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold text-white transition-all duration-200 disabled:opacity-40"
                style={{ backgroundColor: "#3B5BDB" }}
                onMouseEnter={(e) => {
                  if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = "#4C6EF5";
                }}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#3B5BDB")}
              >
                {phase === "loading" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Verificando bases de dados...
                  </>
                ) : (
                  "Verificar agora"
                )}
              </button>

              <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[10px] text-gray-400">
                <ShieldCheck className="h-3 w-3" />
                Seus dados não são armazenados. Consulta segura e criptografada.
              </p>

              {/* Free value card */}
              <div
                className="mt-3 rounded-xl border p-3"
                style={{ backgroundColor: "#0D1F4E", borderColor: "#1E3060" }}
              >
                <p className="mb-2 text-xs font-medium text-gray-400">
                  ✓ Crie sua conta grátis e receba:
                </p>
                <ul className="space-y-1 text-xs text-gray-300">
                  <li>• Score de identidade atualizado</li>
                  <li>• 1 alerta de vazamento em tempo real</li>
                  <li>• Relatório básico do seu CPF</li>
                </ul>
                <p className="mt-2 text-xs text-gray-500">Sem cartão de crédito</p>
              </div>
            </div>
          ) : (
            <div className="mt-8 w-full animate-fade-in text-left">
              <div className="flex flex-col items-center text-center">
                <span className="relative grid h-20 w-20 place-items-center rounded-full bg-[var(--color-danger)]/15">
                  <span className="absolute inset-0 animate-ping rounded-full bg-[var(--color-danger)]/30" />
                  <AlertTriangle className="relative h-10 w-10 text-[var(--color-danger)]" />
                </span>
                <h2 className="mt-5 text-2xl font-extrabold text-white">
                  CPF encontrado em <span className="text-[var(--color-danger)]">3 vazamentos</span>
                </h2>
                <p className="mt-2 text-xs text-white/60">Análise concluída · {cpf}</p>
              </div>

              <ul className="mt-6 space-y-2.5">
                {["HackBR — 2024", "VarejoBR — 2024", "StreamBR — 2023"].map((s) => (
                  <li
                    key={s}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3.5"
                  >
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/10">
                      <Lock className="h-4 w-4 text-white/70" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white blur-[5px] select-none">{s}</p>
                      <p className="text-[10px] text-white/40">Origem oculta · Risco alto</p>
                    </div>
                  </li>
                ))}
              </ul>

              <p className="mt-5 text-center text-xs text-white/70">
                Ative o plano gratuito para ver os detalhes completos
              </p>

              <div className="mt-4 space-y-2.5">
                <button
                  onClick={enterFree}
                  className="w-full rounded-xl py-3.5 text-sm font-bold text-white transition-all duration-200 hover:opacity-90"
                  style={{ backgroundColor: "#3B5BDB" }}
                >
                  Ver detalhes grátis
                </button>
                <button
                  onClick={enterPremium}
                  className="w-full rounded-xl bg-[var(--color-teal)] py-3.5 text-sm font-bold text-[var(--color-navy)] transition-all duration-200 hover:opacity-90"
                >
                  Ativar proteção completa · R$19/mês
                </button>
              </div>
            </div>
          )}

          {/* Login link below card */}
          <button className="mt-5 text-xs text-gray-400 hover:text-white transition">
            Já tem conta? <span className="font-semibold text-white">Entrar</span>
          </button>
        </div>
      </section>

      {/* How it works */}
      <section className="px-5 py-12">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center text-2xl font-bold text-white">Como funciona</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              { Icon: Search, title: "Verificamos", desc: "Cruzamos seu CPF com 220M+ registros vazados." },
              { Icon: BarChart3, title: "Analisamos", desc: "Relatório claro do seu risco e exposição." },
              { Icon: Shield, title: "Protegemos", desc: "Monitoramento contínuo e alertas em tempo real." },
            ].map(({ Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border p-5"
                style={{ backgroundColor: "#162444", borderColor: "#1E3060" }}
              >
                <Icon className="h-10 w-10 stroke-2" style={{ color: "#00D4FF" }} />
                <h3 className="mt-4 font-bold text-white">{title}</h3>
                <p className="mt-1 text-sm text-gray-400">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-5 pb-16">
        <div className="mx-auto grid max-w-3xl grid-cols-3 gap-4 text-center">
          {[
            { n: "220M+", l: "CPFs expostos" },
            { n: "12.847", l: "Verificações hoje" },
            { n: "98%", l: "Detectam vazamento" },
          ].map((s) => (
            <div key={s.l}>
              <p className="text-2xl font-extrabold" style={{ color: "#00D4FF" }}>
                {s.n}
              </p>
              <p className="mt-1 text-xs text-gray-400">{s.l}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
