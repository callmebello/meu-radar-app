/**
 * Presentation rules for HIBP breaches.
 *
 * We already fetch the full breach objects (`truncateResponse=false`), so the
 * recognisable data is there — it just wasn't being used:
 *
 *   Name        machine key, e.g. "June2026StealerLogs", "LinkedIn"
 *   Title       human name,  e.g. "Stealer Logs from June 2026", "LinkedIn"
 *   Domain      linkedin.com
 *   LogoPath    brand logo hosted by HIBP
 *   PwnCount    accounts in that breach
 *   IsStealerLog  malware credential dumps, not a company breach
 *
 * The report was reading `Name` first and sorting purely by date, which put
 * technical stealer-log identifiers at the top. A lead who sees
 * "SynthientStealerLogThreatData" learns nothing; one who sees LinkedIn with
 * its logo understands immediately.
 */
export type Breach = {
  Name?: string;
  Title?: string;
  Domain?: string;
  LogoPath?: string;
  PwnCount?: number;
  BreachDate?: string;
  AddedDate?: string;
  DataClasses?: string[];
  IsStealerLog?: boolean;
  IsVerified?: boolean;
  IsSpamList?: boolean;
};

/** Malware credential dumps — real, but they carry no brand a lead recognises. */
export function isStealerLog(b: Breach): boolean {
  if (b.IsStealerLog === true) return true;
  // Fallback for older API payloads that predate the flag.
  return /stealer|combolist|collection\s*#|logs$/i.test(b.Name ?? b.Title ?? "");
}

/** A breach a person can actually name: a company, with a site behind it. */
export function isCompany(b: Breach): boolean {
  return !isStealerLog(b) && Boolean(b.Domain);
}

const humanize = (name: string) =>
  name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();

/** What we put on screen. Title is HIBP's readable name; Name is the last resort. */
export function displayName(b: Breach): string {
  if (isStealerLog(b)) return "Registros de malware";
  const title = (b.Title ?? "").trim();
  if (title) return title;
  const name = (b.Name ?? "").trim();
  return name ? humanize(name) : "Vazamento";
}

/** Second line under the name: the site, or what a stealer log actually is. */
export function displaySubtitle(b: Breach): string {
  if (isStealerLog(b)) return "Senhas capturadas por vírus em dispositivos infectados";
  return b.Domain ?? "";
}

export function logoOf(b: Breach): string | null {
  return isStealerLog(b) ? null : (b.LogoPath ?? null);
}

/** "2,3 bilhões de contas" — HIBP's own figure, useful and verifiable. */
export function pwnCountLabel(b: Breach): string | null {
  const n = b.PwnCount;
  if (!n || n < 1000) return null;
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1).replace(".", ",")} bi de contas`;
  if (n >= 1_000_000) return `${Math.round(n / 1_000_000)} mi de contas`;
  return `${Math.round(n / 1000)} mil contas`;
}

const ts = (b: Breach) => Date.parse(b.BreachDate || b.AddedDate || "") || 0;

/**
 * Order for the lead's eyes: recognisable companies first, biggest first,
 * then everything else by date. Stealer logs always come last — they are the
 * least legible and would otherwise dominate, since they are the most recent.
 */
export function rankForDisplay(breaches: Breach[]): Breach[] {
  const companies = breaches
    .filter(isCompany)
    .sort((a, b) => (b.PwnCount ?? 0) - (a.PwnCount ?? 0));
  const others = breaches
    .filter((b) => !isCompany(b) && !isStealerLog(b))
    .sort((a, b) => ts(b) - ts(a));
  const stealers = breaches.filter(isStealerLog).sort((a, b) => ts(b) - ts(a));
  return [...companies, ...others, ...stealers];
}

/** Only the breaches that carry a name a person recognises. */
export function recognisableCompanies(breaches: Breach[]): Breach[] {
  return breaches.filter(isCompany).sort((a, b) => (b.PwnCount ?? 0) - (a.PwnCount ?? 0));
}
