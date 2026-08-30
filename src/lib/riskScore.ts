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
export type ScoreInput = {
  breachCount: number;
  passwordExposed: boolean;
  /** Any breach dated within the last 12 months. */
  recent: boolean;
  /** Hits from the public-exposure lookups (SerpAPI/GitHub). */
  publicHits: number;
};

/** `icon` names the lucide component the report renders for this factor. */
export type ScoreFactorIcon = "eye" | "key" | "clock" | "globe";

export type ScoreFactor = { label: string; weight: number; icon: ScoreFactorIcon };

export type ScoreResult = {
  score: number;
  factors: ScoreFactor[];
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
  const score = Math.max(8, 100 - total);

  return { score, factors };
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
