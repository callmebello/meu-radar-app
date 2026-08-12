import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { LP, SCAN_HREF } from "./theme";

/** Shared primitives for the institutional landing at /inicio. */

export function Container({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto w-full max-w-[1200px] px-5 sm:px-8 ${className}`}>{children}</div>
  );
}

/** Fades its children up the first time they enter the viewport. */
export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // No observer (older browsers, SSR hydration edge) — show immediately
    // rather than leaving the section invisible.
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`lp-reveal ${shown ? "is-in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export function Eyebrow({ children, light }: { children: ReactNode; light?: boolean }) {
  return (
    <p
      className="text-center text-[11px] font-bold uppercase tracking-[0.18em]"
      style={{ color: light ? LP.lilac : LP.indigo }}
    >
      {children}
    </p>
  );
}

export function SectionTitle({
  children,
  light,
  className = "",
}: {
  children: ReactNode;
  light?: boolean;
  className?: string;
}) {
  return (
    <h2
      className={`text-center text-[28px] font-bold leading-[1.15] tracking-tight sm:text-[38px] ${className}`}
      style={{ color: light ? "#FFFFFF" : LP.text }}
    >
      {children}
    </h2>
  );
}

/** Primary action of the whole page. Always points at the scan funnel. */
export function ScanCta({
  children = "Verificar meus dados grátis",
  size = "md",
  className = "",
}: {
  children?: ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const pad =
    size === "sm"
      ? "px-4 py-2.5 text-[13px]"
      : size === "lg"
        ? "px-7 py-4 text-[16px]"
        : "px-6 py-3.5 text-[15px]";
  return (
    <Link
      to={SCAN_HREF}
      className={`lp-cta inline-flex items-center justify-center gap-2 rounded-2xl font-bold text-white ${pad} ${className}`}
      style={{ background: `linear-gradient(135deg, ${LP.violet}, ${LP.indigo})` }}
    >
      {children}
      <ArrowRight className="h-[18px] w-[18px]" />
    </Link>
  );
}

/**
 * Brand lockup: the round PRIVA badge plus the wordmark — both the real assets,
 * nothing redrawn. Only the wordmark swaps colour: white over the dark hero,
 * brand indigo over white sections.
 */
export function PrivaWordmark({ light = false, size = 30 }: { light?: boolean; size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <img
        src="/PRIVA_mark.png"
        alt=""
        className="object-contain"
        style={{ height: size, width: size }}
      />
      <img
        src={light ? "/PRIVA_logo_dark_theme.png" : "/PRIVA_wordmark_indigo.png"}
        alt="PRIVA"
        className="w-auto object-contain"
        style={{ height: Math.round(size * 0.52) }}
      />
    </span>
  );
}
