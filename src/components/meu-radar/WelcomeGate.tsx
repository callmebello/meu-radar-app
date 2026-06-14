import { useEffect, useState } from "react";
import { ShieldCheck, Lock } from "lucide-react";
import { formatCPF, isValidCPF } from "@/lib/funnel";

export function WelcomeGate() {
  const [phase, setPhase] = useState<"welcome" | "modal" | "done">(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("priva_cpf")) return "done";
    return "welcome";
  });
  const [cpf, setCpf] = useState("");

  useEffect(() => {
    if (phase !== "welcome") return;
    const t = setTimeout(() => setPhase("modal"), 2000);
    return () => clearTimeout(t);
  }, [phase]);

  if (phase === "done") return null;

  if (phase === "welcome") {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center" style={{ backgroundColor: "#0A0A0F" }}>
        <img src="/PRIVA_letter_only_logo.png" alt="PRIVA" className="mx-auto h-8 w-auto" />
        <p className="mt-6 text-center text-sm text-gray-400">Verificando exposição de dados...</p>
        <div className="mx-auto mt-4 h-1 w-48 overflow-hidden rounded" style={{ backgroundColor: "#12121A" }}>
          <div className="h-full w-full origin-left rounded bg-indigo-500 animate-[welcomebar_2s_linear_forwards]" />
        </div>
      </div>
    );
  }

  const submit = () => {
    try {
      sessionStorage.setItem("priva_cpf", cpf);
    } catch {
      /* ignore */
    }
    setPhase("done");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 px-5 backdrop-blur-md">
      <div className="w-full max-w-sm rounded-2xl p-6" style={{ backgroundColor: "#0E0E1A", border: "1px solid rgba(99,102,241,0.2)" }}>
        <ShieldCheck className="mx-auto mb-4 h-16 w-16 text-indigo-400" />
        <h2 className="text-center text-xl font-bold text-white">Scan Gratuito de Dados</h2>
        <p className="mt-1 mb-5 text-center text-sm text-gray-400">Verificamos CPF, e-mail e dark web</p>
        <input
          value={cpf}
          onChange={(e) => setCpf(formatCPF(e.target.value))}
          inputMode="numeric"
          placeholder="000.000.000-00"
          className="w-full rounded-xl px-4 py-4 text-center font-mono text-lg text-white outline-none placeholder:text-white/25"
          style={{ backgroundColor: "#12121A", border: "1px solid rgba(99,102,241,0.3)" }}
        />
        <button
          onClick={submit}
          disabled={!isValidCPF(cpf)}
          className="mt-4 w-full rounded-xl py-4 font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-40"
          style={{ background: "linear-gradient(135deg,#4F46E5,#6366F1)" }}
        >
          Verificar Gratuitamente →
        </button>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-gray-500">
          <Lock className="h-3 w-3" /> CPF criptografado · Conforme LGPD
        </p>
      </div>
    </div>
  );
}
