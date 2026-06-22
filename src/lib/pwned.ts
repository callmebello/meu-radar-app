// Pwned Passwords k-anonymity check — fully client-side. The password never
// leaves the browser: we SHA-1 it locally and only send the first 5 hex chars of
// the hash to the HIBP range API, then compare the suffix locally.

async function sha1Hex(text: string): Promise<string> {
  if (typeof crypto === "undefined" || !crypto.subtle) {
    throw new Error("crypto.subtle indisponível (precisa de HTTPS)");
  }
  const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

export async function checkPwnedPassword(password: string): Promise<{ count: number }> {
  const hash = await sha1Hex(password);
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  // "Add-Padding" mixes in dummy results so the prefix request reveals even less.
  const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
    headers: { "Add-Padding": "true" },
  });
  if (!res.ok) throw new Error("Falha ao consultar o serviço");

  const text = await res.text();
  for (const line of text.split("\n")) {
    const [suf, countStr] = line.trim().split(":");
    if (suf === suffix) {
      const count = parseInt(countStr ?? "0", 10) || 0;
      return { count }; // padding entries have count 0 → treated as "not found"
    }
  }
  return { count: 0 };
}
