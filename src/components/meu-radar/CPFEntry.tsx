import { useState } from "react";
import { Loader2, Lock, ShieldCheck, AlertTriangle } from "lucide-react";
import logo from "@/assets/logo.png";
import { useApp } from "@/contexts/AppContext";

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

  const submit = () => {
    setPhase("loading");
    setTimeout(() => setPhase("results"), 2500);
  };

  const enterFree = () => setHasChecked(true);
  const enterPremium = () => {
    setIsPremium(true);
    setHasChecked(true);
  };

  return (
    <div className="min-h-screen bg-[#0b0b0d] px-5 py-10 flex flex-col items-center">
      <div className="flex flex-col items-center gap-2">
        <img src={logo} alt="Meu Radar" className="h-14 w-14 object-contain" />
        <p className="text-xs font-medium text-white/60">Proteja sua identidade digital</p>
      </div>

      {phase !== "results" ? (
        <div className="mt-10 w-full max-w-sm rounded-2xl bg-card p-6 shadow-xl">
          <h1 className="text-xl font-bold text-foreground">Verifique sua exposição agora</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Gratuito · Sem cadastro · Resultado em segundos
          </p>

          <label className="mt-5 block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            CPF
          </label>
          <input
            value={cpf}
            onChange={(e) => setCpf(formatCPF(e.target.value))}
            placeholder="000.000.000-00"
            inputMode="numeric"
            disabled={phase === "loading"}
            className="mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-3 text-base font-medium tracking-wider text-foreground outline-none focus:border-[var(--color-navy)] transition-all duration-200"
          />

          <button
            onClick={submit}
            disabled={cpf.length < 14 || phase === "loading"}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-navy)] py-3.5 text-sm font-bold text-white transition-all duration-200 disabled:opacity-40"
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

          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[10px] text-muted-foreground">
            <ShieldCheck className="h-3 w-3" />
            Seus dados não são armazenados. Consulta segura e criptografada.
          </p>
        </div>
      ) : (
        <div className="mt-10 w-full max-w-sm animate-fade-in">
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
                  <p className="text-sm font-semibold text-white blur-[5px] select-none">
                    {s}
                  </p>
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
              className="w-full rounded-xl bg-[var(--color-navy)] py-3.5 text-sm font-bold text-white transition-all duration-200 hover:opacity-90"
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

      <button className="mt-8 text-xs text-white/50 hover:text-white/80 transition">
        Já tem conta? <span className="font-semibold">Entrar</span>
      </button>
    </div>
  );
}
