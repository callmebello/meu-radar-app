import { ChevronRight } from "lucide-react";
import { IncidentMark } from "./IncidentMark";
import { useApp } from "@/contexts/AppContext";

/**
 * The way into Incident Mode.
 *
 * Same floating card as everything else on these screens — the red outline and
 * glow it used to carry made it shout on every visit, which is how a warning
 * stops being read. The mark and the two red words carry the urgency; the box
 * behaves like a normal card.
 *
 * It appears in exactly two places: the foot of Proteção, and under a
 * high-risk result in Atividade — the moment someone has just found out they
 * were targeted. Everywhere else it would be noise, and noise is what makes an
 * emergency button invisible when it is finally needed.
 */
export function EmergencyCta({ className = "" }: { className?: string }) {
  const { goToTab } = useApp();
  return (
    <button
      onClick={() => goToTab("incidente")}
      className={`flex w-full items-center gap-3.5 rounded-2xl border border-border/60 bg-card px-4 py-4 text-left shadow-sm transition active:scale-[0.99] ${className}`}
    >
      <span
        className="grid h-12 w-12 shrink-0 place-items-center rounded-full"
        style={{ backgroundColor: "rgba(239,68,68,0.10)" }}
      >
        <IncidentMark className="h-7 w-7" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-extrabold leading-tight text-foreground">
          Preciso de <span style={{ color: "var(--color-danger)" }}>ajuda agora</span>
        </span>
        <span className="mt-0.5 line-clamp-2 block text-[12.5px] leading-snug text-muted-foreground">
          Golpe, roubo, perda do celular ou conta invadida
        </span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </button>
  );
}
