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

export function isValidCPF(v: string) {
  return cpfDigits(v).length === 11;
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

export function openCheckout(url: string) {
  if (typeof window !== "undefined") window.open(url, "_blank");
}
