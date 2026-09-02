import { useState } from "react";
import { Phone, UserSearch } from "lucide-react";
import { PhoneCheck } from "../PhoneCheck";
import { FootprintCheck } from "../FootprintCheck";
import { DarkWebTab } from "./DarkWebTab";

/**
 * Exposição — what is public about this person, and the two ways to look for
 * more of it.
 *
 * Phone Check started out in Atividade, next to the link, Pix and message
 * tools. It never belonged there: those answer "is this thing someone sent me
 * safe?", while this asks "what is out there about me?" — a different question
 * with a different mental model, and its results already fed this panel.
 * Grouping them here also puts the two searches that cost money in one place,
 * which makes the spending visible instead of scattered.
 */
type Mode = "telefone" | "nome";

export function ExposicaoTab() {
  const [mode, setMode] = useState<Mode>("telefone");

  return (
    <div className="space-y-5 pb-2">
      <section className="px-5 pt-4">
        <h2 className="text-[14.5px] font-bold text-foreground">Buscar mais sobre você</h2>

        <div className="mt-3 flex gap-1 rounded-full border border-border bg-secondary/40 p-1">
          {(
            [
              { id: "telefone", label: "Telefone", Icon: Phone },
              { id: "nome", label: "Nome / usuário", Icon: UserSearch },
            ] as const
          ).map((m) => {
            const active = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-[13px] font-medium transition ${
                  active ? "text-white" : "text-muted-foreground"
                }`}
                style={active ? { backgroundColor: "#4F46E5" } : undefined}
              >
                <m.Icon className="h-3.5 w-3.5" /> {m.label}
              </button>
            );
          })}
        </div>

        <div className="mt-3">
          {/* PhoneCheck brings its own padding — it was written as a standalone
              tool panel — so it is rendered outside this section's box. */}
          {mode === "nome" && <FootprintCheck />}
        </div>
      </section>

      {mode === "telefone" && (
        <div className="-mt-4">
          <PhoneCheck />
        </div>
      )}

      <DarkWebTab />
    </div>
  );
}
