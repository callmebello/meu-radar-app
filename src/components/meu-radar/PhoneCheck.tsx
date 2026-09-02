import { useState } from "react";
import { Phone, Search, Lock, CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { searchExposure } from "@/lib/api/serpapi.functions";
import { getProfile, saveProfile } from "@/lib/profile";
import { track, gaEvent } from "@/lib/analytics";

/**
 * Phone Check — what the open web shows about a number.
 *
 * The engine already existed (searchExposure accepts type "phone") but had no
 * door: it only ran during a scan, and only if a phone happened to be on the
 * profile. Most people never filled that in, so the feature effectively did not
 * exist.
 *
 * Unlike the link, Pix and message tools, this one costs real money — every
 * check is a paid search credit, against a monthly ceiling shared by all users.
 * So it gets one free run and then the plan, which is also honest positioning:
 * a number is checked once, not daily.
 *
 * The result is written back into the app's exposure state, so it lands in
 * Proteção › Exposição and moves the score like any other finding.
 */
const FREE_KEY = "priva_phone_checks";
const FREE_LIMIT = 1;

const used = () => {
  try {
    return Number(localStorage.getItem(FREE_KEY) || "0");
  } catch {
    return 0;
  }
};

const digits = (v: string) => v.replace(/\D/g, "");

/** Brazilian mobile, with or without country code. */
const isValidPhone = (v: string) => {
  const d = digits(v);
  return d.length === 11 || d.length === 10 || (d.length === 13 && d.startsWith("55"));
};

const format = (v: string) => {
  const d = digits(v).slice(-11);
  if (d.length < 10) return v;
  const ddd = d.slice(0, 2);
  const rest = d.slice(2);
  return rest.length === 9
    ? `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`
    : `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
};

export function PhoneCheck() {
  const { isPremium, openPaywall, setExposure, exposure } = useApp();
  const [value, setValue] = useState(() => {
    try {
      return (getProfile().extraPhone as string) || "";
    } catch {
      return "";
    }
  });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{
    count: number;
    sources: { title: string; link: string }[];
  } | null>(null);
  const [error, setError] = useState("");

  const left = isPremium ? Infinity : Math.max(0, FREE_LIMIT - used());

  const run = async () => {
    if (!isValidPhone(value)) {
      setError("Digite um número com DDD.");
      return;
    }
    if (left <= 0) {
      openPaywall();
      return;
    }
    setError("");
    setBusy(true);
    try {
      const r = await searchExposure({ data: { query: digits(value), type: "phone" } });
      setResult({
        count: r.count,
        sources: r.sources.map((s) => ({ title: s.title, link: s.link })),
      });
      // Everything stays connected: the finding joins the exposure the rest of
      // the app reads, so it shows up in Exposição and counts in the score.
      setExposure({
        ...(exposure ?? {}),
        phone: { found: r.found, count: r.count, sources: r.sources },
      });
      try {
        saveProfile({ ...getProfile(), extraPhone: digits(value) });
        if (!isPremium) localStorage.setItem(FREE_KEY, String(used() + 1));
      } catch {
        /* ignore */
      }
      track("PhoneChecked");
      gaEvent("phone_checked", { hits: r.count });
    } catch {
      setError("Não conseguimos consultar agora. Tente de novo em instantes.");
    }
    setBusy(false);
  };

  return (
    <div className="px-5 pt-3">
      <p className="text-[12.5px] leading-relaxed text-muted-foreground">
        Procuramos seu número em páginas públicas indexadas — anúncios, listas, cadastros expostos.
        É o que um golpista encontra sobre você começando pelo telefone.
      </p>

      {!isPremium && (
        <p className="pt-1.5 text-[11.5px] text-muted-foreground">
          {left > 0 ? (
            <>
              {left} consulta gratuita ·{" "}
              <button onClick={openPaywall} className="font-semibold text-[var(--color-navy)]">
                ilimitado no Essencial
              </button>
            </>
          ) : (
            <>
              Você já usou sua consulta gratuita ·{" "}
              <button onClick={openPaywall} className="font-semibold text-[var(--color-navy)]">
                assine para continuar
              </button>
            </>
          )}
        </p>
      )}

      <div className="mt-3">
        <input
          type="tel"
          inputMode="tel"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => setValue((v) => format(v))}
          placeholder="(11) 90000-0000"
          className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-[15px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-indigo-500"
        />
        {error && <p className="mt-1.5 text-[12.5px] text-[#DC2626]">{error}</p>}
        <button
          onClick={run}
          disabled={busy}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-[14.5px] font-bold text-white transition active:scale-[0.99] disabled:opacity-60"
          style={{ background: "linear-gradient(135deg,#4F46E5,#6366F1)" }}
        >
          {busy ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Procurando...
            </>
          ) : left <= 0 ? (
            <>
              <Lock className="h-4 w-4" /> Consultar telefone
            </>
          ) : (
            <>
              <Search className="h-4 w-4" /> Consultar telefone
            </>
          )}
        </button>
      </div>

      {result && (
        <section className="mt-5">
          {result.count === 0 ? (
            <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-success)]/20 bg-[var(--color-success)]/5 p-4">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--color-success)]" />
              <p className="text-[13.5px] text-[var(--color-success)]">
                Seu número não apareceu em páginas públicas indexadas.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#F59E0B]/12">
                  <Phone className="h-4 w-4" style={{ color: "#F59E0B" }} />
                </span>
                <p className="text-[13.5px] leading-relaxed text-foreground">
                  Encontramos <strong>{result.count}</strong>{" "}
                  {result.count === 1 ? "página" : "páginas"} com seu número.
                </p>
              </div>
              <ul className="mt-2 space-y-1.5">
                {result.sources.map((s) => (
                  <li key={s.link}>
                    <a
                      href={s.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3"
                    >
                      <span className="min-w-0 flex-1 truncate text-[13px] text-foreground">
                        {s.title || s.link}
                      </span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    </a>
                  </li>
                ))}
              </ul>
            </>
          )}
          <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
            Buscamos apenas o que já está público e indexado. Não acessamos operadora, cadastro
            telefônico nem conteúdo de mensagens.
          </p>
        </section>
      )}
    </div>
  );
}
