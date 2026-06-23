import { useState } from "react";
import { ChevronRight, Copy, RefreshCw, Lock } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/contexts/AppContext";
import { PasswordChecker } from "../PasswordChecker";

type Status = "Comprometida" | "Fraca" | "Segura";
const items: { name: string; status: Status; when: string }[] = [
  { name: "Gmail", status: "Comprometida", when: "verificado hoje" },
  { name: "Instagram", status: "Comprometida", when: "verificado hoje" },
  { name: "Nubank", status: "Segura", when: "verificado ontem" },
  { name: "iFood", status: "Fraca", when: "verificado ontem" },
  { name: "LinkedIn", status: "Comprometida", when: "verificado 2 dias atrás" },
  { name: "Spotify", status: "Segura", when: "verificado 3 dias atrás" },
];

const statusColor = (s: Status) => s === "Comprometida" ? "var(--color-danger)" : s === "Fraca" ? "var(--color-warning)" : "var(--color-success)";

function getServiceLogo(name: string): string {
  const domains: Record<string, string> = {
    'Gmail': 'gmail.com',
    'Instagram': 'instagram.com',
    'Nubank': 'nubank.com.br',
    'iFood': 'ifood.com.br',
    'LinkedIn': 'linkedin.com',
    'Spotify': 'spotify.com',
    'Facebook': 'facebook.com',
    'Twitter': 'twitter.com',
    'Mercado Livre': 'mercadolivre.com.br',
    'Banco Inter': 'bancointer.com.br',
    'Bradesco': 'bradesco.com.br',
    'Itaú': 'itau.com.br',
    'Magazine Luiza': 'magazineluiza.com.br',
    'Amazon': 'amazon.com.br',
  };
  const domain = domains[name] || `${name.toLowerCase()}.com`;
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
  const { isPremium, openPaywall } = useApp();

  return (
    <>
      <div className="space-y-5 px-5 py-5">
        {/* Pwned Passwords checker (standalone tool) */}
        <PasswordChecker />

        {/* Generator */}
        <section className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-foreground">Gerador de Senhas</h2>
          <div className="mt-3 rounded-xl p-4" style={{ backgroundColor: "#4F46E5" }}>
            <p className="font-mono text-lg font-medium tracking-wider text-white break-all">{pwd}</p>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <label className="text-xs font-medium text-muted-foreground">Tamanho</label>
            <span className="text-sm font-semibold text-foreground">{length} caracteres</span>
          </div>
          <input type="range" min={8} max={32} value={length} onChange={(e) => setLength(+e.target.value)} className="mt-2 w-full" style={{ accentColor: "#4F46E5" }} />

          <div className="mt-4 space-y-2.5">
            {[
              { l: "Maiúsculas", v: upper, s: setUpper },
              { l: "Números", v: numbers, s: setNumbers },
              { l: "Símbolos", v: symbols, s: setSymbols },
            ].map((t) => (
              <label key={t.l} className="flex items-center justify-between text-sm text-foreground">
                {t.l}
                <button
                  onClick={() => t.s(!t.v)}
                  className={`relative h-6 w-11 rounded-full transition ${t.v ? "" : "bg-muted"}`}
                  style={t.v ? { backgroundColor: "#4F46E5" } : undefined}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${t.v ? "left-[22px]" : "left-0.5"}`} />
                </button>
              </label>
            ))}
          </div>

          <div className="mt-5 flex gap-2">
            <button
              onClick={() => setPwd(generatePassword(length, upper, numbers, symbols))}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white hover:opacity-90 transition"
              style={{ backgroundColor: "#4F46E5" }}
            >
              <RefreshCw className="h-4 w-4" /> Gerar nova senha
            </button>
            <button
              onClick={() => { navigator.clipboard?.writeText(pwd); toast.success("Senha copiada"); }}
              className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white hover:opacity-90 transition"
              style={{ backgroundColor: "#4F46E5" }}
            >
              <Copy className="h-4 w-4" /> Copiar
            </button>
          </div>
        </section>

        {/* List */}
        <section>
          <h2 className="mb-3 px-1 text-sm font-semibold text-foreground">Suas credenciais</h2>
          <ul className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
            {items.map((it, i) => {
              const c = statusColor(it.status);
              const locked = !isPremium && it.status === "Comprometida";
              return (
                <li key={it.name} className={`flex items-center gap-3 px-4 py-3.5 ${i > 0 ? "border-t border-border/60" : ""}`}>
                  <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                    <img
                      src={getServiceLogo(it.name)}
                      alt={it.name}
                      className="w-9 h-9 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.innerHTML =
                          `<span class="text-foreground font-bold text-sm">${it.name[0]}</span>`;
                      }}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{it.name}</p>
                    <p className="text-[11px] text-muted-foreground">{it.when}</p>
                  </div>
                  {locked ? (
                    <button
                      onClick={openPaywall}
                      className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground hover:bg-secondary/80 transition"
                    >
                      <Lock className="h-3 w-3" /> Bloqueado
                    </button>
                  ) : (
                    <span className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide" style={{ backgroundColor: `color-mix(in oklab, ${c} 14%, transparent)`, color: c }}>
                      {it.status}
                    </span>
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </>
  );
}
