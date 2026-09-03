import { ChevronRight } from "lucide-react";
import { IncidentMark } from "./IncidentMark";
import { useApp } from "@/contexts/AppContext";

/**
 * The emergency button.
 *
 * It used to be a plain card with two red words in it, which is the safest
 * thing to draw and the wrong thing to draw: the one control someone hunts for
 * while their hands are shaking should not look like every other row on the
 * screen. It now reads as what it is — red border, red ground, red mark — and
 * carries exactly two lines, a title and a subtitle, so it can be understood
 * without being read.
 *
 * It appears where an emergency actually starts: the foot of Proteção, the Pix
 * check (money already sent is the emergency people arrive with), and under any
 * high-risk result. Everywhere else it would be noise, and noise is what makes
 * an emergency button invisible when it is finally needed.
 */
export function EmergencyCta({ className = "" }: { className?: string }) {
  const { goToTab } = useApp();
  return (
    <button
      onClick={() => goToTab("incidente")}
      className={`flex w-full items-center gap-3.5 rounded-2xl border px-4 py-3.5 text-left transition active:scale-[0.99] ${className}`}
      style={{
        borderColor: "rgba(220,38,38,0.35)",
        backgroundColor: "rgba(220,38,38,0.06)",
      }}
    >
      <span
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full"
        style={{ backgroundColor: "rgba(220,38,38,0.12)" }}
      >
        <IncidentMark className="h-6 w-6" />
      </span>
      <span className="min-w-0 flex-1">
        {/* One line each. Both truncate rather than wrap: a title that grows to
            two lines pushes the subtitle out of the button on a 390px screen. */}
        <span
          className="block truncate text-[15px] font-extrabold leading-tight"
          style={{ color: "var(--color-danger)" }}
        >
          Preciso de ajuda agora
        </span>
        <span className="mt-0.5 block truncate text-[12.5px] leading-snug text-muted-foreground">
          Golpe, roubo, perda ou conta invadida
        </span>
      </span>
      <ChevronRight
        className="h-4 w-4 shrink-0"
        style={{ color: "var(--color-danger)", opacity: 0.7 }}
      />
    </button>
  );
}
