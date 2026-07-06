import { useState } from "react";
import { ShieldCheck, Lock } from "lucide-react";
import { formatCPF, isValidCPF, isValidEmail } from "@/lib/funnel";

/**
 * First-visit CPF capture gate (LGPD-compliant). Collects CPF + e-mail + consent,
 * stores them in sessionStorage and starts the scan via onSubmit.
 */
export function CPFModal({ onSubmit }: { onSubmit: (cpf: string, email: string) => void }) {
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [touchedCpf, setTouchedCpf] = useState(false);
  const [consent, setConsent] = useState(false);

  const cpfValid = isValidCPF(cpf);
  const emailValid = isValidEmail(email);
  const canSubmit = cpfValid && emailValid && consent;
  const showCpfError = touchedCpf && cpf.length > 0 && !cpfValid;

  const submit = () => {
    if (!canSubmit) return;
    try {
      sessionStorage.setItem("priva_cpf", cpf);
      sessionStorage.setItem("priva_email", email.trim());
    } catch {
      /* ignore */
    }
    onSubmit(cpf, email.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-5 backdrop-blur-md">
      <div
        className="w-full max-w-sm rounded-2xl p-6"
        style={{
          backgroundColor: "#0E0E1A",
          border: "1px solid rgba(99,102,241,0.2)",
          boxShadow: "0 0 60px rgba(79,70,229,0.15)",
        }}
      >
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500/10">
          <ShieldCheck className="h-7 w-7 text-indigo-400" />
        </div>

        <h2 className="text-center text-xl font-bold text-white">Scan Gratuito de Dados</h2>
        <p className="mb-5 mt-1 text-center text-sm text-gray-400">
          Verificamos CPF, e-mail e dark web
        </p>

        {/* CPF */}
        <label className="mb-1 block text-sm font-medium text-gray-300">CPF</label>
        <input
          value={cpf}
          onChange={(e) => setCpf(formatCPF(e.target.value))}
          onBlur={() => setTouchedCpf(true)}
          inputMode="numeric"
          placeholder="000.000.000-00"
          className="w-full rounded-xl px-4 py-4 text-center font-mono text-lg text-white outline-none placeholder:text-white/25"
          style={{ backgroundColor: "#12121A", border: "1px solid rgba(99,102,241,0.3)" }}
        />
        {showCpfError && <p className="mt-1 text-xs text-red-400">CPF inválido</p>}

        {/* E-mail */}
        <label className="mb-1 mt-4 block text-sm font-medium text-gray-300">E-mail</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="seu@email.com"
          className="w-full rounded-xl px-4 py-4 text-center text-lg text-white outline-none placeholder:text-white/25"
          style={{ backgroundColor: "#12121A", border: "1px solid rgba(99,102,241,0.3)" }}
        />

        {/* CTA */}
        <button
          onClick={submit}
          disabled={!canSubmit}
          className="mt-4 w-full rounded-xl py-4 font-bold text-white transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          style={{
            background: "linear-gradient(135deg,#4F46E5,#6366F1)",
            boxShadow: "0 0 20px rgba(79,70,229,0.3)",
          }}
        >
          Fazer Scan Grátis →
        </button>

        {/* LGPD assurance */}
        <div className="mt-3 flex items-center gap-2">
          <Lock className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
          <span className="text-xs text-gray-500">
            Seus dados são protegidos e nunca compartilhados
          </span>
        </div>

        {/* LGPD consent */}
        <label className="mt-2 flex items-start gap-2 text-xs text-gray-500">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 accent-indigo-500"
          />
          <span>
            Concordo com a{" "}
            <a
              href="/termos"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 underline"
            >
              Política de Privacidade
            </a>
          </span>
        </label>
      </div>
    </div>
  );
}
