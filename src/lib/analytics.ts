// Thin Meta Pixel wrapper. Safe to call anywhere — no-ops if fbq isn't loaded
// (e.g. before a real Pixel ID is set, or during SSR).
type Fbq = (...args: unknown[]) => void;

declare global {
  interface Window {
    fbq?: Fbq;
  }
}

export function track(event: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  if (params) window.fbq("track", event, params);
  else window.fbq("track", event);
}
