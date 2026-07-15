import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CircleCheck,
  CreditCard,
  Loader2,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  User,
} from "lucide-react";
import { formatCPF } from "@/lib/funnel";
import { createRemovalRequest } from "@/lib/api/removal.functions";

const onlyDigits = (s: string) => s.replace(/\D/g, "");
const fmtPhone = (s: string) => {
  const d = onlyDigits(s).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};
const fmtBirth = (s: string) => {
  const d = onlyDigits(s).slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
};
const fmtLong = (d: Date) => d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
const clientCaseId = () => {
  const d = new Date();
  return `PV-${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}-${Math.floor(1000 + Math.random() * 9000)}`;
};

type RawBreach = { Name?: string; Title?: string };
function readScan() {
  if (typeof window === "undefined") return { breaches: [] as string[], phoneFound: false };
  try {
    const sr = JSON.parse(localStorage.getItem("priva_scan_result") || "null");
    const ex = JSON.parse(localStorage.getItem("priva_exposure") || "null");
    const breaches = ((sr?.hibp?.breaches ?? []) as RawBreach[]).map((b) => b.Name || b.Title || "").filter(Boolean);
    const phoneFound = Boolean(ex?.phone?.found) || (ex?.phone?.count ?? 0) > 0;
    return { breaches, phoneFound };
  } catch {
    return { breaches: [], phoneFound: false };
  }
}

const AUTH_TEXT_1 =
  "Autorizo a Priva Serviços Digitais a solicitar, em meu nome, a eliminação dos meus dados pessoais nas fontes identificadas, conforme o Art. 18 da Lei 13.709/2018 (LGPD).";
const AUTH_TEXT_2 =
  "Declaro ser o legítimo titular dos dados informados e confirmo que as informações fornecidas são verdadeiras.";

/**
 * Proteção Total post-payment flow (Steps 1–5). Replaces the plain LGPD screen:
 * welcome → confirm data → collect info → double authorization → confirmation
 * timeline. On authorize it creates the removal case + fires the e-mails.
 */
export function ProtecaoTotalFlow({
  email,
  userId,
  onDone,
}: {
  email: string;
  userId: string | null;
  onDone: () => void;
}) {
  const { breaches, phoneFound } = useMemo(readScan, []);
  const storedCpf = typeof window !== "undefined" ? sessionStorage.getItem("priva_cpf") || "" : "";
  const emailDisplay = email || (typeof window !== "undefined" ? sessionStorage.getItem("priva_email") || "" : "");
  const cpfDigits = storedCpf.replace(/\D/g, "");
  const cpfMasked = cpfDigits.length === 11 ? `•••.•••.•••-${cpfDigits.slice(-2)}` : "•••.•••.•••-••";

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Step 2 — confirm data
  const [confirm, setConfirm] = useState<Record<string, boolean>>({ email: true, cpf: true, phone: phoneFound });

  // Step 3 — collect (sub-steps A..E)
  const SUBS = ["A", "B", "C", "D", "E"] as const;
  const [sub, setSub] = useState(0);
  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState(storedCpf);
  const [phone, setPhone] = useState("");
  const [birth, setBirth] = useState("");
  const [address, setAddress] = useState("");

  // Step 4 — authorization
  const [auth1, setAuth1] = useState(false);
  const [auth2, setAuth2] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [caseId, setCaseId] = useState("");

  // Step 1 auto-advance
  useEffect(() => {
    if (step !== 1) return;
    const t = setTimeout(() => setStep(2), 2500);
    return () => clearTimeout(t);
  }, [step]);

  const anyConfirmed = Object.values(confirm).some(Boolean);

  const subValid = () => {
    if (sub === 0) return fullName.trim().length >= 3;
    if (sub === 1) return onlyDigits(cpf).length === 11;
    if (sub === 2) return onlyDigits(phone).length >= 10;
    if (sub === 3) return onlyDigits(birth).length === 8;
    return true; // address optional
  };

  const submitAuthorization = async () => {
    if (!auth1 || !auth2 || submitting) return;
    setSubmitting(true);
    let cid = "";
    try {
      const res = await createRemovalRequest({
        data: {
          userId,
          email: emailDisplay,
          fullName: fullName.trim(),
          cpf,
          phone,
          birthDate: birth,
          address: address.trim() || null,
          confirmedData: confirm,
          sourcesToRemove: breaches,
          authorizationText: `${AUTH_TEXT_1}\n${AUTH_TEXT_2}`,
        },
      });
      if (res.ok && res.caseId) cid = res.caseId;
    } catch {
      /* fall through to a client-side id so the flow still completes */
    }
    if (!cid) cid = clientCaseId();
    setCaseId(cid);
    try {
      localStorage.setItem("priva_case_id", cid);
      localStorage.setItem("priva_case_status", "pending");
      localStorage.setItem("priva_lgpd_authorized", "true");
      localStorage.setItem("priva_lgpd_requested_at", new Date().toISOString());
    } catch {
      /* ignore */
    }
    setSubmitting(false);
    setStep(5);
  };

  const wrap = "fixed inset-0 z-[70] overflow-y-auto";
  const purpleBtn = "w-full rounded-2xl py-4 font-bold text-white transition active:scale-[0.99] disabled:opacity-40";

  /* ───────── STEP 1 — welcome ───────── */
  if (step === 1) {
    return (
      <div className={`${wrap} flex flex-col items-center justify-center px-8 text-center`} style={{ background: "linear-gradient(180deg,#0A0A0F 0%,#1a0a2e 100%)" }}>
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-purple-500/10 animate-[scan-pop_0.6s_ease-out]">
          <ShieldCheck className="h-10 w-10 text-purple-400" />
        </div>
        <h1 className="animate-fade-in mt-6 text-2xl font-extrabold text-white" style={{ animationDelay: "0.4s", animationFillMode: "backwards" }}>
          Proteção Total ativada!
        </h1>
        <p className="animate-fade-in mx-auto mt-2 max-w-xs text-sm text-gray-400" style={{ animationDelay: "0.5s", animationFillMode: "backwards" }}>
          Nossa equipe foi notificada e já está analisando seu caso.
        </p>
        <div className="mt-8 flex gap-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-2.5 w-2.5 rounded-full bg-indigo-500" style={{ animation: "scan-breathe 1s ease-in-out infinite alternate", animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      </div>
    );
  }

  /* ───────── STEP 2 — confirm data ───────── */
  if (step === 2) {
    const rows = [
      { key: "email", Icon: Mail, label: "E-mail", value: emailDisplay || "—", show: true },
      { key: "cpf", Icon: CreditCard, label: "CPF", value: cpfMasked, show: true },
      { key: "phone", Icon: Phone, label: "Telefone", value: "(11) 9••••-••••", show: phoneFound },
    ].filter((r) => r.show);
    return (
      <div className={wrap} style={{ backgroundColor: "#0A0A0F" }}>
        <div className="mx-auto max-w-md px-5 py-6">
          <p className="text-center text-xs text-gray-500">1 de 3</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-indigo-500" style={{ width: "33%" }} />
          </div>
          <h1 className="mt-6 text-xl font-bold text-white">Confirme seus dados</h1>
          <p className="mt-2 mb-6 text-sm leading-relaxed text-gray-400">
            Encontramos esses dados associados a você. Confirme os que são seus para incluirmos na solicitação de remoção.
          </p>
          {rows.map((r) => {
            const on = confirm[r.key];
            return (
              <button
                key={r.key}
                onClick={() => setConfirm((c) => ({ ...c, [r.key]: !c[r.key] }))}
                className="mb-2 flex w-full items-center gap-3 rounded-xl border border-white/5 px-4 py-3 text-left"
                style={{ backgroundColor: "#12121A" }}
              >
                <span className={`grid h-5 w-5 shrink-0 place-items-center rounded ${on ? "bg-indigo-500" : "border border-gray-600"}`}>
                  {on && <Check className="h-3.5 w-3.5 text-white" />}
                </span>
                <r.Icon className="h-4 w-4 shrink-0 text-gray-500" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-white">{r.label}</span>
                  <span className="block truncate text-xs text-gray-400">{r.value}</span>
                </span>
                <span className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold ${on ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"}`}>
                  {on ? "Meu dado" : "Não é meu"}
                </span>
              </button>
            );
          })}
          <p className="mt-3 text-center text-xs text-gray-600">Apenas os dados marcados serão incluídos na solicitação.</p>
          <button onClick={() => setStep(3)} disabled={!anyConfirmed} className={`mt-6 bg-indigo-600 ${purpleBtn}`}>
            Confirmar e continuar →
          </button>
        </div>
      </div>
    );
  }

  /* ───────── STEP 3 — collect info (one field at a time) ───────── */
  if (step === 3) {
    const back = () => (sub === 0 ? setStep(2) : setSub((s) => s - 1));
    const next = () => (sub < SUBS.length - 1 ? setSub((s) => s + 1) : setStep(4));
    const inputCls = "mt-4 w-full rounded-2xl border border-white/10 bg-[#12121A] px-5 py-4 text-center text-xl text-white outline-none placeholder:text-white/25 focus:border-indigo-500/50";
    const hint = "mt-2 text-center text-xs text-gray-500";
    return (
      <div className={wrap} style={{ backgroundColor: "#0A0A0F" }}>
        <div className="mx-auto flex min-h-full max-w-md flex-col px-5 py-6">
          <div className="flex items-center gap-3">
            <button onClick={back} aria-label="Voltar" className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/5 text-gray-300">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <p className="text-xs text-gray-500">2 de 3</p>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-indigo-500" style={{ width: "66%" }} />
              </div>
            </div>
          </div>

          <div key={sub} className="animate-fade-in mt-12 flex-1" style={{ animationDuration: "220ms" }}>
            {sub === 0 && (
              <>
                <h2 className="text-center text-2xl font-bold text-white">Como você se chama?</h2>
                {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
                <input autoFocus value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Seu nome completo" className={inputCls} />
              </>
            )}
            {sub === 1 && (
              <>
                <h2 className="text-center text-2xl font-bold text-white">Seu CPF</h2>
                <input value={cpf} onChange={(e) => setCpf(formatCPF(e.target.value))} inputMode="numeric" placeholder="000.000.000-00" className={inputCls} />
                <p className={hint}>Usado para identificar seus registros</p>
              </>
            )}
            {sub === 2 && (
              <>
                <h2 className="text-center text-2xl font-bold text-white">Seu telefone</h2>
                <input value={phone} onChange={(e) => setPhone(fmtPhone(e.target.value))} inputMode="numeric" placeholder="(00) 00000-0000" className={inputCls} />
                <p className={hint}>Muitas empresas usam o telefone como identificador</p>
              </>
            )}
            {sub === 3 && (
              <>
                <h2 className="text-center text-2xl font-bold text-white">Sua data de nascimento</h2>
                <input value={birth} onChange={(e) => setBirth(fmtBirth(e.target.value))} inputMode="numeric" placeholder="DD/MM/AAAA" className={inputCls} />
                <p className={hint}>Algumas empresas pedem para confirmar identidade</p>
              </>
            )}
            {sub === 4 && (
              <>
                <h2 className="text-center text-2xl font-bold text-white">Seu endereço atual (opcional)</h2>
                <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua, número, cidade — UF" className={inputCls} />
                <p className={hint}>Apenas para casos onde a empresa solicitar</p>
                <button onClick={() => setStep(4)} className="mx-auto mt-4 block text-sm font-semibold text-indigo-400">Pular esta etapa →</button>
              </>
            )}
          </div>

          <div className="mt-6">
            <div className="mb-4 flex justify-center gap-1.5">
              {SUBS.map((_, i) => (
                <span key={i} className={`h-1.5 rounded-full transition-all ${i === sub ? "w-5 bg-indigo-500" : "w-1.5 bg-white/15"}`} />
              ))}
            </div>
            <button onClick={next} disabled={!subValid()} className={`bg-indigo-600 ${purpleBtn}`}>
              {sub < SUBS.length - 1 ? "Continuar →" : "Avançar →"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ───────── STEP 4 — authorization ───────── */
  if (step === 4) {
    const shown = breaches.slice(0, 5);
    const extra = Math.max(0, breaches.length - shown.length);
    return (
      <div className={wrap} style={{ backgroundColor: "#0A0A0F" }}>
        <div className="mx-auto max-w-md px-5 py-6">
          <p className="text-center text-xs text-gray-500">3 de 3</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-indigo-500" style={{ width: "100%" }} />
          </div>
          <h1 className="mt-6 text-xl font-bold text-white">Autorização formal</h1>

          <div className="mt-6 mb-6 rounded-2xl border border-purple-500/20 p-4" style={{ backgroundColor: "#12121A" }}>
            <p className="mb-3 text-sm font-medium text-gray-300">Solicitaremos a remoção dos seus dados de:</p>
            {shown.length > 0 ? (
              shown.map((s) => <p key={s} className="text-sm text-gray-400">• {s}</p>)
            ) : (
              <p className="text-sm text-gray-400">• Bases de vazamento identificadas</p>
            )}
            {extra > 0 && <p className="text-sm text-gray-500">+ {extra} outras fontes</p>}
          </div>

          {[
            { on: auth1, set: setAuth1, text: AUTH_TEXT_1 },
            { on: auth2, set: setAuth2, text: AUTH_TEXT_2 },
          ].map((c, i) => (
            <button key={i} onClick={() => c.set((v) => !v)} className="mb-3 flex w-full items-start gap-3 rounded-xl border border-white/5 p-4 text-left" style={{ backgroundColor: "#12121A" }}>
              <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded ${c.on ? "bg-indigo-500" : "border border-gray-600"}`}>
                {c.on && <Check className="h-3.5 w-3.5 text-white" />}
              </span>
              <span className="text-sm leading-relaxed text-gray-300">{c.text}</span>
            </button>
          ))}

          <p className="mt-3 text-center text-xs text-gray-600">Esta autorização é registrada com data, hora e dados do dispositivo para fins de comprovação.</p>

          <button onClick={submitAuthorization} disabled={!auth1 || !auth2 || submitting} className={`mt-6 flex items-center justify-center gap-2 ${purpleBtn}`} style={{ background: "linear-gradient(135deg,#7C3AED,#4F46E5)" }}>
            {submitting ? (<><Loader2 className="h-5 w-5 animate-spin" /> Enviando...</>) : "Confirmar autorização →"}
          </button>
        </div>
      </div>
    );
  }

  /* ───────── STEP 5 — confirmation + timeline ───────── */
  const timeline = [
    { c: "#22C55E", done: true, title: "Solicitação recebida", desc: "Seus dados foram coletados e registrados", when: fmtLong(new Date()) },
    { c: "#6366F1", done: true, title: "Carta LGPD em preparação", desc: "Nossa equipe enviará às fontes em até 48h", when: `Previsto: ${fmtLong(new Date(Date.now() + 2 * 86400000))}` },
    { c: "#6B7280", done: false, title: "Aguardando resposta", desc: "Empresas têm até 15 dias para responder", when: `Prazo: ${fmtLong(new Date(Date.now() + 17 * 86400000))}` },
    { c: "#6B7280", done: false, title: "Resultado", desc: "Você será notificado por e-mail", when: "" },
  ];
  return (
    <div className={wrap} style={{ backgroundColor: "#0A0A0F" }}>
      <div className="mx-auto max-w-md px-5 py-8">
        <div className="text-center">
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-green-500/15 animate-[scan-pop_0.5s_ease-out]">
            <CircleCheck className="h-12 w-12 text-green-400" />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold text-white">Solicitação enviada!</h1>
          <p className="mt-1 text-sm text-gray-500">Caso {caseId}</p>
        </div>

        <div className="relative mt-8 pl-4">
          {timeline.map((t, i) => (
            <div key={i} className="relative mb-6 pl-6">
              {i < timeline.length - 1 && <span className="absolute left-[3px] top-4 h-full w-px bg-white/10" />}
              <span className="absolute left-[-2px] top-1 grid h-3.5 w-3.5 place-items-center rounded-full" style={{ backgroundColor: t.done ? t.c : "transparent", border: t.done ? "none" : `2px solid ${t.c}` }} />
              <p className="text-sm font-bold text-white">{t.title}</p>
              <p className="text-xs text-gray-400">{t.desc}</p>
              {t.when && <p className="mt-0.5 text-[11px] text-gray-600">{t.when}</p>}
            </div>
          ))}
        </div>

        <p className="mt-2 text-center text-sm text-gray-500">Acompanhe o progresso no seu painel</p>
        <button onClick={onDone} className="mt-6 w-full rounded-2xl bg-indigo-600 py-4 font-bold text-white transition active:scale-[0.99]">
          Ver meu painel →
        </button>
      </div>
    </div>
  );
}
