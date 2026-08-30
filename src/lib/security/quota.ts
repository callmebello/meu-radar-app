/**
 * Free-tier quota for the verification tools.
 *
 * The Essencial plan advertises "verificação ilimitada", so the free tier has
 * to have a limit or the promise means nothing. Three a day is enough to prove
 * the tool works on the checks people actually make, and the wall lands at the
 * moment of highest intent — someone with a fourth suspicious message.
 *
 * Device-local by design: no account is required to use the tools, so there is
 * nothing to count against server-side. It is a fair-use nudge, not DRM.
 */
const KEY = "priva_check_quota";
export const FREE_CHECKS_PER_DAY = 3;

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

/** How many checks are left today. Subscribers are never limited. */
export function checksLeft(isPremium: boolean): number {
  if (isPremium) return Infinity;
  return Math.max(0, FREE_CHECKS_PER_DAY - read().used);
}

/** Records one use. Returns false when the free allowance is already spent. */
export function consumeCheck(isPremium: boolean): boolean {
  if (isPremium) return true;
  const q = read();
  if (q.used >= FREE_CHECKS_PER_DAY) return false;
  try {
    localStorage.setItem(KEY, JSON.stringify({ day: q.day, used: q.used + 1 }));
  } catch {
    /* storage blocked — let the check through rather than breaking the tool */
    return true;
  }
  return true;
}
