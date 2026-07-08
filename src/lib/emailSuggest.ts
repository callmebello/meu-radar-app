// Suggests a fix for a likely-mistyped e-mail domain (Gmail-style "did you mean").
// Returns the corrected e-mail, or null when the address looks fine / is unknown.
// It NEVER mutates input — the UI only suggests; the user decides.

const KNOWN_DOMAINS = [
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "yahoo.com",
  "yahoo.com.br",
  "icloud.com",
  "live.com",
  "uol.com.br",
  "bol.com.br",
  "terra.com.br",
  "globo.com",
  "me.com",
  "proton.me",
  "hotmail.com.br",
];

// High-confidence explicit typos (checked before the fuzzy match).
const TYPO_MAP: Record<string, string> = {
  "gmail.co": "gmail.com",
  "gmail.con": "gmail.com",
  "gmail.cm": "gmail.com",
  "gmail.om": "gmail.com",
  "gmail.comm": "gmail.com",
  "gmai.com": "gmail.com",
  "gmial.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gmail.br": "gmail.com",
  "hotmail.con": "hotmail.com",
  "hotmal.com": "hotmail.com",
  "hotmai.com": "hotmail.com",
  "hotmial.com": "hotmail.com",
  "hotmil.com": "hotmail.com",
  "outlok.com": "outlook.com",
  "outook.com": "outlook.com",
  "outlook.con": "outlook.com",
  "outllook.com": "outlook.com",
  "yaho.com": "yahoo.com",
  "yahoo.con": "yahoo.com",
  "yhaoo.com": "yahoo.com",
  "uol.con": "uol.com.br",
  "icloud.con": "icloud.com",
  "iclould.com": "icloud.com",
};

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

export function suggestEmailFix(email: string): string | null {
  const raw = (email || "").trim();
  const at = raw.lastIndexOf("@");
  if (at < 1 || at === raw.length - 1) return null;

  const local = raw.slice(0, at);
  const domain = raw.slice(at + 1).toLowerCase();
  if (!domain.includes(".")) return null; // still typing the domain
  if (KNOWN_DOMAINS.includes(domain)) return null; // already good

  let fixed: string | null = TYPO_MAP[domain] ?? null;

  if (!fixed) {
    // Fuzzy: closest known domain within a small edit distance.
    let best: string | null = null;
    let bestDist = 99;
    for (const kd of KNOWN_DOMAINS) {
      const d = levenshtein(domain, kd);
      if (d < bestDist) {
        bestDist = d;
        best = kd;
      }
    }
    if (best && bestDist > 0 && bestDist <= 2) fixed = best;
  }

  if (!fixed || fixed === domain) return null;
  return `${local}@${fixed}`;
}
