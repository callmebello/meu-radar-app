// User-managed credentials (localStorage). After subscribing, the credentials
// list shows only the user's own entries (no mock demo data).

export type CredStatus = "Comprometida" | "Fraca" | "Segura" | "Não verificada";
export type Credential = { id: string; name: string; status: CredStatus; when: string };

const KEY = "priva_credentials";

export function getCredentials(): Credential[] {
  if (typeof window === "undefined") return [];
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function saveCredentials(creds: Credential[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(creds));
  } catch {
    /* ignore */
  }
}

export function makeCredential(name: string, status: CredStatus): Credential {
  return {
    id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim(),
    status,
    when: "adicionado agora",
  };
}
