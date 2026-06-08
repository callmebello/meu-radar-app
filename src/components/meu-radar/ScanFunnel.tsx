import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CreditCard, Mail, Phone, MapPin, Lock, Check, X, ChevronDown, Flame, ShieldCheck, Trash2 } from "lucide-react";
import { formatCPF, isValidCPF, generateResult, maskedFields, MP_FUNDADOR_URL, MP_DEFESA_URL } from "@/lib/funnel";
import { useApp } from "@/contexts/AppContext";

const SCAN_STEPS = [
  { t: "Verificando CPF na Receita Federal...", at: 0 },
  { t: "Consultando bases de vazamentos...", at: 800 },
  { t: "Analisando dark web...", at: 1600 },
  { t: "Cruzando informações...", at: 2400 },
  { t: "Gerando relatório...", at: 3000 },
];

function ScanRadar() {
  return (
    <svg width="120" height="120" viewBox="0 0 48 48" fill="none" style={{ filter: "drop-shadow(0 0 12px #4F46E5)" }}>
      <circle cx="24" cy="24" r="8" stroke="#6366F1" strokeWidth="0.8" fill="none" opacity="0.7" />
      <circle cx="24" cy="24" r="16" stroke="#6366F1" strokeWidth="0.8" fill="none" opacity="0.5" />
      <circle cx="24" cy="24" r="22" stroke="#6366F1" strokeWidth="0.8" fill="none" opacity="0.35" />
      <g className="scan-sweep">
        <path d="M24 24 L24 1 A 23 23 0 0 1 40 8 Z" fill="rgba(99,102,241,0.45)" />
        <line x1="24" y1="24" x2="24" y2="1" stroke="#A5B4FC" strokeWidth="1.2" />
      </g>
      <circle cx="24" cy="24" r="2" fill="#fff" />
    </svg>
  );
}

export function ScanFunnel({ open, onClose, onScanStart }: { open: boolean; onClose: () => void; onScanStart?: () => void }) {
  const { setIsPremium } = useApp();
  const [phase, setPhase] = useState<"cpf" | "scanning" | "result" | "success">("cpf");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [doneSteps, setDoneSteps] = useState<number[]>([]);
  const [barFull, setBarFull] = useState(false);
  const [count, setCount] = useState(0);
  const [showOther, setShowOther] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [vagas] = useState(487);
  const [activated] = useState(() => 87 + Math.floor(Math.random() * 48));
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };

  const startScanning = () => {
    setPhase("scanning");
    setDoneSteps([]);
    setBarFull(false);
    timers.current.push(setTimeout(() => setBarFull(true), 60));
    SCAN_STEPS.forEach((s, i) => timers.current.push(setTimeout(() => setDoneSteps((p) => [...p, i]), s.at)));
    timers.current.push(setTimeout(() => setPhase("result"), 3500));
  };

  // init when opened
  useEffect(() => {
    if (!open) return;
    setRedirecting(false);
    setShowOther(false);
    setCount(0);
    const stored = typeof window !== "undefined" ? sessionStorage.getItem("priva_cpf") : null;
    if (stored && isValidCPF(stored)) {
      setCpf(stored);
      setPhase("result"); // inline scan already ran on the dashboard
    } else {
      setPhase("cpf");
    }
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const result = generateResult(cpf);
  const mask = maskedFields(cpf, result.seed);

  // count up hero number when result shows
  useEffect(() => {
    if (phase !== "result") return;
    setCount(0);
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min((now - start) / 800, 1);
      setCount(Math.round(p * result.breaches));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // success → unlock app after the confetti
  useEffect(() => {
    if (phase !== "success") return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem("priva_is_paid", "true");
      } catch {
        /* ignore */
      }
      setIsPremium(true);
      onClose();
    }, 2600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  if (!open) return null;

  const submitCpf = () => {
    try {
      sessionStorage.setItem("priva_cpf", cpf);
    } catch {
      /* ignore */
    }
    onScanStart?.(); // inline scan on the dashboard; result opens after
  };

  const checkout = (url: string) => {
    if (!email.includes("@")) return;
    try {
      sessionStorage.setItem("priva_email", email);
    } catch {
      /* ignore */
    }
    // mock: create anonymous user with email (Supabase plugs in here later)
    if (url && !url.includes("placeholder")) {
      setRedirecting(true);
      window.open(url, "_blank");
    } else {
      // dev/mock (placeholder MP link): simulate activation so flow is testable
      setPhase("success");
    }
  };

  // 1 visible data point + 3 blurred — curiosity gap
  const rows = [
    { Icon: CreditCard, label: "CPF", value: `•••.•••.•••-${mask.cpfLast2}`, badge: "ALTO", color: "#F87171", bg: "rgba(239,68,68,0.2)", blur: false },
    { Icon: Mail, label: "E-mail", value: `${mask.first}•••••@${mask.domain}`, badge: "MÉDIO", color: "#FBBF24", bg: "rgba(245,158,11,0.2)", blur: true },
    { Icon: Phone, label: "Telefone", value: `(11) 9••••-${mask.phoneLast4}`, badge: "BAIXO", color: "#34D399", bg: "rgba(34,197,94,0.2)", blur: true },
    { Icon: MapPin, label: "Endereço", value: "Rua ••••••, São Paulo — SP", badge: "ALTO", color: "#F87171", bg: "rgba(239,68,68,0.2)", blur: true },
  ];

  /* ---------- PHASE: CPF — centered security modal ---------- */
  if (phase === "cpf") {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
        <div
          className="w-full max-w-sm rounded-3xl p-6 text-center animate-scale-in"
          style={{ backgroundColor: "#0A0A0F", border: "1px solid rgba(99,102,241,0.25)", boxShadow: "0 0 50px rgba(79,70,229,0.25)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl" style={{ backgroundColor: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)" }}>
            <ShieldCheck className="h-7 w-7 text-indigo-400" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-white">Verificação de segurança</h2>
          <p className="mt-2 text-sm text-gray-400">Digite seu CPF para verificar sua exposição digital</p>
          <input
            value={cpf}
            onChange={(e) => setCpf(formatCPF(e.target.value))}
            inputMode="numeric"
            placeholder="000.000.000-00"
            className="mt-5 w-full rounded-2xl px-5 py-4 text-center font-mono text-xl text-white outline-none placeholder:text-white/25"
            style={{ backgroundColor: "#12121A", border: "1px solid rgba(99,102,241,0.3)" }}
          />
          <button
            onClick={submitCpf}
            disabled={!isValidCPF(cpf)}
            className="mt-4 w-full rounded-2xl py-4 text-base font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,#4F46E5,#6366F1)" }}
          >
            Iniciar Scan →
          </button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-gray-600">
            <Lock className="h-3 w-3 text-indigo-400" /> Criptografado · Não armazenamos seu CPF
          </p>
        </div>
      </div>
    );
  }

  /* ---------- PHASE: scanning ---------- */
  if (phase === "scanning") {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center px-6" style={{ backgroundColor: "#0A0A0F" }}>
        <ScanRadar />
        <div className="mt-7 flex w-full max-w-xs flex-col gap-2.5">
          {SCAN_STEPS.map((s, i) => {
            const done = doneSteps.includes(i);
            const active = doneSteps.length === i;
            return (
              <div key={i} className="flex items-center gap-2.5 text-sm">
                {done ? (
                  <Check className="h-4 w-4 shrink-0 text-green-400" />
                ) : (
                  <span className="h-4 w-4 shrink-0" />
                )}
                <span style={{ color: done ? "#4ADE80" : active ? "#A5B4FC" : "#4B5563" }}>{s.t}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-6 h-1 w-full max-w-xs overflow-hidden rounded-full" style={{ backgroundColor: "#12121A" }}>
          <div
            className="h-full rounded-full"
            style={{ width: barFull ? "100%" : "0%", backgroundColor: "#6366F1", transition: "width 3.2s linear" }}
          />
        </div>
      </div>
    );
  }

  /* ---------- PHASE: success (confetti) ---------- */
  if (phase === "success") {
    const colors = ["#4F46E5", "#6366F1", "#22C55E", "#F59E0B", "#EF4444", "#A5B4FC"];
    return (
      <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center overflow-hidden px-6 text-center" style={{ backgroundColor: "#0A0A0F" }}>
        {Array.from({ length: 44 }).map((_, i) => (
          <span
            key={i}
            className="confetti-piece"
            style={{
              left: `${Math.random() * 100}%`,
              backgroundColor: colors[i % colors.length],
              animationDuration: `${1.4 + Math.random() * 1.6}s`,
              animationDelay: `${Math.random() * 0.6}s`,
            }}
          />
        ))}
        <div className="grid h-20 w-20 place-items-center rounded-full" style={{ backgroundColor: "rgba(34,197,94,0.15)" }}>
          <Check className="h-10 w-10 text-green-400" />
        </div>
        <h2 className="mt-4 text-2xl font-extrabold text-white">Proteção ativada!</h2>
        <p className="mt-2 text-sm text-gray-400">Seu relatório completo está sendo carregado...</p>
      </div>
    );
  }

  /* ---------- PHASE: result + checkout ---------- */
  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto" style={{ backgroundColor: "#0A0A0F" }}>
      <button
        onClick={onClose}
        aria-label="Fechar"
        className="fixed right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/[0.06] text-gray-300 hover:bg-white/10"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="mx-auto max-w-md px-5 pb-10">
        {/* badge */}
        <div className="mt-2 flex justify-center">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold tracking-wider"
            style={{ backgroundColor: "rgba(99,102,241,0.15)", border: "1px solid #4F46E5", color: "#A5B4FC" }}
          >
            <Check className="h-3.5 w-3.5" /> ANÁLISE CONCLUÍDA
          </span>
        </div>

        {/* hero */}
        <div className="mt-3 flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border animate-danger-pulse" style={{ backgroundColor: "rgba(239,68,68,0.1)", borderColor: "rgba(239,68,68,0.2)" }}>
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </span>
          <div>
            <h1 className="text-lg font-extrabold leading-tight text-white">
              Seus dados foram encontrados em{" "}
              <span className="text-xl text-red-500">{count} vazamentos</span>
            </h1>
          </div>
        </div>
        <p className="mt-1.5 text-xs text-gray-400">Encontramos informações associadas ao seu CPF, e-mail e telefone.</p>

        {/* data rows — 1 visible, 3 blurred (curiosity) */}
        <div className="mt-2.5 space-y-1.5">
          {rows.map((r) => (
            <div key={r.label} className="flex items-center gap-2.5 rounded-xl px-3 py-1.5" style={{ backgroundColor: "#12121A", border: "1px solid rgba(255,255,255,0.05)" }}>
              <span className="grid place-items-center rounded-lg p-1" style={{ backgroundColor: "rgba(99,102,241,0.1)" }}>
                <r.Icon className="h-4 w-4" style={{ color: "#A5B4FC" }} />
              </span>
              <p className="text-sm font-medium text-white">{r.label}</p>
              <p className={`min-w-0 flex-1 truncate text-xs text-gray-400 ${r.blur ? "select-none blur-[4px]" : ""}`}>{r.value}</p>
              {r.blur && <Lock className="h-3 w-3 shrink-0 text-gray-500" />}
              <span className="rounded-full px-2 py-0.5 text-xs font-bold" style={{ color: r.color, backgroundColor: r.bg }}>{r.badge}</span>
            </div>
          ))}
        </div>

        {/* divider */}
        <div className="mt-3 flex items-center gap-3">
          <div className="h-px flex-1" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />
          <span className="text-xs text-gray-500">Proteja-se agora</span>
          <div className="h-px flex-1" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />
        </div>

        {/* Fundador plan card */}
        <div className="relative mt-3 rounded-2xl border-2 p-3.5" style={{ background: "linear-gradient(135deg,#1a1a4e,#1e1b4b)", borderColor: "#6366F1" }}>
          <span className="absolute -top-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full px-3 py-1 text-[10px] font-bold text-white" style={{ backgroundColor: "#4F46E5" }}>
            <Flame className="h-3 w-3 text-orange-300" /> OFERTA DE LANÇAMENTO · {vagas} VAGAS
          </span>
          <p className="mt-1 text-sm text-indigo-300">Fundador</p>
          <div className="flex items-end gap-1">
            <span className="text-2xl font-extrabold text-white">R$9,90</span>
            <span className="mb-0.5 text-sm text-gray-400">/mês · preço travado</span>
          </div>
          <ul className="mt-2 space-y-1">
            {["CPF + e-mail + telefone protegidos", "Alertas em tempo real", "Dark web monitorada", "Relatório completo desbloqueado"].map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-gray-200">
                <Check className="h-4 w-4 shrink-0 text-green-400" /> {f}
              </li>
            ))}
          </ul>

          {/* email */}
          <p className="mt-2.5 mb-1.5 text-sm text-gray-400">Para onde enviamos seu relatório?</p>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            className="w-full rounded-xl px-4 py-2.5 text-white outline-none placeholder:text-white/25"
            style={{ backgroundColor: "#12121A", border: "1px solid rgba(99,102,241,0.3)" }}
          />

          {/* Two CTAs — price anchoring: R$9,90 (ver) vs R$19,90 (resolver) */}
          <div className="mt-2.5 space-y-2">
            <button
              onClick={() => checkout(MP_FUNDADOR_URL)}
              disabled={!email.includes("@") || redirecting}
              className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition-all active:scale-[0.99] disabled:opacity-50"
              style={{ background: "linear-gradient(135deg,#4F46E5,#6366F1)", boxShadow: "0 0 24px rgba(79,70,229,0.45)" }}
            >
              <span className="flex items-center gap-2">
                <Lock className="h-4 w-4 shrink-0 text-white" />
                <span>
                  <span className="block text-sm font-extrabold text-white">Ver relatório completo</span>
                  <span className="block text-[11px] text-white/70">Descubra onde seus dados vazaram</span>
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-base font-extrabold text-white">R$9,90</span>
                <span className="block text-[10px] text-white/70">/mês</span>
              </span>
            </button>

            <button
              onClick={() => checkout(MP_DEFESA_URL)}
              disabled={!email.includes("@") || redirecting}
              className="flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition-all active:scale-[0.99] disabled:opacity-50"
              style={{ backgroundColor: "rgba(255,255,255,0.04)", border: "1px solid rgba(124,58,237,0.4)" }}
            >
              <span className="flex items-center gap-2">
                <Trash2 className="h-4 w-4 shrink-0 text-purple-300" />
                <span>
                  <span className="block text-sm font-bold text-white">Remover meus dados</span>
                  <span className="block text-[11px] text-gray-400">Exclusão definitiva via LGPD</span>
                </span>
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-base font-extrabold text-white">R$19,90</span>
                <span className="block text-[10px] text-gray-400">/mês</span>
              </span>
            </button>
          </div>

          {redirecting && <p className="mt-2 text-center text-xs text-indigo-300">Redirecionando para pagamento seguro...</p>}
          <p className="mt-2 text-center text-xs text-indigo-300">+{activated} pessoas ativaram hoje</p>
          <p className="mt-1 text-center text-xs text-gray-600">Seguro · LGPD · Cancele quando quiser</p>
        </div>

        {/* other plans */}
        <button onClick={() => setShowOther((v) => !v)} className="mx-auto mt-3 flex items-center justify-center gap-1 text-xs text-gray-600 hover:text-gray-400">
          Ver outros planos <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showOther ? "rotate-180" : ""}`} />
        </button>
        {showOther && (
          <div className="mt-3 space-y-2">
            {[
              { n: "Score+", p: "R$29,90", d: "Score Boavista + negativações" },
              { n: "Família", p: "R$39,90", d: "Até 6 CPFs monitorados" },
            ].map((pl) => (
              <div key={pl.n} className="flex items-center justify-between rounded-xl px-4 py-3" style={{ backgroundColor: "#12121A", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div>
                  <p className="text-sm font-semibold text-white">{pl.n}</p>
                  <p className="text-xs text-gray-500">{pl.d}</p>
                </div>
                <span className="text-sm font-bold text-white">{pl.p}<span className="text-xs font-normal text-gray-500">/mês</span></span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
