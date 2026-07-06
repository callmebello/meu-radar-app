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
  score?: number; // Identity Score 0-100 (higher = mais protegido)
  name?: string;
  cpfLast2?: string;
  email?: string;
  hibp?: { count: number; breaches: StoredBreach[] } | null;
  exposure?: {
    github?: {
      found: boolean;
      count: number;
      repos: { repo: string; path: string; url: string }[];
    } | null;
    cpf?: { found: boolean; count: number; sources: StoredSource[] } | null;
    phone?: { found: boolean; count: number; sources: StoredSource[] } | null;
  } | null;
};

// Premium "executive" palette — light pages, black brand header, indigo accents.
export const PDF_COLORS = {
  navy: "#000000",
  navySoft: "#1A1A2E",
  indigo: "#4F46E5",
  indigoSoft: "#6366F1",
  indigoBg: "#EEF0FF",
  white: "#FFFFFF",
  page: "#FFFFFF",
  ink: "#16161D",
  inkSoft: "#5B5B6B",
  faint: "#8A8A99",
  line: "#E7E7F0",
  cardBg: "#F7F7FB",
  red: "#DC2626",
  amber: "#D97706",
  green: "#059669",
  redBg: "#FDECEC",
  amberBg: "#FDF1E3",
  greenBg: "#E7F6F0",
};

// Risk level from breach count (kept for back-compat; the report uses scoreRisk).
export function pdfRisk(breaches: number): { label: string; color: string } {
  if (breaches >= 5) return { label: "ALTO", color: PDF_COLORS.red };
  if (breaches >= 2) return { label: "MÉDIO", color: PDF_COLORS.amber };
  return { label: "BAIXO", color: PDF_COLORS.green };
}

// Risk tier from the Identity Score — mirrors the app's scoreBadge (higher score
// = mais protegido = menor risco). Does NOT recompute the score.
export function scoreRisk(score: number): {
  tier: "Baixo" | "Médio" | "Alto";
  label: string;
  color: string;
  bg: string;
  meaning: string;
} {
  if (score >= 70)
    return {
      tier: "Baixo",
      label: "Risco Baixo",
      color: PDF_COLORS.green,
      bg: PDF_COLORS.greenBg,
      meaning: "Sua exposição pública está controlada.",
    };
  if (score >= 45)
    return {
      tier: "Médio",
      label: "Risco Médio",
      color: PDF_COLORS.amber,
      bg: PDF_COLORS.amberBg,
      meaning: "Foram encontradas algumas informações públicas que merecem atenção.",
    };
  return {
    tier: "Alto",
    label: "Risco Alto",
    color: PDF_COLORS.red,
    bg: PDF_COLORS.redBg,
    meaning:
      "Foram encontrados diversos indícios de exposição digital que aumentam o risco de fraudes e comprometimento de contas.",
  };
}

// Translate HIBP data classes to friendly Portuguese (never expose raw names).
const DATA_CLASS_PT: Record<string, string> = {
  "Email addresses": "Email",
  Passwords: "Senha",
  Names: "Nome",
  Usernames: "Nome de usuário",
  "Phone numbers": "Telefone",
  "Dates of birth": "Data de nascimento",
  "Physical addresses": "Endereço",
  "Geographic locations": "Localização",
  "IP addresses": "Endereço IP",
  Genders: "Gênero",
  "Credit cards": "Cartão de crédito",
  "Credit card CVV": "CVV do cartão",
  "Bank account numbers": "Conta bancária",
  "Social security numbers": "Documento",
  "Password hints": "Dica de senha",
  "Security questions and answers": "Perguntas de segurança",
  "Job titles": "Cargo",
  Employers: "Empregador",
  "Spoken languages": "Idioma",
  "Time zones": "Fuso horário",
  "Website activity": "Atividade em sites",
  "Device information": "Dispositivo",
  "Account balances": "Saldo de conta",
  "Partial credit card data": "Dados parciais de cartão",
};
export function translateDataClass(dc: string): string {
  return DATA_CLASS_PT[dc] || dc;
}

// Stealer-log breaches are grouped (never listed by technical name).
export function isStealerBreach(name: string): boolean {
  return /stealer|log/i.test(name || "");
}

export function breachHasPassword(b: StoredBreach): boolean {
  return (b.dataClasses || []).some((d) => /password|senha/i.test(d));
}

export function breachSeverity(b: StoredBreach): { label: string; color: string; bg: string } {
  const dc = (b.dataClasses || []).join(" ").toLowerCase();
  if (/password|credit|bank|social security|cvv|conta banc/.test(dc))
    return { label: "Alta", color: PDF_COLORS.red, bg: PDF_COLORS.redBg };
  if ((b.dataClasses || []).length >= 3)
    return { label: "Média", color: PDF_COLORS.amber, bg: PDF_COLORS.amberBg };
  return { label: "Baixa", color: PDF_COLORS.green, bg: PDF_COLORS.greenBg };
}

export function yearOf(date?: string): string {
  const m = (date || "").match(/\d{4}/);
  return m ? m[0] : "";
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
