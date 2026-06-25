import { useEffect, useRef, useState } from "react";
import { AppHeader } from "../Header";
import { Plus, Lock, X, Trash2, Gift, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/contexts/AppContext";
import { getScore } from "@/lib/funnel";
import { getMembers, saveMembers, makeMember, type Member, type Risk } from "@/lib/family";

const riskColor = (r: Risk) => (r === "Alto" ? "var(--color-danger)" : r === "Médio" ? "var(--color-warning)" : "var(--color-success)");

// Same scale used by the home Identity Score (lower = worse).
const riskFromScore = (score: number): Risk => (score >= 70 ? "Baixo" : score >= 45 ? "Médio" : "Alto");

export function FamiliaTab() {
  const { isPremium, openPaywall, familyAddPending, clearFamilyAdd, scanResult } = useApp();
  const [members, setMembers] = useState<Member[]>(() => getMembers());
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [rel, setRel] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

  // "Você" must show the exact same score as the home (Priva) tab.
  const cpf = typeof window !== "undefined" ? sessionStorage.getItem("priva_cpf") || "" : "";
  const homeScore = cpf ? getScore(cpf, scanResult?.breachCount ?? 0) : 67;
  const youRisk = riskFromScore(homeScore);

  const invite = async () => {
    const url = typeof window !== "undefined" ? window.location.origin : "https://www.privaapp.com.br";
    const text = "Proteja seus dados com a Priva. Assine pelo meu convite e eu ganho 1 mês grátis!";
    try {
      if (typeof navigator !== "undefined" && navigator.share) await navigator.share({ title: "Priva", text, url });
      else {
        await navigator.clipboard.writeText(`${text} ${url}`);
        toast.success("Link de convite copiado!");
      }
    } catch {
      /* user cancelled share */
    }
  };

  // Opened via the header "+" menu → auto-open the add form.
  useEffect(() => {
    if (familyAddPending) {
      setAdding(true);
      clearFamilyAdd();
    }
  }, [familyAddPending, clearFamilyAdd]);

  useEffect(() => {
    if (adding) nameRef.current?.focus();
  }, [adding]);

  const persist = (next: Member[]) => {
    setMembers(next);
    saveMembers(next);
  };

  const addMember = () => {
    if (!name.trim()) return;
    persist([...members, makeMember(name, rel)]);
    setName("");
    setRel("");
    setAdding(false);
  };

  const removeMember = (id: string) => {
    if (id === "you") return; // can't remove yourself
    persist(members.filter((m) => m.id !== id));
  };

  return (
    <>
      <AppHeader title="Plano Família" subtitle={`${members.length} membros monitorados`} showBell />
      <div className="space-y-4 px-5 py-5">
        <ul className="space-y-3">
          {members.map((m) => {
            const isYou = m.rel === "Você" || m.id === "you";
            const displayScore = isYou ? homeScore : m.score;
            const displayRisk = isYou ? youRisk : m.risk;
            const c = riskColor(displayRisk);
            return (
              <li key={m.id} className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[var(--color-navy)] text-sm font-bold text-white">
                    {m.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">{m.name}</p>
                      {m.attention && (
                        <span className="rounded-full bg-[var(--color-danger)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">Atenção</span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">{m.rel} · verificado {m.when}</p>
                  </div>
                  <div className="text-right">
                    {isPremium || isYou ? (
                      <p className="text-xl font-extrabold tracking-tight text-foreground">{displayScore}</p>
                    ) : (
                      <button onClick={openPaywall} className="inline-flex items-center gap-1 text-xl font-extrabold text-muted-foreground transition hover:text-foreground">
                        <Lock className="h-3.5 w-3.5" />—
                      </button>
                    )}
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: c }}>Risco {displayRisk}</p>
                  </div>
                  {!isYou && (
                    <button onClick={() => removeMember(m.id)} aria-label="Remover membro" className="ml-1 grid h-7 w-7 shrink-0 place-items-center rounded-full text-gray-500 hover:bg-secondary/60 hover:text-red-400">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {/* Add member form */}
        {adding ? (
          <div className="rounded-2xl border border-[var(--color-navy)]/30 bg-card p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Novo membro</p>
              <button onClick={() => setAdding(false)} aria-label="Cancelar" className="grid h-7 w-7 place-items-center rounded-full text-gray-500 hover:bg-secondary/60">
                <X className="h-4 w-4" />
              </button>
            </div>
            <input
              ref={nameRef}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nome completo"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none"
            />
            <input
              value={rel}
              onChange={(e) => setRel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addMember()}
              placeholder="Parentesco (ex.: Cônjuge, Filho, Mãe)"
              className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none"
            />
            <button
              onClick={addMember}
              disabled={!name.trim()}
              className="mt-3 w-full rounded-xl bg-[var(--color-navy)] py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              Adicionar membro
            </button>
          </div>
        ) : (
          /* Add a single member — paid, nudges users toward the free referral below */
          <button
            onClick={() => setAdding(true)}
            className="flex w-full items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 text-left shadow-sm transition active:scale-[0.99]"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[var(--color-navy)]/10">
              <Plus className="h-5 w-5 text-[var(--color-navy)]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold text-foreground">Adicionar membro</span>
              <span className="block text-[11px] text-muted-foreground">Monitore mais uma pessoa</span>
            </span>
            <span className="shrink-0 text-right">
              <span className="block text-sm font-extrabold text-foreground">R$ 9,90</span>
              <span className="block text-[10px] text-muted-foreground">/mês</span>
            </span>
          </button>
        )}

        {/* Upgrade — full family plan */}
        <section className="rounded-2xl bg-[var(--color-navy)] p-5 text-white shadow-lg">
          <p className="text-xs font-bold uppercase tracking-wider text-white/80">Upgrade</p>
          <h3 className="mt-1 text-lg font-bold">Plano Família — até 6 membros</h3>
          <p className="mt-1 text-sm text-white/70">R$ 49,90/mês — você usa {members.length} de 6 slots</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-white" style={{ width: `${Math.min(100, (members.length / 6) * 100)}%` }} />
          </div>
        </section>

        {/* Referral — invite & earn a free month */}
        <button
          onClick={invite}
          className="flex w-full items-center gap-3 rounded-2xl p-4 text-left shadow-sm transition active:scale-[0.99]"
          style={{ background: "linear-gradient(135deg,#0f2a1a,#12643a)", border: "1px solid rgba(34,197,94,0.25)" }}
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/10">
            <Gift className="h-5 w-5 text-emerald-300" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-white">Convide e ganhe</span>
            <span className="block text-[11px] text-white/70">Assine e ganhe 1 mês grátis a cada amigo que assinar</span>
          </span>
          <ChevronRight className="h-4 w-4 shrink-0 text-white/60" />
        </button>
      </div>
    </>
  );
}
