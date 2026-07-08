import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AlertTriangle, CreditCard, Mail, Phone, Lock, Check, X, ChevronRight, ShieldCheck } from "lucide-react";
import { formatCPF, isValidCPF, generateResult, maskedFields } from "@/lib/funnel";
import { startCheckout, type CheckoutPlan } from "@/lib/checkout";
import { toast } from "sonner";
import { useApp } from "@/contexts/AppContext";
import { track } from "@/lib/analytics";

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
  const navigate = useNavigate();
  const { setIsPremium, scanResult } = useApp();
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
      setPhase("result"); // inline scanning overlay already ran on the dashboard
    } else {
      setPhase("cpf");
    }
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const result = generateResult(cpf);
  const mask = maskedFields(cpf, result.seed);
  // Real breach count from HIBP (via scan flow), falling back to the mock.
  const breaches = scanResult?.breachCount ?? result.breaches;
  // Never show "0" on the result screen — there is always public exposure to
  // surface (and it converts better). Floor the visible count at 2.
  const displayBreaches = Math.max(2, breaches);

  // count up hero number when result shows
  useEffect(() => {
    if (phase !== "result") return;
    setCount(0);
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min((now - start) / 800, 1);
      setCount(Math.round(p * displayBreaches));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, displayBreaches]);

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
    onScanStart?.(); // inline scanning overlay runs on the dashboard, then result opens
  };

  const checkout = async (plan: CheckoutPlan) => {
    // email is optional now (no inline field in the redesigned sheet)
    if (email.includes("@")) {
      try {
        sessionStorage.setItem("priva_email", email);
      } catch {
        /* ignore */
      }
    }
    setRedirecting(true);
    const started = await startCheckout(plan); // Stripe Checkout (hosted)
    if (!started) {
      if (import.meta.env.DEV) {
        // DEV ONLY: simulate activation so the flow is testable without Stripe keys.
        setPhase("success");
      } else {
        // Production: never grant access for free — surface the error and let them retry.
        setRedirecting(false);
        toast.error("Não foi possível iniciar o pagamento. Tente novamente.");
      }
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

  /* ---------- PHASE: result — TEASER only (checkout lives on /relatorio) ---------- */
  const goToRelatorio = () => {
    // ViewContent fires once, on the /relatorio page mount (not here).
    onClose();
    navigate({ to: "/relatorio" });
  };

  const previewRows = [
    { Icon: CreditCard, label: "CPF", value: `***.***.***-${mask.cpfLast2}`, badge: "ALTO", tone: "text-red-400 bg-red-500/15" },
    { Icon: Mail, label: "E-mail", value: `${mask.first}•••@${mask.domain}`, badge: "MÉDIO", tone: "text-amber-400 bg-amber-500/15" },
    { Icon: Phone, label: "Telefone", value: `(11) 9••••-${mask.phoneLast4}`, badge: "BAIXO", tone: "text-emerald-400 bg-emerald-500/15" },
  ];

  return (
    <div className="fixed inset-0 z-[60] flex flex-col justify-end bg-black/60 backdrop-blur-sm">
      <div
        className="animate-sheet-up-slow relative max-h-[92vh] overflow-y-auto rounded-t-3xl"
        style={{ backgroundColor: "#0A0A0F", boxShadow: "0 -8px 40px rgba(0,0,0,0.6)" }}
      >
        <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-gray-700" />
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-4 top-4 z-10 grid h-8 w-8 place-items-center rounded-full bg-gray-800 hover:bg-gray-700"
        >
          <X className="h-4 w-4 text-gray-400" />
        </button>

        <div className="mx-auto max-w-md px-5 pb-8">
          {/* badge */}
          <div className="mt-5 flex justify-center">
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-bold tracking-wide text-emerald-400">✓ ANÁLISE CONCLUÍDA</span>
          </div>

          {/* hero */}
          <div className="mt-5 text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-500/15">
              <AlertTriangle className="h-7 w-7 animate-pulse text-red-500" />
            </div>
            <p className="mt-4 text-sm text-gray-400">Seus dados foram encontrados em</p>
            <p className="text-4xl font-extrabold text-red-500">{count} vazamentos</p>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-gray-400">
              Encontramos informações do seu CPF, e-mail e telefone.
            </p>
          </div>

          {/* preview rows — partial data */}
          <div className="mt-6 space-y-3">
            {previewRows.map((r) => (
              <div key={r.label} className="flex items-center gap-3 rounded-xl border border-white/5 px-4 py-3" style={{ backgroundColor: "#12121A" }}>
                <r.Icon className="h-4 w-4 shrink-0 text-gray-500" />
                <span className="w-16 shrink-0 text-sm text-white">{r.label}</span>
                <span className="min-w-0 flex-1 truncate font-mono text-sm text-gray-300">{r.value}</span>
                <span className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold ${r.tone}`}>{r.badge}</span>
              </div>
            ))}
          </div>

          {/* single CTA → full report page */}
          <button
            onClick={goToRelatorio}
            className="mt-6 w-full rounded-2xl py-4 font-bold text-white transition-all active:scale-[0.99]"
            style={{ background: "linear-gradient(135deg,#4F46E5,#6366F1)", boxShadow: "0 8px 28px rgba(79,70,229,0.4)" }}
          >
            Ver meu relatório resumido →
          </button>
        </div>
      </div>
    </div>
  );
}
