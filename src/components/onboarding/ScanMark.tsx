import { Check } from "lucide-react";

/**
 * The Priva mark under a radar sweep, resolving to a check when the scan lands.
 *
 * Same conic sweep the centre button in the tab bar uses, so the gesture the
 * person meets during onboarding is the one they will keep pressing later. On
 * completion the ring closes into a solid green disc and the mark gives way to
 * a check — the moment the analysis finishes should be visible, not just a
 * number reaching 100.
 */
export function ScanMark({ done, size = 120 }: { done: boolean; size?: number }) {
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }} aria-hidden>
      {/* Halo */}
      <span
        className="absolute inset-0 rounded-full blur-xl transition-colors duration-500"
        style={{
          background: done
            ? "radial-gradient(circle, rgba(16,185,129,0.35) 0%, rgba(16,185,129,0) 68%)"
            : "radial-gradient(circle, rgba(99,102,241,0.35) 0%, rgba(99,102,241,0) 68%)",
        }}
      />

      {/* Rings pushing outwards while it works */}
      {!done &&
        [0, 1].map((i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              inset: -6,
              border: "1.5px solid rgba(79,70,229,0.28)",
              animation: `mascot-ring 2.2s ease-out ${i * 1.1}s infinite`,
            }}
          />
        ))}

      {/* The sweep itself */}
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background: done
            ? "var(--color-success)"
            : "conic-gradient(from 0deg, rgba(99,102,241,0) 0deg, rgba(99,102,241,0) 250deg, rgba(99,102,241,0.12) 300deg, rgba(79,70,229,0.6) 358deg, rgba(79,70,229,0.85) 360deg)",
          animation: done ? "none" : "nav-sweep 1.15s linear infinite",
          transition: "background 0.4s ease",
        }}
      />

      {/* Face */}
      <span
        className="absolute grid place-items-center rounded-full bg-card shadow-sm transition-all duration-300"
        style={{ inset: done ? 8 : 7 }}
      >
        {done ? (
          <Check
            className="h-1/2 w-1/2 animate-[scan-pop_0.45s_cubic-bezier(0.34,1.5,0.5,1)]"
            style={{ color: "var(--color-success)" }}
            strokeWidth={3.2}
          />
        ) : (
          <img src="/PRIVA_mark.png" alt="" className="h-1/2 w-1/2 object-contain" />
        )}
      </span>
    </div>
  );
}
