import { useState } from "react";
import { useIsDark } from "@/hooks/use-is-dark";

/**
 * The app in a phone frame.
 *
 * This was drawn in DOM at first — a miniature of the home rendered live. It
 * looked like a diagram, not a product: at 190px the type collapses and the
 * gauge loses its curve, and the whole thing reads as a wireframe next to the
 * photography around it. The prepared art does the job the DOM version was
 * pretending to.
 *
 * Two files, one per theme, picked live so the mock never sits light-on-dark.
 */
export function PhoneMock({
  width = 200,
  className = "",
  /** Optional art for a specific screen, e.g. the Priva ID face. */
  src,
}: {
  width?: number;
  className?: string;
  src?: string;
}) {
  const [failed, setFailed] = useState(false);
  const isDark = useIsDark();
  const fallback = isDark ? "/mockup-dark.png" : "/mockup-light.png";
  return (
    <img
      src={src && !failed ? src : fallback}
      onError={() => setFailed(true)}
      alt="Priva no celular"
      className={`h-auto w-full object-contain ${className}`}
      style={{ width, filter: "drop-shadow(0 18px 34px rgba(30,35,80,0.22))" }}
    />
  );
}
