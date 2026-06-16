import { useState } from "react";
import { AppHeader } from "./Header";
import { ShieldCheck, CircleCheck, Zap, IdCard, Mail, ArrowRight } from "lucide-react";
import { formatCPF, isValidCPF, isValidEmail } from "@/lib/funnel";

const FEATURES = [
  { Icon: CircleCheck, title: "100% gratuito" },
  { Icon: Zap, title: "Resultado rápido" },
  { Icon: ShieldCheck, title: "Conforme LGPD" },
];

const AVATARS = [
  "https://i.pravatar.cc/64?img=12",
  "https://i.pravatar.cc/64?img=32",
  "https://i.pravatar.cc/64?img=45",
];

/**
 * Initial scan landing (Priva tab, before the first scan). Collects CPF + e-mail
 * and starts the scan. Designed to fit a phone screen with no scroll.
 */
export function ScanLanding({ onSubmit }: { onSubmit: (cpf: string, email: string) => void }) {
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");

  const valid = isValidCPF(cpf) && isValidEmail(email);
  const submit = () => {
    if (!valid) return;
    onSubmit(cpf, email.trim());
  };

  return (
    <>
      <AppHeader title="" showBell />
      <div className="flex flex-1 flex-col justify-between px-6 pb-7 pt-5">
        {/* headline */}
        <div>
          <h1 className="text-center text-3xl font-extrabold leading-tight text-white md:text-4xl">
            Seu CPF foi <span className="text-indigo-400">vazado?</span>
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-center text-base leading-relaxed text-gray-300">
            Descubra agora e remova seus dados da internet.
          </p>
        </div>

        {/* form */}
        <div className="py-2">
        {/* CPF */}
        <label className="block text-sm font-semibold text-white">CPF</label>
        <div className="relative mt-2">
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
            className="w-full rounded-xl py-4 pl-4 pr-12 text-white outline-none placeholder:text-white/25"
            style={{ backgroundColor: "#12121A", border: "1px solid rgba(99,102,241,0.25)" }}
          />
          <IdCard className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
        </div>

        {/* E-mail */}
        <label className="mt-4 block text-sm font-semibold text-white">E-mail</label>
        <div className="relative mt-2">
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
            className="w-full rounded-xl py-4 pl-4 pr-12 text-white outline-none placeholder:text-white/25"
            style={{ backgroundColor: "#12121A", border: "1px solid rgba(99,102,241,0.25)" }}
          />
          <Mail className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
        </div>

        {/* CTA */}
        <button
          onClick={submit}
          disabled={!valid}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-lg font-bold text-white transition-all active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
          style={{ background: "linear-gradient(135deg,#4F46E5,#6366F1)", boxShadow: "0 8px 28px rgba(79,70,229,0.4)" }}
        >
          Fazer Scan Grátis <ArrowRight className="h-5 w-5" />
        </button>
        </div>

        {/* bottom: cards + social proof */}
        <div>
        {/* feature cards */}
        <div className="grid grid-cols-3 gap-2.5">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="flex flex-col items-center gap-1.5 rounded-xl px-2 py-4 text-center"
              style={{ backgroundColor: "#12121A", border: "1px solid rgba(255,255,255,0.05)" }}
            >
              <f.Icon className="h-6 w-6 text-indigo-400" strokeWidth={1.8} />
              <p className="text-xs font-semibold leading-tight text-white">{f.title}</p>
            </div>
          ))}
        </div>

        {/* social proof */}
        <div className="mt-5 flex items-center gap-3">
          <div className="flex -space-x-2.5">
            {AVATARS.map((src, i) => (
              <img
                key={i}
                src={src}
                alt=""
                loading="lazy"
                className="h-9 w-9 rounded-full border-2 object-cover"
                style={{ borderColor: "#0A0A0F" }}
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
      </div>
    </>
  );
}
