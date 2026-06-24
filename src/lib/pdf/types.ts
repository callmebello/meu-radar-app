// Shape of the rich scan result we persist into scans.result (jsonb) and read
// back when rendering PDFs. All fields optional/defensive — older scans may not
// have every field.

export type StoredBreach = {
  name: string;
  date: string;
  dataClasses: string[];
};

export type StoredSource = { title: string; link: string };

export type StoredScanResult = {
  breachCount?: number;
  score?: number; // 0-100 (lower = worse exposure)
  name?: string;
  cpfLast2?: string;
  email?: string;
  hibp?: { count: number; breaches: StoredBreach[] } | null;
  exposure?: {
    github?: { found: boolean; count: number; repos: { repo: string; path: string; url: string }[] } | null;
    cpf?: { found: boolean; count: number; sources: StoredSource[] } | null;
    phone?: { found: boolean; count: number; sources: StoredSource[] } | null;
  } | null;
};

// Brand palette shared by both PDF templates.
export const PDF_COLORS = {
  navy: "#0A0A1F",
  navyCard: "#12121F",
  indigo: "#4F46E5",
  indigoSoft: "#6366F1",
  white: "#FFFFFF",
  muted: "#9B9BA7",
  red: "#F87171",
  amber: "#FBBF24",
  green: "#34D399",
  border: "#23233A",
};

// Risk level from breach count, shared by app + PDF.
export function pdfRisk(breaches: number): { label: string; color: string } {
  if (breaches >= 5) return { label: "ALTO", color: PDF_COLORS.red };
  if (breaches >= 2) return { label: "MÉDIO", color: PDF_COLORS.amber };
  return { label: "BAIXO", color: PDF_COLORS.green };
}

// Pick the single most relevant public source URL found (for the LGPD letter).
export function firstSourceUrl(r: StoredScanResult | null | undefined): string | null {
  const ex = r?.exposure;
  if (!ex) return null;
  if (ex.github?.repos?.length) return ex.github.repos[0].url || null;
  if (ex.cpf?.sources?.length) return ex.cpf.sources[0].link || null;
  if (ex.phone?.sources?.length) return ex.phone.sources[0].link || null;
  return null;
}
