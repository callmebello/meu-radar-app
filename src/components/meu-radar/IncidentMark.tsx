import { useState } from "react";
import { LifeBuoy } from "lucide-react";

/**
 * The red Priva mark, used wherever the app talks about something having gone
 * wrong — a scam, a theft, a lost phone.
 *
 * Falls back to the life-buoy icon if the asset is missing, so the incident
 * entry never renders a broken image on the one screen someone reaches while
 * already in trouble.
 */
export function IncidentMark({ className = "h-5 w-5" }: { className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <LifeBuoy className={`${className} text-[var(--color-danger)]`} strokeWidth={1.9} />;
  }
  return (
    // Clipped to a circle: the asset has no alpha channel, so the square
    // corners would paint their own background over the tinted tile.
    <img
      src="/PRIVA_mark_red.png"
      alt=""
      onError={() => setFailed(true)}
      className={`${className} rounded-full object-cover`}
    />
  );
}
