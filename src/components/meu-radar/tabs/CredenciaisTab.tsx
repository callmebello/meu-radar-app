import { useState } from "react";
import { Copy, RefreshCw, Plus, X, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PasswordChecker } from "../PasswordChecker";
import { ChevronDown, KeyRound } from "lucide-react";
import { checkPwnedPassword } from "@/lib/pwned";
import {
  getCredentials,
  saveCredentials,
  makeCredential,
  type Credential,
  type CredStatus,
} from "@/lib/credentials";

const statusColor = (s: CredStatus) =>
  s === "Comprometida"
    ? "var(--color-danger)"
    : s === "Fraca"
      ? "var(--color-warning)"
      : s === "Segura"
        ? "var(--color-success)"
        : "var(--color-muted-foreground)";

function getServiceLogo(name: string): string {
  const domains: Record<string, string> = {
    Gmail: "gmail.com",
    Instagram: "instagram.com",
    Nubank: "nubank.com.br",
    iFood: "ifood.com.br",
    LinkedIn: "linkedin.com",
    Spotify: "spotify.com",
    Facebook: "facebook.com",
    Twitter: "twitter.com",
    "Mercado Livre": "mercadolivre.com.br",
    "Banco Inter": "bancointer.com.br",
    Bradesco: "bradesco.com.br",
    Itaú: "itau.com.br",
    "Magazine Luiza": "magazineluiza.com.br",
    Amazon: "amazon.com.br",
  };
  const domain = domains[name] || `${name.toLowerCase().replace(/\s+/g, "")}.com`;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}

function generatePassword(length: number, upper: boolean, numbers: boolean, symbols: boolean) {
  let chars = "abcdefghijklmnopqrstuvwxyz";
  if (upper) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (numbers) chars += "0123456789";
  if (symbols) chars += "!@#$%&*?";
  let out = "";
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

export function CredenciaisTab() {
  const [length, setLength] = useState(14);
  const [upper, setUpper] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [pwd, setPwd] = useState("Kx#9mP$vL2@nQ8");
  const [genOpen, setGenOpen] = useState(false);

  // User-managed credentials (persisted) — real data only, no demo entries.
  const [creds, setCreds] = useState<Credential[]>(() => getCredentials());
  const [adding, setAdding] = useState(false);
  const [cName, setCName] = useState("");
  const [cPwd, setCPwd] = useState("");
  const [checking, setChecking] = useState(false);

  const persist = (next: Credential[]) => {
    setCreds(next);
    saveCredentials(next);
  };

  const addCred = async () => {
    const name = cName.trim();
    if (!name || checking) return;
    let status: CredStatus = "Não verificada";
    if (cPwd) {
      setChecking(true);
      try {
        const r = await checkPwnedPassword(cPwd);
        status = r.count > 0 ? "Comprometida" : "Segura";
      } catch {
        /* keep "Não verificada" */
      }
      setChecking(false);
    }
    persist([makeCredential(name, status), ...creds]);
    setCName("");
    setCPwd("");
    setAdding(false);
  };

  const removeCred = (id: string) => persist(creds.filter((c) => c.id !== id));

  return (
    <>
      <div className="space-y-5 px-5 py-5">
        {/* Pwned Passwords checker (standalone tool) */}
        <PasswordChecker />

        {/* Credentials list */}
        <section>
          <h2 className="mb-3 px-1 text-sm font-semibold text-foreground">Suas credenciais</h2>
          <ul className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
            {/* Add credential — first row in the box */}
            {adding ? (
              <li className="border-b border-border/60 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-foreground">Nova credencial</p>
                  <button
                    onClick={() => setAdding(false)}
                    aria-label="Cancelar"
                    className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-secondary/60"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <input
                  value={cName}
                  onChange={(e) => setCName(e.target.value)}
                  placeholder="Serviço (ex.: Gmail, Nubank)"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none"
                />
                <input
                  type="password"
                  value={cPwd}
                  onChange={(e) => setCPwd(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addCred()}
                  placeholder="Senha (opcional — verificamos se vazou)"
                  autoComplete="off"
                  className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none"
                />
                <button
                  onClick={addCred}
                  disabled={!cName.trim() || checking}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition disabled:opacity-50"
                  style={{ backgroundColor: "#4F46E5" }}
                >
                  {checking ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Verificando...
                    </>
                  ) : (
                    "Adicionar credencial"
                  )}
                </button>
              </li>
            ) : (
              <li>
                <button
                  onClick={() => setAdding(true)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-secondary/40"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--color-navy)]/10">
                    <Plus className="h-5 w-5 text-[var(--color-navy)]" />
                  </span>
                  <span className="text-sm font-semibold text-[var(--color-navy)]">
                    Adicionar credencial
                  </span>
                </button>
              </li>
            )}

            {/* User-added credentials (real) */}
            {creds.map((it) => {
              const c = statusColor(it.status);
              return (
                <li
                  key={it.id}
                  className="flex items-center gap-3 border-t border-border/60 px-4 py-3.5"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center">
                    <img
                      src={getServiceLogo(it.name)}
                      alt={it.name}
                      className="h-9 w-9 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        e.currentTarget.parentElement!.innerHTML = `<span class="text-foreground font-bold text-sm">${it.name[0] ?? "?"}</span>`;
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{it.name}</p>
                    <p className="text-[11px] text-muted-foreground">{it.when}</p>
                  </div>
                  <span
                    className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide"
                    style={{
                      backgroundColor: `color-mix(in oklab, ${c} 14%, transparent)`,
                      color: c,
                    }}
                  >
                    {it.status}
                  </span>
                  <button
                    onClick={() => removeCred(it.id)}
                    aria-label="Remover credencial"
                    className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-secondary/60 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </li>
              );
            })}

            {/* Empty state */}
            {creds.length === 0 && !adding && (
              <li className="border-t border-border/60 px-4 py-6 text-center">
                <p className="text-sm text-muted-foreground">Nenhuma credencial ainda.</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Toque em “Adicionar credencial” para começar.
                </p>
              </li>
            )}
          </ul>
        </section>

        {/* Generator — collapsed, and last.
            It is a utility you reach for occasionally, and it was sitting above
            the two things this screen exists for: whether a password of yours
            has leaked, and the credentials you are tracking. */}
        <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
          <button
            onClick={() => setGenOpen((v) => !v)}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
            aria-expanded={genOpen}
          >
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg"
              style={{ backgroundColor: "rgba(79,70,229,0.10)" }}
            >
              <KeyRound className="h-4 w-4" style={{ color: "#4F46E5" }} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13.5px] font-bold leading-tight text-foreground">
                Gerador de senhas
              </span>
              <span className="block text-[11.5px] leading-tight text-muted-foreground">
                Crie uma senha forte
              </span>
            </span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${genOpen ? "rotate-180" : ""}`}
            />
          </button>

          <div
            className="grid transition-all duration-300"
            style={{ gridTemplateRows: genOpen ? "1fr" : "0fr" }}
          >
            <div className="overflow-hidden">
              <div className="border-t border-border px-4 py-4">
                <div className="flex items-center gap-2">
                  {/* A tinted field, not a solid indigo block: the password is
                      the content here, not a call to action. */}
                  <p
                    className="min-w-0 flex-1 break-all rounded-xl border px-3 py-2.5 font-mono text-[15px] font-semibold tracking-wide text-foreground"
                    style={{
                      backgroundColor: "rgba(79,70,229,0.06)",
                      borderColor: "rgba(79,70,229,0.20)",
                    }}
                  >
                    {pwd}
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(pwd);
                      toast.success("Senha copiada");
                    }}
                    aria-label="Copiar senha"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-border text-foreground"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setPwd(generatePassword(length, upper, numbers, symbols))}
                    aria-label="Gerar nova senha"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white"
                    style={{ backgroundColor: "#4F46E5" }}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <span className="shrink-0 text-[11.5px] text-muted-foreground">
                    {length} car.
                  </span>
                  <input
                    type="range"
                    min={8}
                    max={32}
                    value={length}
                    onChange={(e) => setLength(+e.target.value)}
                    className="min-w-0 flex-1"
                    style={{ accentColor: "#4F46E5" }}
                  />
                </div>

                {/* Chips instead of three labelled toggle rows: same choice,
                    one line instead of five. */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {[
                    { l: "ABC", v: upper, s: setUpper },
                    { l: "123", v: numbers, s: setNumbers },
                    { l: "#$&", v: symbols, s: setSymbols },
                  ].map((t) => (
                    <button
                      key={t.l}
                      onClick={() => t.s(!t.v)}
                      className="rounded-full border px-3 py-1.5 text-[12px] font-semibold transition"
                      style={
                        t.v
                          ? { backgroundColor: "#4F46E5", borderColor: "#4F46E5", color: "#fff" }
                          : {
                              borderColor: "var(--color-border)",
                              color: "var(--color-muted-foreground)",
                            }
                      }
                    >
                      {t.l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
