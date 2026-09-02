import { useMemo, useState } from "react";
import { ChevronDown, Check, Lock, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { rankForDisplay, displayName, logoOf, pwnCountLabel, type Breach } from "@/lib/breaches";
import { guidanceFor, leakedLabels } from "@/lib/breachActions";
import { hasAction, recordAction, undoAction, type ActionType } from "@/lib/actions";
import { startCheckout } from "@/lib/checkout";
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
const keyOf = (b: Breach) => b.Domain || b.Name || displayName(b);

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

function BreachRow({ b, onChange }: { b: Breach; onChange: () => void }) {
  const [open, setOpen] = useState(false);
  const name = displayName(b);
  const k = keyOf(b);
  const leaked = leakedLabels(b);
  const { tasks, advice } = useMemo(() => guidanceFor(b, name), [b, name]);
  const done = tasks.filter((t) => hasAction(t.type, k)).length;

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
            style={
              done === tasks.length
                ? { backgroundColor: "rgba(15,169,104,0.12)", color: "#0FA968" }
                : {
                    backgroundColor: "var(--color-secondary)",
                    color: "var(--color-muted-foreground)",
                  }
            }
          >
            {done}/{tasks.length}
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
            {tasks.length > 0 && (
              <>
                <p className="mb-2 text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground">
                  O que fazer agora
                </p>
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
                          <span className="text-[13.5px] text-foreground">{t.label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
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

            {tasks.length > 0 && (
              <p className="mt-3 text-[11px] text-muted-foreground">
                Você marca o que já fez — não temos como verificar isso no site do serviço. Cada
                item concluído aumenta seu score.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function VazamentosTab() {
  const { scanResult, isPremium, openScan } = useApp();
  const [, force] = useState(0);
  const breaches = useMemo(
    () => rankForDisplay((scanResult?.hibp?.breaches ?? []) as Breach[]),
    [scanResult],
  );

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

  return (
    <div className="space-y-4 px-5 py-4">
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
              <BreachRow key={keyOf(b)} b={b} onChange={() => force((n) => n + 1)} />
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
