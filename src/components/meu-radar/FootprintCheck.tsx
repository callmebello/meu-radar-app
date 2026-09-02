import { useState } from "react";
import { Search, Lock, CheckCircle2, ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { searchExposure } from "@/lib/api/serpapi.functions";
import { startCheckout } from "@/lib/checkout";
import { track, gaEvent } from "@/lib/analytics";

/**
 * Pegada digital — what the open web shows about a name or username.
 *
 * The most demanding of the searches, and the one whose quality we control the
 * least: "João Silva" alone returns thousands of other people. So the form asks
 * for something that narrows it — a city or a username — and refuses to run on
 * a bare common name, rather than returning a list of strangers and calling it
 * the person's exposure.
 *
 * Subscriber-only, unlike Phone Check's single free run: each search spends a
 * paid credit from a monthly pool shared by every user, and a name search is
 * the one people would repeat out of curiosity.
 */
type Hit = { title: string; link: string; snippet: string };

const domainOf = (link: string) => {
  try {
    return new URL(link).hostname.replace(/^www\./, "");
  } catch {
    return link;
  }
};

export function FootprintCheck() {
  const { isPremium, exposure, setExposure } = useApp();
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [username, setUsername] = useState("");
  const [busy, setBusy] = useState(false);
  const [hits, setHits] = useState<Hit[] | null>(null);
  const [error, setError] = useState("");

  if (!isPremium) {
    return (
      <div className="rounded-2xl border border-border bg-card p-5">
        <span className="grid h-11 w-11 place-items-center rounded-full bg-[var(--color-navy)]/10">
          <Lock className="h-5 w-5 text-[var(--color-navy)]" />
        </span>
        <p className="mt-3 text-[15.5px] font-bold text-foreground">Pegada digital</p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
          Veja o que aparece sobre o seu nome e seus nomes de usuário em páginas públicas: perfis
          antigos, fóruns, cadastros e listas esquecidas.
        </p>
        <button
          onClick={() => {
            void startCheckout("essencial");
          }}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[14px] font-bold text-white transition active:scale-[0.99]"
          style={{ background: "linear-gradient(135deg,#4F46E5,#6366F1)" }}
        >
          <ShieldCheck className="h-4 w-4" /> Disponível no Essencial
        </button>
      </div>
    );
  }

  const run = async () => {
    const n = name.trim();
    const u = username.trim();
    const c = city.trim();
    // A bare name is not a search, it is a coin flip. Demand a narrower term.
    if (!u && (!n || !c)) {
      setError("Informe um nome de usuário, ou nome completo + cidade.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const query = u ? u : `"${n}" ${c}`;
      const r = await searchExposure({
        data: { query, type: u ? "username" : "name" },
      });
      setHits(r.sources);
      // Joins the same exposure the score and Exposição read, so a finding here
      // counts exactly like one from the scan.
      setExposure({
        ...(exposure ?? {}),
        footprint: { found: r.found, count: r.count, sources: r.sources },
      });
      track("FootprintChecked");
      gaEvent("footprint_checked", { hits: r.count, mode: u ? "username" : "name" });
    } catch {
      setError("Não conseguimos consultar agora. Tente de novo em instantes.");
    }
    setBusy(false);
  };

  return (
    <div>
      <p className="text-[12.5px] leading-relaxed text-muted-foreground">
        Procuramos seu nome ou nome de usuário em páginas públicas indexadas.
      </p>

      <div className="mt-3 space-y-2">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Nome de usuário (ex: joaosilva92)"
          className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-[14px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-indigo-500"
        />
        <p className="text-center text-[11.5px] text-muted-foreground">ou</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome completo"
          className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-[14px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-indigo-500"
        />
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Cidade"
          className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-[14px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-indigo-500"
        />
        {error && <p className="text-[12.5px] text-[#DC2626]">{error}</p>}
        <button
          onClick={run}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[14.5px] font-bold text-white transition active:scale-[0.99] disabled:opacity-60"
          style={{ background: "linear-gradient(135deg,#4F46E5,#6366F1)" }}
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Procurando...
            </>
          ) : (
            <>
              <Search className="h-4 w-4" /> Buscar pegada digital
            </>
          )}
        </button>
      </div>

      {hits && (
        <section className="mt-5">
          {hits.length === 0 ? (
            <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-success)]/20 bg-[var(--color-success)]/5 p-4">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--color-success)]" />
              <p className="text-[13.5px] text-[var(--color-success)]">
                Nada encontrado com esses termos.
              </p>
            </div>
          ) : (
            <ul className="space-y-1.5">
              {hits.map((h) => (
                <li key={h.link}>
                  <a
                    href={h.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block rounded-2xl border border-border bg-card px-4 py-3"
                  >
                    <span className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-foreground">
                        {h.title || domainOf(h.link)}
                      </span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    </span>
                    <span className="mt-0.5 block truncate text-[11.5px] text-muted-foreground">
                      {domainOf(h.link)}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
          {/* The limit, said before they draw the wrong conclusion. */}
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            Resultados vêm de busca pública e podem incluir homônimos — confira antes de tratar
            qualquer página como sua.
          </p>
        </section>
      )}
    </div>
  );
}
