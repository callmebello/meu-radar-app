import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

/**
 * The shell every onboarding screen shares.
 *
 * One layout, one CTA position, one back affordance — so the flow feels like a
 * single moving surface instead of thirteen pages. The progress bar is the only
 * thing that tells you where you are, which is the point: the person should be
 * thinking about their data, not about the form.
 */
export function Step({
  progress,
  onBack,
  children,
  cta,
  onCta,
  ctaDisabled,
  footer,
}: {
  progress: number;
  onBack?: () => void;
  children: ReactNode;
  cta?: string;
  onCta?: () => void;
  ctaDisabled?: boolean;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-[100dvh] flex-col bg-background">
      <div className="flex items-center gap-3 px-5 pt-4">
        {onBack ? (
          <button
            onClick={onBack}
            aria-label="Voltar"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        ) : (
          <span className="h-9 w-9 shrink-0" />
        )}
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${Math.round(progress * 100)}%`,
              background: "linear-gradient(90deg,#4F46E5,#6366F1)",
            }}
          />
        </div>
      </div>

      {/* Top-aligned, always. With the mascot out, centring pushed the
          headline into the middle of the screen and left the noble area empty —
          the rest of the app puts the thing that matters up top, and so does
          this now. */}
      <div className="flex flex-1 flex-col justify-start px-6 pt-6">
        <div className="animate-step-in">{children}</div>
      </div>

      {(cta || footer) && (
        <div className="px-6 pb-6 pt-3">
          {cta && (
            <button
              onClick={onCta}
              disabled={ctaDisabled}
              className="flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-[16px] font-bold text-white transition active:scale-[0.99] disabled:opacity-40"
              style={{ background: "linear-gradient(135deg,#4F46E5,#6366F1)" }}
            >
              {cta} <ArrowRight className="h-4 w-4" />
            </button>
          )}
          {footer && <div className="pt-3 text-center">{footer}</div>}
        </div>
      )}
    </div>
  );
}

export function Title({ children }: { children: ReactNode }) {
  return (
    <h1 className="text-center text-[28px] font-extrabold leading-[1.15] tracking-tight text-foreground">
      {children}
    </h1>
  );
}

export function Sub({ children }: { children: ReactNode }) {
  return (
    <p className="mx-auto mt-3 max-w-[19rem] text-center text-[14.5px] leading-relaxed text-muted-foreground">
      {children}
    </p>
  );
}

/** The brand accent inside a headline. */
export function Hl({ children }: { children: ReactNode }) {
  return <span style={{ color: "#4F46E5" }}>{children}</span>;
}
