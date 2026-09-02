import { useMemo, useState } from "react";
import { ExternalLink, Search, Check, Trash2, ShieldCheck, X } from "lucide-react";
import { useApp } from "@/contexts/AppContext";
import { recognisableCompanies, displayName, logoOf, type Breach } from "@/lib/breaches";
import { hasAction, recordAction, undoAction } from "@/lib/actions";
import { track, gaEvent } from "@/lib/analytics";
import { addRemovalSource } from "@/lib/api/removal.functions";
import { getEmail } from "@/lib/identity";

/**
 * Contas esquecidas.
 *
 * Built entirely from data we already had and were throwing away: HIBP returns
 * the full breach objects, so every company that holds this e-mail is already
 * in hand. The report used that list to say "7 vazamentos" — a number that
 * frightens and gives nothing to do. The same list read the other way is "you
 * have an account at Canva, Dropbox and Deezer — do you still use them?",
 * which is a decision a person can actually make.
 *
 * No new API, no cost per use.
 *
 * What it does NOT do is delete anything. We cannot close someone's account on
 * another company's site, and pretending otherwise would be the fastest way to
 * lose the trust this product is built on. The flow gives the way in, and the
 * person confirms when it is done — which is exactly what the ledger records.
 */
const KEPT_KEY = "priva_accounts_kept";

function readKept(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const v = JSON.parse(localStorage.getItem(KEPT_KEY) || "[]");
    return new Set(Array.isArray(v) ? (v as string[]) : []);
  } catch {
    return new Set();
  }
}

function writeKept(s: Set<string>) {
  try {
    localStorage.setItem(KEPT_KEY, JSON.stringify([...s]));
  } catch {
    /* ignore */
  }
}

const keyOf = (b: Breach) => b.Domain || b.Name || displayName(b);

function Initial({ name }: { name: string }) {
  return (
    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--color-navy)]/10 text-[15px] font-bold text-[var(--color-navy)]">
      {name.charAt(0).toUpperCase()}
    </span>
  );
}

function Logo({ b }: { b: Breach }) {
  const [failed, setFailed] = useState(false);
  const src = logoOf(b);
  const name = displayName(b);
  if (!src || failed) return <Initial name={name} />;
  return (
    <img
      src={src}
      alt=""
      onError={() => setFailed(true)}
      className="h-10 w-10 shrink-0 rounded-xl bg-white object-contain p-1"
    />
  );
}

export function ContasTab() {
  const { scanResult, isPremium, openPaywall, openScan } = useApp();
  const [kept, setKept] = useState<Set<string>>(() => readKept());
  const [closed, setClosed] = useState<Set<string>>(new Set());
  const [sheet, setSheet] = useState<Breach | null>(null);
  const [requesting, setRequesting] = useState(false);

  // Subscriber path: the company joins their open case and our team is told.
  // Nothing is sent from the browser — the letter goes out from our side.
  const requestRemoval = async (b: Breach) => {
    const email = getEmail();
    if (!email) return;
    setRequesting(true);
    try {
      await addRemovalSource({
        data: {
          userId: localStorage.getItem("priva_user_id"),
          email,
          source: displayName(b),
        },
      });
      recordAction("removal_requested", keyOf(b));
      track("RemovalRequested");
      gaEvent("removal_requested", { source: keyOf(b) });
    } catch {
      /* best-effort — the person can try again from the same sheet */
    }
    setRequesting(false);
    setSheet(null);
  };

  const companies = useMemo(() => {
    const breaches = (scanResult?.hibp?.breaches ?? []) as Breach[];
    return recognisableCompanies(breaches);
  }, [scanResult]);

  const isClosed = (b: Breach) => closed.has(keyOf(b)) || hasAction("account_closed", keyOf(b));

  const markKept = (b: Breach) => {
    const next = new Set(kept);
    next.add(keyOf(b));
    setKept(next);
    writeKept(next);
  };

  const markClosed = (b: Breach) => {
    const k = keyOf(b);
    recordAction("account_closed", k);
    setClosed(new Set([...closed, k]));
    setSheet(null);
    track("AccountClosed");
    gaEvent("account_closed", { service: k });
  };

  const undoClosed = (b: Breach) => {
    const k = keyOf(b);
    undoAction("account_closed", k);
    const next = new Set(closed);
    next.delete(k);
    setClosed(next);
  };

  const pending = companies.filter((b) => !kept.has(keyOf(b)) && !isClosed(b));
  const decided = companies.filter((b) => kept.has(keyOf(b)) || isClosed(b));

  if (!scanResult) {
    return (
      <div className="px-5 py-10 text-center">
        <p className="text-[14px] font-semibold text-foreground">Nenhuma verificação ainda</p>
        <p className="mx-auto mt-1.5 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
          As contas ligadas ao seu e-mail aparecem depois do primeiro scan.
        </p>
        <button
          onClick={openScan}
          className="mt-4 rounded-full px-5 py-2.5 text-[13.5px] font-bold text-white"
          style={{ background: "linear-gradient(135deg,#4F46E5,#6366F1)" }}
        >
          Fazer scan grátis
        </button>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="px-5 py-10 text-center">
        <p className="text-[14px] font-semibold text-foreground">Nenhuma conta identificada</p>
        <p className="mx-auto mt-1.5 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
          Não encontramos serviços reconhecíveis ligados ao seu e-mail. Isso é uma boa notícia.
        </p>
      </div>
    );
  }

  return (
    <>
      <p className="px-5 pt-4 text-[12.5px] leading-relaxed text-muted-foreground">
        Estes serviços têm seu e-mail cadastrado. Cada conta que você não usa mais é um lugar a
        menos de onde seus dados podem vazar de novo.
      </p>

      {pending.length > 0 && (
        <div className="mt-4 space-y-2 px-5">
          {pending.map((b) => (
            <div key={keyOf(b)} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <Logo b={b} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14.5px] font-semibold text-foreground">
                    {displayName(b)}
                  </p>
                  {b.Domain && (
                    <p className="truncate text-[12px] text-muted-foreground">{b.Domain}</p>
                  )}
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => markKept(b)}
                  className="flex-1 rounded-xl border border-border py-2.5 text-[13px] font-semibold text-foreground transition active:scale-[0.99]"
                >
                  Ainda uso
                </button>
                <button
                  onClick={() => setSheet(b)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-bold text-white transition active:scale-[0.99]"
                  style={{ background: "linear-gradient(135deg,#4F46E5,#6366F1)" }}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Quero excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {decided.length > 0 && (
        <div className="mt-6 px-5">
          <p className="mb-2 text-[11.5px] font-semibold uppercase tracking-wide text-muted-foreground">
            Já decididas
          </p>
          <div className="space-y-1.5">
            {decided.map((b) => {
              const done = isClosed(b);
              return (
                <div
                  key={keyOf(b)}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3"
                >
                  <Logo b={b} />
                  <span className="min-w-0 flex-1 truncate text-[14px] text-foreground">
                    {displayName(b)}
                  </span>
                  {done ? (
                    <button
                      onClick={() => undoClosed(b)}
                      className="shrink-0 text-[11.5px] font-semibold"
                      style={{ color: "var(--color-success)" }}
                    >
                      Excluída · desfazer
                    </button>
                  ) : (
                    <span className="shrink-0 text-[11.5px] text-muted-foreground">Em uso</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {sheet && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setSheet(null)}
          role="presentation"
        >
          <div
            className="w-full max-w-md rounded-t-3xl border border-border bg-card p-6 pb-8 sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={`Excluir conta em ${displayName(sheet)}`}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <Logo b={sheet} />
                <div>
                  <p className="text-[16px] font-bold text-foreground">{displayName(sheet)}</p>
                  <p className="text-[12px] text-muted-foreground">{sheet.Domain}</p>
                </div>
              </div>
              <button
                onClick={() => setSheet(null)}
                aria-label="Fechar"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Said plainly: we open the door, the person walks through it. */}
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              A exclusão precisa ser feita na conta do próprio serviço — só você tem acesso a ela.
              Abaixo estão os caminhos.
            </p>

            <div className="mt-4 space-y-2">
              {sheet.Domain && (
                <a
                  href={`https://${sheet.Domain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-3 text-[14px] font-semibold text-foreground transition active:scale-[0.99]"
                >
                  <ExternalLink className="h-4 w-4" /> Abrir {sheet.Domain}
                </a>
              )}
              <a
                href={`https://www.google.com/search?q=${encodeURIComponent(`como excluir conta ${displayName(sheet)}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-3 text-[14px] font-semibold text-foreground transition active:scale-[0.99]"
              >
                <Search className="h-4 w-4" /> Como excluir a conta
              </a>

              {/* For a subscriber this is a real request: it goes on their case
                  and notifies the team that sends the letter. For everyone else
                  it is the offer. Either way the copy promises only what
                  happens — we ask, the company answers or does not. */}
              <button
                onClick={() =>
                  isPremium ? requestRemoval(sheet) : (setSheet(null), openPaywall())
                }
                disabled={requesting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-[14px] font-bold text-white transition active:scale-[0.99] disabled:opacity-60"
                style={{ background: "linear-gradient(135deg,#4F46E5,#6366F1)" }}
              >
                <ShieldCheck className="h-4 w-4" />
                {requesting
                  ? "Enviando..."
                  : isPremium
                    ? "Pedir remoção dos meus dados"
                    : "A Priva pede a remoção por você"}
              </button>

              <button
                onClick={() => markClosed(sheet)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border py-3 text-[14px] font-bold transition active:scale-[0.99]"
                style={{ borderColor: "var(--color-success)", color: "var(--color-success)" }}
              >
                <Check className="h-4 w-4" /> Já excluí esta conta
              </button>
            </div>

            <p className="mt-3 text-center text-[11.5px] text-muted-foreground">
              Marcar como excluída aumenta seu score. Você pode desfazer depois.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
