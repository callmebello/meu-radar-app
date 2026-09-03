import { useMemo, useState } from "react";
import { ChevronDown, Check, Lock, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { rankForDisplay, displayName, logoOf, pwnCountLabel, type Breach } from "@/lib/breaches";
import { guidanceFor, leakedLabels } from "@/lib/breachActions";
import { hasAction, recordAction, undoAction, type ActionType } from "@/lib/actions";
import { startCheckout } from "@/lib/checkout";
import { ACTION_CREDIT } from "@/lib/riskScore";
import { DIFFICULTY, difficultyOf, breachKey } from "@/lib/removal";
import { ContasTab } from "./ContasTab";
import { track, gaEvent } from "@/lib/analytics";

/**
 * Vazamentos — the leaks themselves, and what to do about each one.
 *
 * This pill used to show public web results (GitHub/SerpAPI), which is not what
 * anyone means by "vazamento", while the actual breach list sat behind the
 * paywall in "Dark Web". Someone looking for their leaks found the wrong panel
 * and was then asked to pay to see data the free scan had already fetched.
 *
 * Detection is free — the person already has this from their scan. What the
 * subscription adds is CONTINUOUS monitoring: being told about the next one.
 */
const keyOf = breachKey;

/**
 * What each task is worth, in the score's own currency.
 *
 * The tasks were already here and already credited the score — the number just
 * moved somewhere else, silently, on another screen. A checkbox that pays and
 * does not say so is a checkbox nobody ticks. See riskScore.ts for why closing
 * an account is worth more than changing a password.
 */
const POINTS: Record<ActionType, number> = {
  password_changed: ACTION_CREDIT.passwordChanged,
  twofa_enabled: ACTION_CREDIT.twoFactorEnabled,
  account_closed: ACTION_CREDIT.accountClosed,
  removal_requested: ACTION_CREDIT.removalRequested,
};

function Initial({ name }: { name: string }) {
  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--color-navy)]/10 text-[15px] font-bold text-[var(--color-navy)]">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function Logo({ b }: { b: Breach }) {
  const [failed, setFailed] = useState(false);
  const src = logoOf(b);
  const name = displayName(b);
  if (!src || failed) return <Initial name={name} />;
  return (
    <img
      src={src}
      alt=""
      onError={() => setFailed(true)}
      className="h-10 w-10 shrink-0 rounded-xl bg-white object-contain p-1"
    />
  );
}

function BreachRow({
  b,
  onChange,
  onRemocao,
}: {
  b: Breach;
  onChange: () => void;
  onRemocao: () => void;
}) {
  const [open, setOpen] = useState(false);
  const name = displayName(b);
  const k = keyOf(b);
  const leaked = leakedLabels(b);
  const { tasks, advice } = useMemo(() => guidanceFor(b, name), [b, name]);
  const done = tasks.filter((t) => hasAction(t.type, k)).length;
  // Points still on the table for this leak. It is the collapsed row's whole
  // reason to be tapped — "3/3" says nothing to someone who has not opened it
  // yet, while "+19 pts" says exactly what is behind the chevron.
  const tier = DIFFICULTY[difficultyOf(b)];
  const removable = difficultyOf(b) !== "impossivel";
  const removalDone = hasAction("removal_requested", k);
  const left =
    tasks.reduce((n, t) => (hasAction(t.type, k) ? n : n + POINTS[t.type]), 0) +
    (removable && !removalDone ? POINTS.removal_requested : 0);

  const toggle = (type: ActionType) => {
    if (hasAction(type, k)) undoAction(type, k);
    else {
      recordAction(type, k);
      track("BreachActionDone");
      gaEvent("breach_action_done", { action: type });
    }
    onChange();
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
      >
        <Logo b={b} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14.5px] font-semibold text-foreground">{name}</span>
          <span className="block truncate text-[12px] text-muted-foreground">
            {leaked.length > 0 ? leaked.join(" · ") : (pwnCountLabel(b) ?? "Dados expostos")}
          </span>
        </span>
        {tasks.length > 0 && (
          <span
            className="shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-bold"
            style={{ backgroundColor: "rgba(15,169,104,0.12)", color: "#0FA968" }}
          >
            {left > 0 ? `+${left} pts` : `${done}/${tasks.length}`}
          </span>
        )}
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* grid-rows 0fr→1fr so the panel animates without a fixed height */}
      <div
        className="grid transition-all duration-300"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="border-t border-border px-4 py-3.5">
            {(tasks.length > 0 || removable) && (
              <>
                <div className="mb-2 flex items-center gap-2">
                  <p className="text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground">
                    O que fazer agora
                  </p>
                  {/* Whether there is a company on the other end, said on the
                      same row as the tasks — because the most valuable action
                      here (asking for removal) depends entirely on it. */}
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{ backgroundColor: tier.bg, color: tier.color }}
                  >
                    {tier.short}
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {tasks.map((t) => {
                    const checked = hasAction(t.type, k);
                    return (
                      <li key={t.type}>
                        <button
                          onClick={() => toggle(t.type)}
                          className="flex w-full items-center gap-2.5 rounded-xl border border-border px-3 py-2.5 text-left transition active:scale-[0.99]"
                          style={
                            checked
                              ? {
                                  borderColor: "var(--color-success)",
                                  backgroundColor: "rgba(15,169,104,0.06)",
                                }
                              : undefined
                          }
                        >
                          <span
                            className="grid h-5 w-5 shrink-0 place-items-center rounded-md border"
                            style={
                              checked
                                ? {
                                    backgroundColor: "var(--color-success)",
                                    borderColor: "var(--color-success)",
                                  }
                                : { borderColor: "var(--color-border)" }
                            }
                          >
                            {checked && <Check className="h-3 w-3 text-white" strokeWidth={3.5} />}
                          </span>
                          <span className="min-w-0 flex-1 text-[13.5px] leading-snug text-foreground">
                            {t.label}
                          </span>
                          <span
                            className="shrink-0 text-[12.5px] font-bold"
                            style={{
                              color: checked ? "#0FA968" : "var(--color-muted-foreground)",
                            }}
                          >
                            +{POINTS[t.type]}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}

            {/* Removal never gets a self-declared checkbox: it is the one
                action with a third party on the hook, so it goes to the queue
                that actually tracks it. For a data broker it is also the ONLY
                action — you never opened an account there — which is why a row
                like Escavador would otherwise sit here worth nothing. */}
            {removable && (
              <button
                onClick={onRemocao}
                className="mt-2 flex w-full items-center gap-2.5 rounded-xl border border-border px-3 py-2.5 text-left transition active:scale-[0.99]"
                style={
                  removalDone
                    ? {
                        borderColor: "var(--color-success)",
                        backgroundColor: "rgba(15,169,104,0.06)",
                      }
                    : undefined
                }
              >
                <span
                  className="grid h-5 w-5 shrink-0 place-items-center rounded-md border"
                  style={
                    removalDone
                      ? {
                          backgroundColor: "var(--color-success)",
                          borderColor: "var(--color-success)",
                        }
                      : { borderColor: "var(--color-border)" }
                  }
                >
                  {removalDone && <Check className="h-3 w-3 text-white" strokeWidth={3.5} />}
                </span>
                <span className="min-w-0 flex-1 text-[13.5px] leading-snug text-foreground">
                  {removalDone ? "Remoção solicitada" : "Pedir remoção dos meus dados"}
                  <span className="block text-[11.5px] text-muted-foreground">{tier.eta}</span>
                </span>
                <span
                  className="shrink-0 text-[12.5px] font-bold"
                  style={{ color: removalDone ? "#0FA968" : "var(--color-muted-foreground)" }}
                >
                  +{POINTS.removal_requested}
                </span>
              </button>
            )}

            {advice.length > 0 && (
              <>
                <p className="mb-2 mt-3.5 text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Fique atento
                </p>
                <ul className="space-y-1.5">
                  {advice.map((a) => (
                    <li
                      key={a}
                      className="flex gap-2 text-[12.5px] leading-relaxed text-muted-foreground"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-navy)]/40" />
                      {a}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {(tasks.length > 0 || removable) && (
              <p className="mt-3 text-[11px] text-muted-foreground">
                Você marca o que já fez — não temos como verificar isso no site do serviço. Os
                pontos entram no seu Identity Score na hora, e dá para desmarcar.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function VazamentosTab() {
  const { scanResult, isPremium, openScan, setProtecaoPill } = useApp();
  const [, force] = useState(0);
  // Contas used to be its own pill. It reads the same HIBP payload as the
  // breach list — one is "what leaked", the other "where you still have an
  // account" — so they belong under one heading, and the top bar gets a slot
  // back.
  const [view, setView] = useState<"vazamentos" | "contas">("vazamentos");
  /**
   * Ordered by what can actually be resolved.
   *
   * rankForDisplay already leads with the brands a Brazilian recognises and
   * sinks the malware dumps. On top of that, the leaks whose companies have a
   * working privacy channel come first: those are the ones where ticking a box
   * and asking for removal actually ends somewhere. A list that opens with
   * four identical "Registros de malware" — which nobody can do anything about
   * — teaches people this screen has nothing for them.
   */
  const breaches = useMemo(() => {
    const rank = { facil: 0, media: 1, dificil: 2, impossivel: 3 } as const;
    return rankForDisplay((scanResult?.hibp?.breaches ?? []) as Breach[]).sort(
      (a, b) => rank[difficultyOf(a)] - rank[difficultyOf(b)],
    );
  }, [scanResult]);

  if (!scanResult) {
    return (
      <div className="px-5 py-10 text-center">
        <p className="text-[14px] font-semibold text-foreground">Nenhuma verificação ainda</p>
        <p className="mx-auto mt-1.5 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
          Seus vazamentos aparecem aqui depois do primeiro scan.
        </p>
        <button
          onClick={openScan}
          className="mt-4 rounded-full px-5 py-2.5 text-[13.5px] font-bold text-white"
          style={{ background: "linear-gradient(135deg,#4F46E5,#6366F1)" }}
        >
          Fazer scan grátis
        </button>
      </div>
    );
  }

  const Switcher = (
    <div className="flex gap-1 rounded-full border border-border bg-secondary/40 p-1">
      {(
        [
          { id: "vazamentos", label: "Vazamentos" },
          { id: "contas", label: "Contas" },
        ] as const
      ).map((v) => {
        const active = view === v.id;
        return (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={`flex-1 rounded-full py-1.5 text-[13px] font-medium transition ${
              active ? "text-white" : "text-muted-foreground"
            }`}
            style={active ? { backgroundColor: "#4F46E5" } : undefined}
          >
            {v.label}
          </button>
        );
      })}
    </div>
  );

  if (view === "contas") {
    return (
      <div className="pb-2">
        <div className="px-5 pt-4">{Switcher}</div>
        <ContasTab />
      </div>
    );
  }

  return (
    <div className="space-y-4 px-5 py-4">
      {Switcher}
      {breaches.length === 0 ? (
        <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-success)]/20 bg-[var(--color-success)]/5 p-4">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--color-success)]" />
          <p className="text-[13.5px] text-[var(--color-success)]">
            Seu e-mail não apareceu em vazamentos conhecidos.
          </p>
        </div>
      ) : (
        <>
          <p className="text-[12.5px] leading-relaxed text-muted-foreground">
            Toque em cada vazamento para ver o que saiu e o que fazer a respeito.
          </p>
          <div className="space-y-2">
            {breaches.map((b) => (
              <BreachRow
                key={keyOf(b)}
                b={b}
                onChange={() => force((n) => n + 1)}
                onRemocao={() => setProtecaoPill("remocao")}
              />
            ))}
          </div>
        </>
      )}

      {/* Detection is free; being told about the NEXT one is the subscription. */}
      {!isPremium && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--color-navy)]/10">
              <Lock className="h-4 w-4 text-[var(--color-navy)]" />
            </span>
            <div>
              <p className="text-[14.5px] font-bold text-foreground">E o próximo vazamento?</p>
              <p className="text-[12px] text-muted-foreground">
                Este scan é uma foto de hoje. Vazamentos novos aparecem toda semana.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              void startCheckout("essencial");
            }}
            className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-bold text-white transition active:scale-[0.99]"
            style={{ background: "linear-gradient(135deg,#4F46E5,#6366F1)" }}
          >
            <ShieldCheck className="h-4 w-4" /> Ativar monitoramento contínuo
          </button>
        </div>
      )}
    </div>
  );
}
