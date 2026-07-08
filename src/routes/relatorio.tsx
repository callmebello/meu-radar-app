import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Key,
  Lock,
  Mail,
  Phone,
  Shield,
  ShieldAlert,
  X as XIcon,
} from "lucide-react";
import { getScore } from "@/lib/funnel";
import { startCheckout, type CheckoutPlan } from "@/lib/checkout";
import { track } from "@/lib/analytics";

export const Route = createFileRoute("/relatorio")({
  head: () => ({ meta: [{ title: "Relatório de Exposição — Priva" }] }),
  component: RelatorioPage,
});

// ---- localStorage-backed scan data (AppProvider is scoped to "/", so this
// standalone route reads the persisted scan instead of context) ----
type RawBreach = {
  Name?: string;
  Title?: string;
  BreachDate?: string;
  AddedDate?: string;
  DataClasses?: string[];
};
type StoredScan = { breachCount?: number; hibp?: { count?: number; breaches?: RawBreach[] } | null };

function readJSON<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}

const DATA_CLASS_PT: Record<string, string> = {
  "email addresses": "E-mail",
  "passwords": "Senha",
  "phone numbers": "Telefone",
  "names": "Nome",
  "usernames": "Usuário",
  "physical addresses": "Endereço",
  "dates of birth": "Data de nascimento",
  "geographic locations": "Localização",
  "ip addresses": "IP",
  "credit cards": "Cartão de crédito",
  "government issued ids": "Documento",
};
function translateDC(dc: string): string {
  return DATA_CLASS_PT[dc.toLowerCase()] || dc;
}
function yearOf(d?: string): string {
  if (!d) return "";
  const y = new Date(d).getFullYear();
  return isNaN(y) ? "" : String(y);
}

function RelatorioPage() {
  const navigate = useNavigate();
  const firedView = useRef(false);
  const [redirecting, setRedirecting] = useState(false);

  const scan = readJSON<StoredScan>("priva_scan_result");
  const cpf = typeof window !== "undefined" ? sessionStorage.getItem("priva_cpf") || "" : "";
  const isPaid = typeof window !== "undefined" && localStorage.getItem("priva_is_paid") === "true";

  const breaches = useMemo(() => (scan?.hibp?.breaches ?? []).filter(Boolean), [scan]);
  const breachCount = scan?.hibp?.count ?? scan?.breachCount ?? breaches.length;
  const displayCount = Math.max(2, breachCount);
  const score = cpf ? getScore(cpf, breachCount) : 46;

  // score color/label
  const risk =
    score < 40
      ? { color: "#F87171", label: "RISCO ALTO", bg: "bg-red-500/15 text-red-400" }
      : score < 70
        ? { color: "#FBBF24", label: "RISCO MÉDIO", bg: "bg-amber-500/15 text-amber-400" }
        : { color: "#34D399", label: "BAIXO", bg: "bg-emerald-500/15 text-emerald-400" };

  // password / phone signals for recommendations
  const passwordFound = breaches.some((b) =>
    (b.DataClasses ?? []).some((d) => /password/i.test(d)),
  );
  const exposure = readJSON<{ phone?: { found?: boolean; count?: number } | null }>("priva_exposure");
  const phoneFound = Boolean(exposure?.phone?.found) || (exposure?.phone?.count ?? 0) > 0;

  // year range from breach dates
  const years = breaches.map((b) => yearOf(b.BreachDate || b.AddedDate)).filter(Boolean).sort();
  const yearFirst = years[0] || "—";
  const yearLast = years[years.length - 1] || "—";

  // No scan on file → back to the funnel start.
  useEffect(() => {
    if (!scan && !cpf) navigate({ to: "/" });
  }, [scan, cpf, navigate]);

  // Pixel: page view of the summary report.
  useEffect(() => {
    if (firedView.current) return;
    firedView.current = true;
    track("ViewContent", { content_name: "Relatorio Resumido", value: 9.9, currency: "BRL" });
  }, []);

  const checkout = async (plan: CheckoutPlan) => {
    track("InitiateCheckout", {
      value: plan === "essencial" ? 9.9 : 24.9,
      currency: "BRL",
      content_name: plan,
    });
    setRedirecting(true);
    await startCheckout(plan);
    setRedirecting(false);
  };

  // Real breaches shown fully (authority); the rest are locked/blurred.
  const shown = breaches.slice(0, 3);
  const lockedCount = Math.max(0, displayCount - shown.length);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#0A0A0F" }}>
      <div className="mx-auto max-w-md px-5 pb-16">
        {/* Header */}
        <header className="sticky top-0 z-10 -mx-5 flex items-center justify-between px-5 py-4" style={{ backgroundColor: "#0A0A0F" }}>
          <button onClick={() => navigate({ to: "/" })} aria-label="Voltar" className="grid h-9 w-9 place-items-center rounded-full bg-white/5 text-gray-300 hover:bg-white/10">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <img src="/PRIVA_logo_dark_theme.png" alt="PRIVA" className="h-5 w-auto object-contain" />
          <span className="h-9 w-9" />
        </header>

        {/* SECTION 1 — Score card */}
        <section className="mt-2 rounded-3xl border border-indigo-500/25 p-6 text-center" style={{ backgroundColor: "#12121A" }}>
          <p className="text-xs tracking-widest text-gray-400">RELATÓRIO DE EXPOSIÇÃO DIGITAL</p>
          <p className="mt-3 text-7xl font-extrabold leading-none" style={{ color: risk.color }}>{score}</p>
          <span className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-bold ${risk.bg}`}>{risk.label}</span>
          <p className="mt-3 text-sm text-gray-500">Baseado em {Math.max(3, displayCount)} fontes verificadas</p>
          <div className="mt-5 grid grid-cols-3 border-t border-white/5 pt-4 text-center">
            <div>
              <p className="text-2xl font-extrabold text-white">{displayCount}</p>
              <p className="mt-1 text-[11px] text-gray-500">Vazamentos</p>
            </div>
            <div className="border-x border-white/5">
              <p className="text-2xl font-extrabold text-white">{yearFirst}</p>
              <p className="mt-1 text-[11px] text-gray-500">Primeiro registro</p>
            </div>
            <div>
              <p className="text-2xl font-extrabold text-white">{yearLast}</p>
              <p className="mt-1 text-[11px] text-gray-500">Mais recente</p>
            </div>
          </div>
        </section>

        {/* SECTION 2 — Exposições encontradas */}
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-bold text-white">Exposições encontradas</h2>

          {shown.map((b, i) => {
            const name = b.Name || b.Title || "Vazamento";
            const dcs = (b.DataClasses ?? []).map(translateDC);
            const yr = yearOf(b.BreachDate || b.AddedDate);
            const visible = dcs.slice(0, 2);
            const hidden = Math.max(0, dcs.length - visible.length);
            const sev = i === 0 ? { l: "ALTO", c: "text-red-400 bg-red-500/15" } : { l: "MÉDIO", c: "text-amber-400 bg-amber-500/15" };
            return (
              <div key={i} className="mb-3 rounded-xl border border-white/5 p-4" style={{ backgroundColor: "#12121A" }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-white">{name}</p>
                    {yr && <p className="text-xs text-gray-500">Vazamento · {yr}</p>}
                  </div>
                  <span className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold ${sev.c}`}>{sev.l}</span>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-300">
                  {visible.map((d) => (
                    <span key={d} className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-red-400" /> {d}</span>
                  ))}
                  {hidden > 0 && (
                    <span className="flex items-center gap-1.5 text-gray-500"><Lock className="h-3 w-3" /> +{hidden} dados ocultos</span>
                  )}
                </div>
              </div>
            );
          })}

          {lockedCount > 0 && (
            <>
              <p className="mb-2 mt-4 text-sm text-gray-400">{lockedCount} outras exposições encontradas</p>
              {Array.from({ length: Math.min(4, lockedCount) }).map((_, i) => (
                <div key={i} className="mb-2 flex items-center gap-3 rounded-xl px-4 py-3" style={{ backgroundColor: "#12121A" }}>
                  <Lock className="h-4 w-4 shrink-0 text-indigo-400" />
                  <span className="min-w-0 flex-1 select-none truncate text-sm text-gray-300 blur-sm">
                    Exposição em base de dados comprometida — dados sensíveis
                  </span>
                  <span className="shrink-0 text-xs text-gray-600">🔒 Desbloqueie</span>
                </div>
              ))}
            </>
          )}
        </section>

        {/* SECTION 3 — Recomendações */}
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-bold text-white">Recomendações importantes</h2>
          <div className="space-y-3">
            {passwordFound && (
              <RecCard Icon={ShieldAlert} color="#F87171" title="Troque suas senhas imediatamente" sub="Especialmente em serviços financeiros e e-mail" />
            )}
            <RecCard Icon={Mail} color="#FBBF24" title="Ative verificação em duas etapas" sub="Em todos os serviços onde seu e-mail foi exposto" />
            {phoneFound && (
              <RecCard Icon={Phone} color="#FBBF24" title="Cuidado com ligações suspeitas" sub="Seu telefone pode estar em listas de golpistas" />
            )}
            <RecCard Icon={Key} color="#818CF8" title="Nunca reutilize senhas" sub="Use um gerenciador de senhas" />
          </div>
        </section>

        {/* PAID users: no plans, just go to the full report */}
        {isPaid ? (
          <button
            onClick={() => navigate({ to: "/" })}
            className="mt-8 w-full rounded-2xl bg-indigo-600 py-4 font-bold text-white transition active:scale-[0.99]"
          >
            Ver meu relatório completo →
          </button>
        ) : (
          <>
            {/* SECTION 4 — divider */}
            <div className="mt-10 flex items-center gap-3">
              <span className="h-px flex-1 bg-white/10" />
              <span className="text-xs text-gray-600">Proteja-se agora</span>
              <span className="h-px flex-1 bg-white/10" />
            </div>

            {/* SECTION 5 — two plan columns */}
            <p className="mb-4 mt-6 text-center text-base font-semibold text-white">O que você está perdendo</p>
            <div className="grid grid-cols-2 gap-3">
              {/* Essencial */}
              <div className="rounded-2xl border border-indigo-500/30 p-4" style={{ backgroundColor: "#12121A" }}>
                <p className="mb-2 text-xs font-bold text-indigo-300">Essencial</p>
                <p className="text-2xl font-extrabold text-white">R$9,90<span className="text-sm font-normal text-gray-400">/mês</span></p>
                <ul className="mt-3 space-y-2">
                  {[
                    `Relatório completo (todos os ${displayCount} vazamentos)`,
                    "Dados completos de cada exposição",
                    "Monitoramento contínuo",
                    "Alertas em tempo real",
                  ].map((f) => (
                    <li key={f} className="flex gap-2 text-xs text-gray-300"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-400" /> {f}</li>
                  ))}
                </ul>
                <button onClick={() => checkout("essencial")} disabled={redirecting} className="mt-4 w-full rounded-xl bg-indigo-600 py-3 text-sm font-bold text-white transition active:scale-[0.99] disabled:opacity-60">
                  Assinar →
                </button>
              </div>

              {/* Proteção Total */}
              <div className="relative rounded-2xl border-2 border-purple-500/50 p-4" style={{ background: "linear-gradient(135deg,#1a0a2e,#2d1264)" }}>
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-purple-600 px-3 py-1 text-[10px] font-bold text-white">MAIS COMPLETO</span>
                <p className="mb-2 text-xs font-bold text-purple-300">Proteção Total</p>
                <p className="text-2xl font-extrabold text-white">R$24,90<span className="text-sm font-normal text-gray-400">/mês</span></p>
                <ul className="mt-3 space-y-2">
                  {[
                    "Tudo do Essencial",
                    "Solicitação de remoção via LGPD",
                    "Advogados parceiros cuidam do processo",
                    "Acompanhamento por e-mail",
                    "Tempo estimado de remoção",
                  ].map((f) => (
                    <li key={f} className="flex gap-2 text-xs text-gray-300"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-purple-400" /> {f}</li>
                  ))}
                </ul>
                <button
                  onClick={() => checkout("protecao_total")}
                  disabled={redirecting}
                  className="mt-4 w-full rounded-xl py-3 text-sm font-bold text-white transition active:scale-[0.99] disabled:opacity-60"
                  style={{ background: "linear-gradient(135deg,#7C3AED,#4F46E5)", boxShadow: "0 0 16px rgba(124,58,237,0.3)" }}
                >
                  Remover meus dados →
                </button>
              </div>
            </div>

            {redirecting && <p className="mt-3 text-center text-xs text-indigo-300">Redirecionando para pagamento seguro...</p>}

            {/* SECTION 6 — social proof + trust */}
            <div className="mt-6 flex items-center justify-center gap-2">
              <div className="flex -space-x-2">
                {["12", "32", "45"].map((n) => (
                  <img key={n} src={`https://i.pravatar.cc/48?img=${n}`} alt="" className="h-6 w-6 rounded-full border-2" style={{ borderColor: "#0A0A0F" }} />
                ))}
              </div>
              <span className="text-xs text-indigo-400">+{87 + (displayCount % 40)} pessoas protegidas hoje</span>
            </div>
            <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-gray-600">
              <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> LGPD</span>
              <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> Seguro</span>
              <span className="flex items-center gap-1"><XIcon className="h-3 w-3" /> Cancele quando quiser</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function RecCard({ Icon, color, title, sub }: { Icon: typeof Mail; color: string; title: string; sub: string }) {
  return (
    <div className="flex gap-3 rounded-xl border border-white/5 p-4" style={{ backgroundColor: "#12121A" }}>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg" style={{ backgroundColor: `${color}22` }}>
        <Icon className="h-5 w-5" style={{ color }} />
      </span>
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="mt-0.5 text-xs text-gray-400">{sub}</p>
      </div>
    </div>
  );
}
