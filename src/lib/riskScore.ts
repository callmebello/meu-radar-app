/**
 * Exposure score — deterministic, from evidence we actually hold.
 *
 * The report used to draw this from Math.random() inside a band, so two people
 * with identical findings got different numbers and the same person got a new
 * one each session. It sits directly above the price, presented as "baseado em
 * N fatores analisados", so it has to be the one number on the page nobody can
 * catch us inventing.
 *
 * 100 = nothing found. Each factor subtracts a fixed, explainable amount.
 */
import type { ResolvedCounts } from "./actions";

export type ScoreInput = {
  breachCount: number;
  passwordExposed: boolean;
  /** Any breach dated within the last 12 months. */
  recent: boolean;
  /** Hits from the public-exposure lookups (SerpAPI/GitHub). */
  publicHits: number;
  /** What the person has already done about it (see lib/actions.ts). */
  resolved?: ResolvedCounts;
};

/**
 * How much each remediation gives back.
 *
 * These are smaller than the penalties they answer, and deliberately so: a
 * changed password reduces the chance of the leak being used, it does not
 * un-leak the data. Requesting removal is worth the most because it is the
 * only action with a third party actually on the hook.
 */
export const ACTION_CREDIT = {
  passwordChanged: 5,
  accountClosed: 4,
  twoFactorEnabled: 6,
  removalRequested: 10,
} as const;

/**
 * Ceiling on recovery, as a share of the penalty found.
 *
 * A score that climbs back to 100 by clicking would be a lie — the breach
 * happened and the data is out. Capping at 70% keeps the number moving enough
 * to be worth chasing while leaving a residue that only time and a clean
 * re-scan can clear.
 */
const MAX_RECOVERY = 0.7;

/** `icon` names the lucide component the report renders for this factor. */
export type ScoreFactorIcon = "eye" | "key" | "clock" | "globe" | "check";

export type ScoreFactor = { label: string; weight: number; icon: ScoreFactorIcon };

export type ScoreResult = {
  score: number;
  factors: ScoreFactor[];
  /** Points given back by completed actions, after the recovery cap. */
  credit: number;
  /** Score this person would have with no remediation — the "before". */
  baseScore: number;
};

export function computeScore(input: ScoreInput): ScoreResult {
  const factors: ScoreFactor[] = [];

  // Breaches: heaviest single driver, with diminishing weight so a long tail of
  // old dumps doesn't push everyone to the same floor.
  if (input.breachCount > 0) {
    const w = Math.min(40, 12 + (input.breachCount - 1) * 7);
    factors.push({
      label: `${input.breachCount} ${input.breachCount === 1 ? "vazamento encontrado" : "vazamentos encontrados"}`,
      weight: w,
      icon: "eye",
    });
  }

  if (input.passwordExposed) {
    factors.push({ label: "Senhas comprometidas", weight: 20, icon: "key" });
  }

  if (input.recent) {
    factors.push({ label: "Exposição recente (últimos 12 meses)", weight: 12, icon: "clock" });
  }

  if (input.publicHits > 0) {
    factors.push({
      label: `Dados públicos detectados (${input.publicHits})`,
      weight: Math.min(15, 6 + input.publicHits * 3),
      icon: "globe",
    });
  }

  const total = factors.reduce((sum, f) => sum + f.weight, 0);
  // Floor at 8 rather than 0: a zero reads as broken, and there is always some
  // residual uncertainty we can't claim to have measured.
  const baseScore = Math.max(8, 100 - total);

  const r = input.resolved;
  const earned = r
    ? r.passwordsChanged * ACTION_CREDIT.passwordChanged +
      r.accountsClosed * ACTION_CREDIT.accountClosed +
      r.twoFactorEnabled * ACTION_CREDIT.twoFactorEnabled +
      r.removalsRequested * ACTION_CREDIT.removalRequested
    : 0;
  // Recovery is bounded by what was actually lost, so someone with nothing
  // found cannot farm points, and nobody climbs back to a clean slate.
  const credit = Math.min(earned, Math.round(total * MAX_RECOVERY));

  if (credit > 0) {
    factors.push({ label: "Ações que você concluiu", weight: -credit, icon: "check" });
  }

  const score = Math.min(100, Math.max(8, baseScore + credit));

  return { score, factors, credit, baseScore };
}

export function riskLevel(score: number) {
  if (score < 40)
    return { label: "RISCO ALTO", color: "#DC2626", bg: "rgba(220,38,38,0.10)" } as const;
  // Warmer amber than the old #D97706, which read as earthy/muddy next to the
  // indigo brand colour.
  if (score < 70)
    return { label: "RISCO MÉDIO", color: "#F59E0B", bg: "rgba(245,158,11,0.10)" } as const;
  return { label: "RISCO BAIXO", color: "#0FA968", bg: "rgba(15,169,104,0.10)" } as const;
}
