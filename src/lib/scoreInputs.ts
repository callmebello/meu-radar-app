import type { ScanResult, ExposureResult } from "@/contexts/AppContext";
import type { ScoreInput } from "./riskScore";
import { resolvedCounts } from "./actions";

/**
 * Turns a stored scan into score inputs.
 *
 * It exists so the home and the report cannot disagree. The dashboard used to
 * derive its "Identity Score" from the digits of the CPF (`getScore` in
 * funnel.ts) while the report computed a real one from the findings — two
 * different numbers for the same person, on two screens, one of them invented.
 */
type Breach = Record<string, unknown>;

const classesOf = (b: Breach): string[] =>
  Array.isArray(b.DataClasses) ? (b.DataClasses as string[]) : [];

const has = (b: Breach, re: RegExp) => classesOf(b).some((c) => re.test(c.toLowerCase()));

const tsOf = (b: Breach) => {
  const d = b.BreachDate;
  const t = typeof d === "string" ? Date.parse(d) : NaN;
  return Number.isNaN(t) ? 0 : t;
};

/** Null when there is no scan on file — the caller must show "not measured", never a number. */
export function scoreInputsFrom(
  scan: ScanResult | null,
  exposure: ExposureResult | null,
): ScoreInput | null {
  if (!scan) return null;
  const breaches = (scan.hibp?.breaches ?? []) as Breach[];
  const publicHits =
    (exposure?.cpf?.count ?? 0) +
    (exposure?.phone?.count ?? 0) +
    (exposure?.github?.count ?? 0) +
    (exposure?.footprint?.count ?? 0);

  return {
    breachCount: scan.breachCount ?? 0,
    passwordExposed: breaches.some((b) => has(b, /password/)),
    recent: breaches.some((b) => tsOf(b) && Date.now() - tsOf(b) < 365 * 86_400_000),
    publicHits,
    resolved: resolvedCounts(),
  };
}
