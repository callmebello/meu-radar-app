import { useEffect, useRef, useState } from "react";
import { AppHeader } from "../Header";
import { Plus, Lock, X, Trash2 } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { getMembers, saveMembers, makeMember, type Member, type Risk } from "@/lib/family";

const riskColor = (r: Risk) => (r === "Alto" ? "var(--color-danger)" : r === "Médio" ? "var(--color-warning)" : "var(--color-success)");

export function FamiliaTab() {
  const { isPremium, openPaywall, familyAddPending, clearFamilyAdd } = useApp();
  const [members, setMembers] = useState<Member[]>(() => getMembers());
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [rel, setRel] = useState("");
  const nameRef = useRef<HTMLInputElement>(null);

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
            const c = riskColor(m.risk);
            const isYou = m.rel === "Você" || m.id === "you";
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
                      <p className="text-xl font-extrabold tracking-tight text-foreground">{m.score}</p>
                    ) : (
                      <button onClick={openPaywall} className="inline-flex items-center gap-1 text-xl font-extrabold text-muted-foreground transition hover:text-foreground">
                        <Lock className="h-3.5 w-3.5" />—
                      </button>
                    )}
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: c }}>Risco {m.risk}</p>
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
          <button
            onClick={() => setAdding(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--color-navy)]/30 px-4 py-3.5 text-sm font-semibold text-[var(--color-navy)] transition hover:bg-[var(--color-navy)]/5"
          >
            <Plus className="h-4 w-4" /> Adicionar membro
          </button>
        )}

        <section className="rounded-2xl bg-[var(--color-navy)] p-5 text-white shadow-lg">
          <p className="text-xs font-bold uppercase tracking-wider text-white/80">Upgrade</p>
          <h3 className="mt-1 text-lg font-bold">Plano Família — até 6 membros</h3>
          <p className="mt-1 text-sm text-white/70">R$ 49,90/mês — você usa {members.length} de 6 slots</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-white" style={{ width: `${Math.min(100, (members.length / 6) * 100)}%` }} />
          </div>
        </section>
      </div>
    </>
  );
}
