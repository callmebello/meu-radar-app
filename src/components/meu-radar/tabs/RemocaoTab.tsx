import { useEffect, useMemo, useState } from "react";
import {
  Clock,
  Send,
  CheckCircle2,
  AlertCircle,
  Lock,
  ShieldCheck,
  RefreshCw,
  ChevronDown,
  KeyRound,
  Zap,
} from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import {
  getRemovalCase,
  addRemovalSource,
  type RemovalSource,
  type SourceStatus,
} from "@/lib/api/removal.functions";
import { getEmail } from "@/lib/identity";
import { startCheckout } from "@/lib/checkout";
import { displayName, logoOf, type Breach } from "@/lib/breaches";
import {
  DIFFICULTY,
  difficultyOf,
  planWaves,
  promiseLine,
  stepsFor,
  WAVE_SIZE,
  breachKey,
  type Difficulty,
} from "@/lib/removal";
import { recordAction, hasAction } from "@/lib/actions";

/**
 * Central de remoção.
 *
 * Two screens in one, and the split is the whole point:
 *
 *   PLANO   — everything we found that could be removed, ordered easiest
 *             first, cut into waves of three. This is where someone decides.
 *   ANDAMENTO — the requests already sent, with per-source status.
 *
 * The old tab only had the second half, so a subscriber with nothing sent yet
 * saw "Nenhuma solicitação ainda" and had no way to start one from here. The
 * ask lived somewhere else entirely, which is why almost nobody made it.
 *
 * Requests go out ONE AT A TIME, easiest first. See lib/removal.ts for why
 * that is not a limitation but the design.
 */
const STATUS_UI: Record<
  SourceStatus,
  { label: string; color: string; bg: string; Icon: typeof Clock }
> = {
  pending: { label: "Na fila", color: "#64748B", bg: "rgba(100,116,139,0.12)", Icon: Clock },
  sent: { label: "Enviada", color: "#4F46E5", bg: "rgba(79,70,229,0.12)", Icon: Send },
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
  refused: { label: "Recusada", color: "#DC2626", bg: "rgba(220,38,38,0.12)", Icon: AlertCircle },
};

function DifficultyPill({ d }: { d: Difficulty }) {
  const meta = DIFFICULTY[d];
  return (
    <span
      className="shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-bold"
      style={{ backgroundColor: meta.bg, color: meta.color }}
    >
      {meta.short}
    </span>
  );
}

/** One removable source, with its step-by-step folded away until asked for. */
function SourceCard({
  breach,
  difficulty,
  locked,
  requested,
  onRequest,
  onUpsell,
}: {
  breach: Breach;
  difficulty: Difficulty;
  /** True while an earlier wave is still open. */
  locked: boolean;
  requested: boolean;
  onRequest: () => void;
  onUpsell: () => void;
}) {
  const [open, setOpen] = useState(false);
  const meta = DIFFICULTY[difficulty];
  const name = displayName(breach);
  const logo = logoOf(breach);
  const steps = stepsFor(difficulty, name);

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        {logo ? (
          <img
            src={logo}
            alt=""
            className="h-9 w-9 shrink-0 rounded-lg bg-white object-contain p-1"
          />
        ) : (
          <span
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
            style={{ backgroundColor: meta.bg }}
          >
            <ShieldCheck className="h-4 w-4" style={{ color: meta.color }} />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="min-w-0 truncate text-[14.5px] font-bold text-foreground">{name}</span>
            <DifficultyPill d={difficulty} />
          </span>
          <span className="mt-0.5 block truncate text-[11.5px] text-muted-foreground">
            {requested ? "Solicitação enviada" : meta.eta}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="border-t border-border/60 px-4 pb-4 pt-3">
          <p className="text-[12.5px] leading-relaxed text-muted-foreground">{meta.expectation}</p>

          {difficulty !== "impossivel" && (
            <>
              {/* The step-by-step. Numbered and connected, because the question
                  this answers is "what happens after I click" — and an
                  unanswered version of that question is why people do not
                  click. */}
              <ol className="mt-3.5 space-y-0">
                {steps.map((s, i) => (
                  <li key={s.title} className="flex gap-3">
                    <span className="relative flex w-6 shrink-0 flex-col items-center">
                      <span
                        className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold"
                        style={{ backgroundColor: meta.bg, color: meta.color }}
                      >
                        {i + 1}
                      </span>
                      {i < steps.length - 1 && (
                        <span className="w-px flex-1 bg-border" aria-hidden />
                      )}
                    </span>
                    <span className="min-w-0 flex-1 pb-3.5">
                      <span className="block text-[13px] font-bold leading-tight text-foreground">
                        {s.title}
                      </span>
                      <span className="mt-0.5 block text-[12px] leading-snug text-muted-foreground">
                        {s.detail}
                      </span>
                    </span>
                  </li>
                ))}
              </ol>

              <p
                className="mb-3 rounded-xl px-3 py-2 text-[12px] font-semibold"
                style={{ backgroundColor: meta.bg, color: meta.color }}
              >
                {promiseLine(difficulty)}
              </p>

              {requested ? (
                <p className="flex items-center gap-1.5 text-[13px] font-bold text-[#0FA968]">
                  <CheckCircle2 className="h-4 w-4" /> Pedido registrado
                </p>
              ) : locked ? (
                <p className="text-[12.5px] leading-snug text-muted-foreground">
                  Entra na próxima leva, assim que as {WAVE_SIZE} solicitações em aberto forem
                  respondidas.
                </p>
              ) : meta.included ? (
                <button
                  onClick={onRequest}
                  className="w-full rounded-xl py-2.5 text-[13.5px] font-bold text-white transition active:scale-[0.99]"
                  style={{ background: "linear-gradient(135deg,#4F46E5,#6366F1)" }}
                >
                  Solicitar remoção
                </button>
              ) : (
                <button
                  onClick={onUpsell}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border py-2.5 text-[13.5px] font-bold transition active:scale-[0.99]"
                  style={{ borderColor: `${meta.color}55`, color: meta.color }}
                >
                  <Zap className="h-4 w-4" /> Escalar este caso
                </button>
              )}
            </>
          )}

          {difficulty === "impossivel" && (
            <p className="mt-3 flex items-start gap-2 rounded-xl bg-secondary/50 px-3 py-2.5 text-[12.5px] leading-snug text-foreground">
              <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              Troque a senha desse serviço e ative a verificação em duas etapas. É o que resolve
              aqui — e conta pontos no seu score.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function RemocaoTab() {
  const { isPremium, scanResult, openPaywall, setProtecaoPill } = useApp();
  const [sources, setSources] = useState<RemovalSource[] | null>(null);
  const [caseId, setCaseId] = useState("");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"plano" | "andamento">("plano");
  const [justAsked, setJustAsked] = useState<string[]>([]);

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

  const breaches = useMemo(
    () => ((scanResult?.hibp?.breaches ?? []) as Breach[]).filter(Boolean),
    [scanResult],
  );

  // Everything removable, easiest first, cut into waves of three.
  const waves = useMemo(() => planWaves(breaches, difficultyOf), [breaches]);
  const unremovable = useMemo(
    () => breaches.filter((b) => difficultyOf(b) === "impossivel"),
    [breaches],
  );

  const sentNames = useMemo(
    () => new Set((sources ?? []).map((s) => s.source.toLowerCase())),
    [sources],
  );
  // The ledger key is shared with Vazamentos (see lib/removal.ts): both
  // screens can mark the same leak as requested, and both must see it.
  const isRequested = (b: Breach) => {
    const k = breachKey(b);
    return (
      sentNames.has(displayName(b).toLowerCase()) ||
      justAsked.includes(k) ||
      hasAction("removal_requested", k)
    );
  };

  // The current wave is the first one with anything still unanswered. Waves
  // after it stay closed — that is the queue, made visible.
  const openWave = useMemo(() => {
    const pending = waves.find((w) => !isRequested(w.item));
    return pending?.wave ?? 1;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [waves, sentNames, justAsked]);

  const request = (b: Breach) => {
    const name = displayName(b);
    const key = breachKey(b);
    setJustAsked((p) => [...p, key]);
    // Credits the score immediately (10 points — the heaviest action there is)
    // so the reward lands on the tap, not days later when the letter goes out.
    recordAction("removal_requested", key);
    const userId = typeof window !== "undefined" ? localStorage.getItem("priva_user_id") : null;
    const email = getEmail();
    // The case is keyed by e-mail on the server. Without one there is nothing
    // to attach the request to — the local ledger already credited the score,
    // and the next load reconciles once an account exists.
    if (!email) return;
    void addRemovalSource({ data: { userId, email, source: name } })
      .then(() => load())
      .catch(() => {
        /* queued locally; the tracker reconciles on the next load */
      });
  };

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

          {/* The tiers, before the price. Someone who reads this cannot be
              surprised later — which is the cheapest refund prevention there
              is. */}
          <div className="mt-4 space-y-2">
            {(["facil", "media", "dificil"] as Difficulty[]).map((d) => {
              const m = DIFFICULTY[d];
              return (
                <div key={d} className="rounded-xl border border-border/70 px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <DifficultyPill d={d} />
                    <span className="text-[12.5px] font-bold text-foreground">{m.label}</span>
                    <span className="ml-auto shrink-0 text-[11px] text-muted-foreground">
                      {m.included ? "incluído" : "à parte"}
                    </span>
                  </div>
                  <p className="mt-1 text-[11.5px] leading-snug text-muted-foreground">
                    {m.expectation}
                  </p>
                </div>
              );
            })}
          </div>

          <button
            onClick={() => {
              void startCheckout("protecao_total");
            }}
            className="mt-4 w-full rounded-xl py-3 text-[14px] font-bold text-white transition active:scale-[0.99]"
            style={{ background: "linear-gradient(135deg,#4F46E5,#6366F1)" }}
          >
            Ativar remoção · R$ 24,90/mês
          </button>
          <p className="mt-2 text-center text-[11px] leading-snug text-muted-foreground">
            Garantimos o pedido formal, o prazo acompanhado e a prova documentada. O que a empresa
            responde é decisão dela — por isso nunca prometemos o resultado.
          </p>
        </div>
      </div>
    );
  }

  if (sources === null) {
    return <p className="px-5 py-10 text-center text-[13px] text-muted-foreground">Carregando…</p>;
  }

  const by = (s: SourceStatus) => (sources ?? []).filter((x) => x.status === s).length;
  const done = by("resolved");
  const waiting = by("waiting") + by("sent");
  const queued = by("pending");

  return (
    <div className="space-y-4 px-5 py-4">
      {/* Same segmented control as Proteção and Verificar. */}
      <div className="flex gap-1 rounded-full border border-border bg-secondary/40 p-1">
        {(
          [
            ["plano", `Plano${waves.length ? ` · ${waves.length}` : ""}`],
            ["andamento", `Andamento${sources.length ? ` · ${sources.length}` : ""}`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setView(id)}
            className={`flex-1 rounded-full py-1.5 text-[13px] font-medium transition ${
              view === id ? "text-white" : "text-muted-foreground"
            }`}
            style={view === id ? { backgroundColor: "#4F46E5" } : undefined}
          >
            {label}
          </button>
        ))}
      </div>

      {view === "plano" ? (
        waves.length === 0 && unremovable.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-[14px] font-semibold text-foreground">Nada a remover ainda</p>
            <p className="mx-auto mt-1.5 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
              Rode um scan para encontrarmos onde seus dados estão. Cada empresa encontrada aparece
              aqui com o passo a passo da remoção.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-[14px] font-bold text-foreground">Uma de cada vez, na ordem</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                Pedimos em levas de {WAVE_SIZE}, começando pelas empresas que costumam responder. A
                próxima leva abre quando estas forem respondidas — assim cada prazo é cobrado de
                verdade, em vez de {waves.length} pedidos vencendo no mesmo dia.
              </p>
            </div>

            {[...new Set(waves.map((w) => w.wave))].map((n) => {
              const items = waves.filter((w) => w.wave === n);
              const isOpen = n === openWave;
              return (
                <div key={n} className="space-y-2">
                  <div className="flex items-center gap-2 pt-1">
                    <p className="text-[12px] font-bold uppercase tracking-wide text-muted-foreground">
                      {n === 1 ? "Agora" : `Leva ${n}`}
                    </p>
                    {!isOpen && (
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Lock className="h-3 w-3" /> na fila
                      </span>
                    )}
                  </div>
                  {items.map((w) => (
                    <SourceCard
                      key={displayName(w.item)}
                      breach={w.item}
                      difficulty={w.difficulty}
                      locked={!isOpen}
                      requested={isRequested(w.item)}
                      onRequest={() => request(w.item)}
                      onUpsell={openPaywall}
                    />
                  ))}
                </div>
              );
            })}

            {/* One row, not one per file. HIBP returns these dumps by the
                handful and they all carry the same display name, so listing
                them individually filled the screen with identical grey cards
                that say the same thing — which buries the waves above, the
                only part of this screen anyone can act on. */}
            {unremovable.length > 0 && (
              <div className="space-y-2 pt-1">
                <p className="text-[12px] font-bold uppercase tracking-wide text-muted-foreground">
                  Sem empresa para notificar
                </p>
                <div className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
                      style={{ backgroundColor: DIFFICULTY.impossivel.bg }}
                    >
                      <KeyRound
                        className="h-4 w-4"
                        style={{ color: DIFFICULTY.impossivel.color }}
                      />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14.5px] font-bold text-foreground">
                        {unremovable.length}{" "}
                        {unremovable.length === 1 ? "arquivo de senhas" : "arquivos de senhas"}
                      </p>
                      <p className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">
                        {unremovable.map((b) => displayName(b)).join(" · ")}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-[12.5px] leading-relaxed text-muted-foreground">
                    {DIFFICULTY.impossivel.expectation}
                  </p>
                  <button
                    onClick={() => setProtecaoPill("credenciais")}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-[13px] font-bold text-foreground transition active:scale-[0.99]"
                  >
                    <KeyRound className="h-4 w-4" /> Ir para o verificador de senhas
                  </button>
                </div>
              </div>
            )}
          </>
        )
      ) : sources.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-[14px] font-semibold text-foreground">Nenhuma solicitação ainda</p>
          <p className="mx-auto mt-1.5 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
            Abra o Plano ao lado e peça a primeira remoção. O andamento de cada empresa aparece
            aqui.
          </p>
        </div>
      ) : (
        <>
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

          {/* The moment to sell escalation is right after the easy tier has
              been seen to work — never before it. */}
          {done > 0 && (
            <div
              className="rounded-2xl border p-4"
              style={{
                borderColor: "rgba(79,70,229,0.35)",
                backgroundColor: "rgba(79,70,229,0.06)",
              }}
            >
              <p className="text-[14px] font-bold text-foreground">
                {done} {done === 1 ? "empresa apagou" : "empresas apagaram"} seus dados
              </p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                Os casos difíceis — sites que revendem dados — precisam de reclamação na ANPD e
                notificação registrada. Dá para escalar um por vez, quando você quiser.
              </p>
            </div>
          )}

          <p className="text-[11.5px] leading-relaxed text-muted-foreground">
            Pela LGPD, a empresa tem até 15 dias úteis para responder. Sem resposta, reenviamos e
            registramos a recusa — o que serve de prova em uma reclamação na ANPD.
          </p>
        </>
      )}
    </div>
  );
}
