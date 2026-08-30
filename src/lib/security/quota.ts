/**
 * Free allowance for the verification tools.
 *
 * This is a SOFT LIMIT, never a security control. It lives in localStorage, so
 * clearing storage resets it — accepted on purpose. Building device
 * fingerprinting to close that hole would mean identifying people more
 * aggressively in the one app whose promise is the opposite, and it would buy
 * nothing: link, Pix and message are analysed entirely on this device (no
 * network call in lib/security), so an extra check costs us exactly zero.
 *
 * The limit exists for two product reasons only: to make the Essencial plan's
 * "verificação ilimitada" mean something, and to create an honest moment to ask
 * for an account — after the tool has already proved itself.
 *
 * Real abuse protection belongs where money is actually spent: the scan path
 * (HIBP, SerpAPI), guarded server-side in api-usage.server.ts.
 *
 * The ladder: anonymous → small allowance → free account → larger allowance →
 * subscriber → unlimited. Nobody is asked to sign up before seeing a result.
 */
export type Tier = "anon" | "conta" | "assinante";

export const CHECKS_PER_DAY: Record<Tier, number> = {
  anon: 3,
  conta: 10,
  assinante: Infinity,
};

export const tierOf = (hasAccount: boolean, isPremium: boolean): Tier =>
  isPremium ? "assinante" : hasAccount ? "conta" : "anon";

const KEY = "priva_check_quota";

type Quota = { day: string; used: number };

const today = () => new Date().toISOString().slice(0, 10);

function read(): Quota {
  if (typeof window === "undefined") return { day: today(), used: 0 };
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "null") as Quota | null;
    if (!raw || raw.day !== today()) return { day: today(), used: 0 };
    return raw;
  } catch {
    return { day: today(), used: 0 };
  }
}

/**
 * How many checks are left today. The counter is shared across tiers, so
 * signing up mid-day tops the same day up instead of restarting it.
 */
export function checksLeft(tier: Tier): number {
  return Math.max(0, CHECKS_PER_DAY[tier] - read().used);
}

/** Records one use. Returns false when the allowance is already spent. */
export function consumeCheck(tier: Tier): boolean {
  if (tier === "assinante") return true;
  const q = read();
  if (q.used >= CHECKS_PER_DAY[tier]) return false;
  try {
    localStorage.setItem(KEY, JSON.stringify({ day: q.day, used: q.used + 1 }));
  } catch {
    /* storage blocked — let the check through rather than breaking the tool */
    return true;
  }
  return true;
}
