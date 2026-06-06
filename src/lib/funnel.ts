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

// Placeholder — replace with real Mercado Pago checkout links per plan.
export const MERCADO_PAGO_URL = "#";
