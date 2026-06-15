import { useState } from "react";
import { AppHeader } from "./Header";
import { Shield, ShieldCheck, CircleCheck, Zap, IdCard, Mail, ArrowRight } from "lucide-react";
import { formatCPF, isValidCPF } from "@/lib/funnel";

const FEATURES = [
  { Icon: CircleCheck, title: "100% gratuito" },
  { Icon: Zap, title: "Resultado rápido" },
  { Icon: ShieldCheck, title: "Conforme LGPD" },
];

/**
 * Initial scan landing (Priva tab, before the first scan). Collects CPF + e-mail
 * and starts the scan. Matches the hero mockup.
 */
export function ScanLanding({ onSubmit }: { onSubmit: (cpf: string, email: string) => void }) {
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");

  const valid = isValidCPF(cpf);
  const submit = () => {
    if (!valid) return;
    onSubmit(cpf, email.trim());
  };

  return (
    <>
      <AppHeader title="" showBell />
      <div className="flex flex-1 flex-col px-6 pb-6 pt-2">
        {/* hero shield */}
        <div className="relative mx-auto mt-2 grid h-36 w-36 place-items-center">
          <span className="absolute h-32 w-32 rounded-full border border-indigo-500/15" />
          <span className="absolute h-24 w-24 rounded-full border border-indigo-500/20" />
          <Shield
            className="h-28 w-28 text-indigo-400"
            strokeWidth={1.4}
            style={{ filter: "drop-shadow(0 0 22px rgba(99,102,241,0.65))" }}
          />
          <span className="absolute text-4xl font-black text-indigo-200" style={{ textShadow: "0 0 16px rgba(129,140,248,0.8)" }}>
            P
          </span>
        </div>

        {/* headline */}
        <h1 className="mt-6 text-center text-[1.7rem] font-extrabold leading-tight text-white">
          A Priva descobre onde seus dados estão <span className="text-indigo-400">expostos</span> e ajuda a <span className="text-indigo-400">removê-los</span>.
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-center text-sm leading-relaxed text-gray-400">
          Analisamos CPF, e-mail, telefone e possíveis vazamentos para proteger sua identidade digital.
        </p>

        {/* CPF */}
        <label className="mt-7 block text-sm font-semibold text-white">CPF</label>
        <div className="relative mt-2">
          <input
            value={cpf}
            onChange={(e) => setCpf(formatCPF(e.target.value))}
            inputMode="numeric"
            placeholder="000.000.000-00"
            className="w-full rounded-xl py-4 pl-4 pr-12 text-white outline-none placeholder:text-white/25"
            style={{ backgroundColor: "#12121A", border: "1px solid rgba(99,102,241,0.25)" }}
          />
          <IdCard className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
        </div>

        {/* E-mail */}
        <label className="mt-5 block text-sm font-semibold text-white">E-mail</label>
        <div className="relative mt-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="seu@email.com"
            className="w-full rounded-xl py-4 pl-4 pr-12 text-white outline-none placeholder:text-white/25"
            style={{ backgroundColor: "#12121A", border: "1px solid rgba(99,102,241,0.25)" }}
          />
          <Mail className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
        </div>

        {/* CTA */}
        <button
          onClick={submit}
          disabled={!valid}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-lg font-bold text-white transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
          style={{ background: "linear-gradient(135deg,#4F46E5,#6366F1)", boxShadow: "0 8px 28px rgba(79,70,229,0.4)" }}
        >
          Fazer Scan Grátis <ArrowRight className="h-5 w-5" />
        </button>

        {/* feature cards */}
        <div className="mt-6 grid grid-cols-3 gap-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="flex flex-col items-center gap-2 rounded-xl px-2 py-3.5 text-center"
              style={{ backgroundColor: "#12121A", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <f.Icon className="h-5 w-5 text-indigo-400" strokeWidth={1.8} />
              <p className="text-[12px] font-semibold leading-tight text-white">{f.title}</p>
            </div>
          ))}
        </div>

        {/* social proof */}
        <div className="mt-6 flex items-center gap-3">
          <div className="flex -space-x-2.5">
            {["#6366F1", "#8B5CF6", "#4F46E5"].map((c, i) => (
              <span
                key={i}
                className="h-9 w-9 rounded-full border-2"
                style={{ background: `linear-gradient(135deg, ${c}, #1e1b4b)`, borderColor: "#0A0A0F" }}
              />
            ))}
          </div>
          <div>
            <p className="text-sm text-white">
              <span className="font-bold text-indigo-400">+18.427</span> verificações realizadas
            </p>
            <p className="text-xs text-gray-500">Milhares de brasileiros já verificaram seus dados.</p>
          </div>
        </div>
      </div>
    </>
  );
}
