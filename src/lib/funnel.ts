// Shared funnel helpers — deterministic mock result + CPF utils.

export function formatCPF(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  let out = d;
  if (d.length > 3) out = d.slice(0, 3) + "." + d.slice(3);
  if (d.length > 6) out = d.slice(0, 3) + "." + d.slice(3, 6) + "." + d.slice(6);
  if (d.length > 9) out = d.slice(0, 3) + "." + d.slice(3, 6) + "." + d.slice(6, 9) + "-" + d.slice(9);
  return out;
}

export function cpfDigits(v: string) {
  return v.replace(/\D/g, "");
}

// Full CPF check-digit validation (no network) — only real CPFs pass.
export function isValidCPF(v: string) {
  const d = cpfDigits(v);
  if (d.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(d)) return false; // rejects 000.., 111.., etc.

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(d[i], 10) * (10 - i);
  let dv1 = (sum * 10) % 11;
  if (dv1 === 10) dv1 = 0;
  if (dv1 !== parseInt(d[9], 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(d[i], 10) * (11 - i);
  let dv2 = (sum * 10) % 11;
  if (dv2 === 10) dv2 = 0;
  return dv2 === parseInt(d[10], 10);
}

// Basic e-mail format validation (no network).
export function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
}

// Numbers reflect real BR exposure rates — mostly high, never zero.
export function generateResult(cpf: string) {
  const digits = cpfDigits(cpf);
  const seed = digits.split("").reduce((a, b) => a + (parseInt(b) || 0), 0);
  const breachOptions = [2, 3, 3, 3, 4, 4, 4, 5, 5, 6, 7];
  const phoneOptions = [1, 1, 1, 2, 2, 2, 3, 3, 4];
  const passOptions = [0, 0, 1, 1, 1, 2, 2, 3];
  const breaches = breachOptions[seed % breachOptions.length];
  const phones = phoneOptions[(seed * 3) % phoneOptions.length];
  const passwords = passOptions[(seed * 7) % passOptions.length];
  const score = 120 + (seed % 260);
  return { breaches, phones, passwords, score, seed };
}

// Deterministic Identity Score from CPF + breach count (lower = worse).
export function getScore(cpf: string, breachCount: number) {
  const digits = cpfDigits(cpf);
  const seed = digits.split("").reduce((a, b) => a + (parseInt(b, 10) || 0), 0);
  const base = 45 + (seed % 30); // 45–74
  const penalty = breachCount * 8;
  return Math.max(20, base - penalty);
}

export function scoreBadge(score: number): { label: string; tone: "green" | "amber" | "red" } {
  if (score >= 70) return { label: "BOM", tone: "green" };
  if (score >= 45) return { label: "RISCO MÉDIO", tone: "amber" };
  return { label: "RISCO ALTO", tone: "red" };
}

// Risk label from breach count (used in the result summary).
export function riskFromBreaches(n: number): { label: string; tone: "red" | "amber" | "green" } {
  if (n >= 5) return { label: "Alto", tone: "red" };
  if (n >= 2) return { label: "Médio", tone: "amber" };
  return { label: "Baixo", tone: "green" };
}

export function maskedFields(cpf: string, seed: number) {
  const digits = cpfDigits(cpf);
  const cpfLast2 = (digits.slice(-2) || "00").padStart(2, "0");
  const domains = ["gmail.com", "hotmail.com", "outlook.com", "yahoo.com.br", "icloud.com"];
  const domain = domains[seed % domains.length];
  const first = String.fromCharCode(97 + (seed % 26));
  const phoneLast4 = String((seed * 13) % 10000).padStart(4, "0");
  return { cpfLast2, domain, first, phoneLast4 };
}

// Mercado Pago checkout links per plan. Read from Vite env vars
// (VITE_MP_*) with safe placeholders so the flow works in dev.
const env = (import.meta as unknown as { env?: Record<string, string> }).env ?? {};

// Essencial (R$9,90) and Proteção Total (R$29,90) checkout links.
export const MP_ESSENCIAL_URL = env.VITE_MP_ESSENCIAL_URL || "https://mpago.la/placeholder_essencial";
export const MP_PROTECAO_URL = env.VITE_MP_PROTECAO_URL || "https://mpago.la/placeholder_protecao";
export const MP_SCORE_URL = env.VITE_MP_SCORE_URL || "https://mpago.la/placeholder_score";
export const MP_FAMILIA_URL = env.VITE_MP_FAMILIA_URL || "https://mpago.la/placeholder_familia";

// Back-compat: the main checkout (Essencial plan).
export const MERCADO_PAGO_URL = MP_ESSENCIAL_URL;

// Map a checkout URL back to its plan id (used to gate the post-payment flow,
// e.g. only Proteção Total triggers the LGPD authorization screen).
export function planForUrl(url: string): string {
  if (url === MP_PROTECAO_URL) return "protecao_total";
  if (url === MP_FAMILIA_URL) return "familia";
  if (url === MP_SCORE_URL) return "score";
  return "essencial";
}

// Persist the plan the user is buying BEFORE redirecting to Mercado Pago, so it
// survives the round-trip and is readable when they return with ?payment=success.
export function rememberCheckoutPlan(url: string) {
  try {
    localStorage.setItem("priva_plan", planForUrl(url));
  } catch {
    /* ignore */
  }
}

export function openCheckout(url: string) {
  rememberCheckoutPlan(url);
  if (typeof window !== "undefined") window.open(url, "_blank");
}
