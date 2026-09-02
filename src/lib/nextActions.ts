import type { ScanResult, ExposureResult } from "@/contexts/AppContext";
import { rankForDisplay, displayName, type Breach } from "./breaches";
import { guidanceFor } from "./breachActions";
import { hasAction } from "./actions";
import { ACTION_CREDIT, computeScore } from "./riskScore";
import { scoreInputsFrom } from "./scoreInputs";

/**
 * What to do next, and what it is worth.
 *
 * The score became real and started moving, but it still only reported a state:
 * you had to go looking for the things that would change it. This turns it into
 * the spine — the number, then the shortest path to a better one, on the first
 * screen.
 *
 * The points shown are the points actually earned. Remediation is capped at a
 * share of the penalty (see riskScore), so someone close to the ceiling would
 * otherwise be promised gains that never arrive — the fastest way to make the
 * whole score feel fake. Everything here is clamped to the real headroom.
 */
export type NextAction = {
  id: string;
  label: string;
  points: number;
  /** Where tapping it goes. */
  pill: "credenciais" | "contas" | "vazamentos" | "exposicao";
};

const keyOf = (b: Breach) => b.Domain || b.Name || displayName(b);

const CREDIT_OF = {
  password_changed: ACTION_CREDIT.passwordChanged,
  twofa_enabled: ACTION_CREDIT.twoFactorEnabled,
} as const;

export type NextActionsResult = {
  actions: NextAction[];
  /** Total the person can still gain, after the cap. */
  headroom: number;
};

export function nextActions(
  scan: ScanResult | null,
  exposure: ExposureResult | null,
): NextActionsResult {
  if (!scan) return { actions: [], headroom: 0 };

  const inputs = scoreInputsFrom(scan, exposure);
  if (!inputs) return { actions: [], headroom: 0 };
  const { credit, creditCap } = computeScore(inputs);
  const headroom = Math.max(0, creditCap - credit);

  const breaches = rankForDisplay((scan.hibp?.breaches ?? []) as Breach[]);
  const actions: NextAction[] = [];

  for (const b of breaches) {
    const k = keyOf(b);
    const name = displayName(b);
    for (const t of guidanceFor(b, name).tasks) {
      if (hasAction(t.type, k)) continue;
      const points = CREDIT_OF[t.type as keyof typeof CREDIT_OF];
      if (!points) continue;
      actions.push({
        id: `${t.type}:${k}`,
        label:
          t.type === "password_changed" ? `Trocar a senha do ${name}` : `Ativar 2FA no ${name}`,
        points,
        pill: "vazamentos",
      });
    }
  }

  // Old accounts are worth points only once closed, so the prompt names the
  // decision rather than promising the credit for opening a screen.
  const stillOpen = breaches.filter((b) => !hasAction("account_closed", keyOf(b))).length;
  if (stillOpen > 0) {
    actions.push({
      id: "review_accounts",
      label: "Revisar contas que você não usa mais",
      points: ACTION_CREDIT.accountClosed,
      pill: "contas",
    });
  }

  // Never promise more than the cap allows: trim the tail once the headroom is
  // spent, so the sum on screen is a sum the person can really reach.
  let budget = headroom;
  const affordable: NextAction[] = [];
  for (const a of actions) {
    if (budget <= 0) break;
    const points = Math.min(a.points, budget);
    affordable.push({ ...a, points });
    budget -= points;
  }

  return { actions: affordable, headroom: headroom - budget };
}
