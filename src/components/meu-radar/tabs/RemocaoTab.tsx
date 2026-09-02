import { useEffect, useState } from "react";
import { Clock, Send, CheckCircle2, AlertCircle, Lock, ShieldCheck, RefreshCw } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { getRemovalCase, type RemovalSource, type SourceStatus } from "@/lib/api/removal.functions";
import { getEmail } from "@/lib/identity";
import { startCheckout } from "@/lib/checkout";

/**
 * Central de remoção — every LGPD request and where each one stands.
 *
 * The tracker before this showed a single line for the whole case ("enviado"),
 * so someone with eight companies had one status and nothing to return for.
 * Per-source state is what makes this recurring: the reason to open the app in
 * week three is that Serasa answered and Netshoes has not.
 *
 * The status comes from the database, moved by our team as the letters go out
 * and answers come back. Nothing here is simulated — a case with no movement
 * shows no movement.
 */
const STATUS_UI: Record<
  SourceStatus,
  { label: string; color: string; bg: string; Icon: typeof Clock }
> = {
  pending: {
    label: "Na fila",
    color: "#64748B",
    bg: "rgba(100,116,139,0.12)",
    Icon: Clock,
  },
  sent: {
    label: "Enviada",
    color: "#4F46E5",
    bg: "rgba(79,70,229,0.12)",
    Icon: Send,
  },
  waiting: {
    label: "Aguardando empresa",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.12)",
    Icon: Clock,
  },
  resolved: {
    label: "Concluída",
    color: "#0FA968",
    bg: "rgba(15,169,104,0.12)",
    Icon: CheckCircle2,
  },
  refused: {
    label: "Recusada",
    color: "#DC2626",
    bg: "rgba(220,38,38,0.12)",
    Icon: AlertCircle,
  },
};

export function RemocaoTab() {
  const { isPremium } = useApp();
  const [sources, setSources] = useState<RemovalSource[] | null>(null);
  const [caseId, setCaseId] = useState("");
  const [loading, setLoading] = useState(false);

  const load = () => {
    const userId = typeof window !== "undefined" ? localStorage.getItem("priva_user_id") : null;
    const email = getEmail();
    if (!userId && !email) {
      setSources([]);
      return;
    }
    setLoading(true);
    getRemovalCase({ data: { userId, email: email || null } })
      .then((r) => {
        setSources(r.sources);
        setCaseId(r.caseId ?? "");
      })
      .catch(() => setSources([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  if (!isPremium) {
    return (
      <div className="space-y-4 px-5 py-5">
        <div className="rounded-2xl border border-border bg-card p-5">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-[var(--color-navy)]/10">
            <Lock className="h-5 w-5 text-[var(--color-navy)]" />
          </span>
          <p className="mt-3 text-[16px] font-bold text-foreground">Remoção de dados</p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
            A LGPD te dá o direito de exigir que empresas apaguem seus dados. Nossa equipe redige e
            envia a solicitação formal, acompanha o prazo de 15 dias úteis e cobra quem não
            responde.
          </p>
          <ul className="mt-3 space-y-1.5">
            {[
              "Carta LGPD enviada em seu nome",
              "Uma solicitação por empresa, com status próprio",
              "Acompanhamento até a resposta",
            ].map((f) => (
              <li key={f} className="flex gap-2 text-[13px] text-foreground">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-navy)]" />
                {f}
              </li>
            ))}
          </ul>
          <button
            onClick={() => {
              void startCheckout("protecao_total");
            }}
            className="mt-4 w-full rounded-xl py-3 text-[14px] font-bold text-white transition active:scale-[0.99]"
            style={{ background: "linear-gradient(135deg,#4F46E5,#6366F1)" }}
          >
            Ativar remoção · R$ 24,90/mês
          </button>
        </div>
      </div>
    );
  }

  if (sources === null) {
    return <p className="px-5 py-10 text-center text-[13px] text-muted-foreground">Carregando…</p>;
  }

  if (sources.length === 0) {
    return (
      <div className="px-5 py-10 text-center">
        <p className="text-[14px] font-semibold text-foreground">Nenhuma solicitação ainda</p>
        <p className="mx-auto mt-1.5 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
          Em Contas e no seu relatório você pode pedir a remoção dos seus dados em cada empresa.
          Elas aparecem aqui com o andamento.
        </p>
      </div>
    );
  }

  const by = (s: SourceStatus) => sources.filter((x) => x.status === s).length;
  const done = by("resolved");
  const waiting = by("waiting") + by("sent");
  const queued = by("pending");

  return (
    <div className="space-y-4 px-5 py-4">
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <p className="text-[14.5px] font-bold text-foreground">
            {sources.length} {sources.length === 1 ? "solicitação" : "solicitações"}
          </p>
          <button
            onClick={load}
            disabled={loading}
            aria-label="Atualizar"
            className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          {[
            { n: done, label: "concluídas", color: "#0FA968" },
            { n: waiting, label: "em andamento", color: "#F59E0B" },
            { n: queued, label: "na fila", color: "#64748B" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-secondary/40 py-2.5">
              <p className="text-[20px] font-extrabold" style={{ color: s.color }}>
                {s.n}
              </p>
              <p className="text-[11px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
        {caseId && (
          <p className="mt-3 text-center text-[11px] text-muted-foreground">Caso {caseId}</p>
        )}
      </div>

      <div className="space-y-2">
        {sources.map((s) => {
          const ui = STATUS_UI[s.status] ?? STATUS_UI.pending;
          return (
            <div
              key={s.source}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5"
            >
              <span
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
                style={{ backgroundColor: ui.bg }}
              >
                <ui.Icon className="h-4 w-4" style={{ color: ui.color }} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14px] font-semibold text-foreground">
                  {s.source}
                </span>
                <span className="block text-[11.5px] text-muted-foreground">
                  {new Date(s.at).toLocaleDateString("pt-BR")}
                </span>
              </span>
              <span
                className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold"
                style={{ backgroundColor: ui.bg, color: ui.color }}
              >
                {ui.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* The legal clock, stated plainly — it is the reason to come back. */}
      <p className="text-[11.5px] leading-relaxed text-muted-foreground">
        Pela LGPD, a empresa tem até 15 dias úteis para responder. Sem resposta, reenviamos e
        registramos a recusa — o que serve de prova em uma reclamação na ANPD.
      </p>
    </div>
  );
}
