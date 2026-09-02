/**
 * The remediation ledger — what the person has actually done about their
 * exposure.
 *
 * The score used to describe only what we found, so it never moved: someone
 * could change every password and close every old account and still read the
 * same number. That makes the app a diagnosis with no treatment, and there is
 * no reason to come back to a diagnosis. Every action recorded here credits
 * the score back (see riskScore.ts), which is what turns detection into a
 * loop worth returning to.
 *
 * Two honesty rules baked in:
 *
 * 1. Most of these are SELF-DECLARED. We cannot verify that a password was
 *    changed on someone else's site. The copy has to say "você marcou como
 *    resolvido", never "verificamos". Undoing has to be possible, which is why
 *    every action is reversible.
 *
 * 2. A leak that happened cannot be un-happened. The credit is capped in
 *    riskScore.ts so acting can never restore a perfect score — what actions
 *    reduce is the chance of the exposure being USED, not the exposure itself.
 *
 * Device-local for now, like the rest of the app's per-user state. Moving it
 * to Supabase is what would make the score follow someone across devices.
 */
export type ActionType =
  | "password_changed"
  | "account_closed"
  | "twofa_enabled"
  | "removal_requested";

export type Action = { type: ActionType; target: string; at: number };

const KEY = "priva_actions";

const keyOf = (type: ActionType, target: string) => `${type}:${target}`;

function readAll(): Record<string, Action> {
  if (typeof window === "undefined") return {};
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "{}");
    return raw && typeof raw === "object" ? (raw as Record<string, Action>) : {};
  } catch {
    return {};
  }
}

function writeAll(map: Record<string, Action>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* storage blocked — the action still applies for this session */
  }
}

export function recordAction(type: ActionType, target: string): void {
  const map = readAll();
  const k = keyOf(type, target);
  if (map[k]) return;
  map[k] = { type, target, at: Date.now() };
  writeAll(map);
}

/** Reversible on purpose: a self-declared action must be un-declarable. */
export function undoAction(type: ActionType, target: string): void {
  const map = readAll();
  delete map[keyOf(type, target)];
  writeAll(map);
}

export const hasAction = (type: ActionType, target: string): boolean =>
  !!readAll()[keyOf(type, target)];

export const listActions = (): Action[] => Object.values(readAll()).sort((a, b) => b.at - a.at);

export function countByType(type: ActionType): number {
  return Object.values(readAll()).filter((a) => a.type === type).length;
}

/** Everything the ledger holds, in the shape riskScore.ts consumes. */
export function resolvedCounts() {
  return {
    passwordsChanged: countByType("password_changed"),
    accountsClosed: countByType("account_closed"),
    twoFactorEnabled: countByType("twofa_enabled"),
    removalsRequested: countByType("removal_requested"),
  };
}

export type ResolvedCounts = ReturnType<typeof resolvedCounts>;
