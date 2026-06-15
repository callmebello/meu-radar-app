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
 * and starts the scan. Designed to fit a phone screen with no scroll.
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
      <div className="flex flex-1 flex-col px-6 pb-5 pt-1">
        {/* hero shield (no letter) */}
        <div className="relative mx-auto mt-1 grid h-20 w-20 place-items-center">
          <span className="absolute h-20 w-20 rounded-full border border-indigo-500/15" />
          <Shield
            className="h-14 w-14 text-indigo-400"
            strokeWidth={1.4}
            style={{ filter: "drop-shadow(0 0 18px rgba(99,102,241,0.6))" }}
          />
        </div>

        {/* headline (compact) */}
        <h1 className="mt-3 text-center text-xl font-extrabold leading-snug text-white">
          A Priva descobre onde seus dados estão <span className="text-indigo-400">expostos</span> e ajuda a{" "}
          <span className="text-indigo-400">removê-los</span>.
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-center text-xs leading-relaxed text-gray-400">
          Analisamos CPF, e-mail, telefone e possíveis vazamentos para proteger sua identidade digital.
        </p>

        {/* CPF */}
        <label className="mt-4 block text-sm font-semibold text-white">CPF</label>
        <div className="relative mt-1.5">
          <span
            className="animate-nudge-bounce absolute -top-2.5 right-3 z-10 rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow-lg"
            style={{ background: "linear-gradient(135deg,#4F46E5,#6366F1)" }}
          >
            Scan 100% grátis ✨
          </span>
          <input
            value={cpf}
            onChange={(e) => setCpf(formatCPF(e.target.value))}
            inputMode="numeric"
            placeholder="000.000.000-00"
            className="w-full rounded-xl py-3 pl-4 pr-12 text-white outline-none placeholder:text-white/25"
            style={{ backgroundColor: "#12121A", border: "1px solid rgba(99,102,241,0.25)" }}
          />
          <IdCard className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
        </div>

        {/* E-mail */}
        <label className="mt-3 block text-sm font-semibold text-white">E-mail</label>
        <div className="relative mt-1.5">
          <span
            className="animate-nudge-bounce absolute -top-2.5 right-3 z-10 rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow-lg"
            style={{ background: "linear-gradient(135deg,#4F46E5,#6366F1)", animationDelay: "0.5s" }}
          >
            Receba o resultado grátis
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="seu@email.com"
            className="w-full rounded-xl py-3 pl-4 pr-12 text-white outline-none placeholder:text-white/25"
            style={{ backgroundColor: "#12121A", border: "1px solid rgba(99,102,241,0.25)" }}
          />
          <Mail className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
        </div>

        {/* CTA */}
        <button
          onClick={submit}
          disabled={!valid}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-lg font-bold text-white transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
          style={{ background: "linear-gradient(135deg,#4F46E5,#6366F1)", boxShadow: "0 8px 28px rgba(79,70,229,0.4)" }}
        >
          Fazer Scan Grátis <ArrowRight className="h-5 w-5" />
        </button>

        {/* feature cards */}
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-center"
              style={{ backgroundColor: "#12121A", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <f.Icon className="h-5 w-5 text-indigo-400" strokeWidth={1.8} />
              <p className="text-[11px] font-semibold leading-tight text-white">{f.title}</p>
            </div>
          ))}
        </div>

        {/* social proof */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex -space-x-2.5">
            {["#6366F1", "#8B5CF6", "#4F46E5"].map((c, i) => (
              <span
                key={i}
                className="h-8 w-8 rounded-full border-2"
                style={{ background: `linear-gradient(135deg, ${c}, #1e1b4b)`, borderColor: "#0A0A0F" }}
              />
            ))}
          </div>
          <div>
            <p className="text-[13px] text-white">
              <span className="font-bold text-indigo-400">+18.427</span> verificações realizadas
            </p>
            <p className="text-[11px] text-gray-500">Milhares de brasileiros já verificaram seus dados.</p>
          </div>
        </div>
      </div>
    </>
  );
}
