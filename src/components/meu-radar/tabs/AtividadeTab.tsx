import { useMemo, useState } from "react";
import { Activity, ShieldCheck, AlertTriangle, Globe, ScanLine } from "lucide-react";
import { AppHeader } from "../Header";
import { useApp } from "@/contexts/AppContext";
import { displayName, type Breach } from "@/lib/breaches";

/**
 * Activity timeline built entirely from signals we already collect — no new
 * tables. Events come from the persisted scan result (HIBP breaches), the
 * public-exposure lookups (SerpAPI/GitHub) and the scan itself. Pix is a real
 * filter but has no source yet, so it shows an empty state until that phase.
 */
type Category = "identidade" | "pix" | "vazamentos" | "web";

type Event = {
  ts: number; // 0 = undated (shown as "recente")
  category: Category;
  title: string;
  detail: string;
  tone: "info" | "warn" | "danger";
};

const FILTERS: { id: Category | "tudo"; label: string }[] = [
  { id: "tudo", label: "Tudo" },
  { id: "identidade", label: "Identidade" },
  { id: "pix", label: "Pix" },
  { id: "vazamentos", label: "Vazamentos" },
  { id: "web", label: "Web" },
];

const CAT_ICON: Record<Category, typeof Activity> = {
  identidade: ShieldCheck,
  pix: Activity,
  vazamentos: AlertTriangle,
  web: Globe,
};

const TONE: Record<Event["tone"], { dot: string; iconBg: string; icon: string }> = {
  info: { dot: "#4F46E5", iconBg: "rgba(99,102,241,0.12)", icon: "#4F46E5" },
  warn: { dot: "#D97706", iconBg: "rgba(217,119,6,0.12)", icon: "#D97706" },
  danger: { dot: "#DC2626", iconBg: "rgba(220,38,38,0.12)", icon: "#DC2626" },
};

const bts = (b: Breach) => Date.parse(b.BreachDate || b.AddedDate || "") || 0;
const monthYear = (ts: number) =>
  ts
    ? new Date(ts).toLocaleDateString("pt-BR", { month: "short", year: "numeric" }).replace(".", "")
    : "Recente";

export function AtividadeTab() {
  const { scanResult, exposure, hasChecked, openScan } = useApp();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("tudo");

  const events = useMemo<Event[]>(() => {
    const out: Event[] = [];

    // The verification itself
    if (hasChecked) {
      out.push({
        ts: 0,
        category: "identidade",
        title: "Verificação de identidade realizada",
        detail:
          typeof scanResult?.breachCount === "number"
            ? `${scanResult.breachCount} ${scanResult.breachCount === 1 ? "exposição encontrada" : "exposições encontradas"}`
            : "Seus dados foram analisados",
        tone: "info",
      });
    }

    // One event per known breach
    const breaches = (scanResult?.hibp?.breaches ?? []) as Breach[];
    for (const b of breaches) {
      out.push({
        ts: bts(b),
        category: "vazamentos",
        title: `Vazamento: ${displayName(b)}`,
        detail: `${b.DataClasses?.length ?? 0} tipos de dados expostos`,
        tone: "danger",
      });
    }

    // Public exposure signals
    const web: [string, number | undefined][] = [
      ["CPF em fontes públicas", exposure?.cpf?.count],
      ["Telefone em fontes públicas", exposure?.phone?.count],
      ["E-mail em repositórios públicos", exposure?.github?.count],
    ];
    for (const [title, count] of web) {
      if (count && count > 0) {
        out.push({
          ts: 0,
          category: "web",
          title,
          detail: `${count} ${count === 1 ? "ocorrência" : "ocorrências"}`,
          tone: "warn",
        });
      }
    }

    return out.sort((a, b) => b.ts - a.ts);
  }, [scanResult, exposure, hasChecked]);

  const shown = filter === "tudo" ? events : events.filter((e) => e.category === filter);

  return (
    <>
      <AppHeader title="Atividade" showBell />

      {/* Segmented control — same toolbar language as Proteção. */}
      <div className="mx-5 mt-4 flex gap-1 rounded-full border border-border bg-secondary/40 p-1">
        {FILTERS.map((f) => {
          const isActive = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`flex-1 rounded-full px-0.5 py-1.5 text-[12px] font-medium transition ${
                isActive ? "text-white" : "text-muted-foreground"
              }`}
              style={isActive ? { backgroundColor: "#4F46E5" } : undefined}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      {shown.length === 0 ? (
        <div className="flex flex-col items-center px-8 py-16 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary">
            <Activity className="h-6 w-6 text-muted-foreground" />
          </span>
          <p className="mt-4 text-[15px] font-semibold text-foreground">
            {events.length === 0 ? "Nenhuma atividade ainda" : "Nada nesta categoria"}
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {events.length === 0
              ? "Faça sua primeira verificação para começar seu histórico."
              : filter === "pix"
                ? "Verificações de Pix aparecerão aqui em breve."
                : "Tente outro filtro."}
          </p>
          {events.length === 0 && (
            <button
              onClick={openScan}
              className="mt-6 flex items-center gap-2 rounded-2xl px-5 py-3 text-[14px] font-bold text-white"
              style={{ background: "linear-gradient(135deg,#4F46E5,#6366F1)" }}
            >
              <ScanLine className="h-4 w-4" /> Escanear meus dados
            </button>
          )}
        </div>
      ) : (
        <div className="relative px-5 pb-6 pt-5">
          <span className="absolute bottom-6 left-[26px] top-7 w-px bg-border" />
          {shown.map((e, i) => {
            const Icon = CAT_ICON[e.category];
            const t = TONE[e.tone];
            return (
              <div key={i} className="relative mb-3 flex gap-3 pl-0">
                <span
                  className="z-10 grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full border-4 border-background"
                  style={{ backgroundColor: t.iconBg }}
                >
                  <Icon className="h-4 w-4" strokeWidth={2} style={{ color: t.icon }} />
                </span>
                <div className="min-w-0 flex-1 rounded-2xl border border-border/60 bg-card px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13.5px] font-bold text-foreground">{e.title}</p>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {monthYear(e.ts)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">{e.detail}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
