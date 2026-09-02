import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Link2,
  Clipboard,
  ArrowRight,
  Lock,
} from "lucide-react";
import { analyzeLink, type LinkResult } from "@/lib/security/link";
import { track, gaEvent } from "@/lib/analytics";

/**
 * Public link checker — no account, no limit, no cost.
 *
 * The analysis engine already existed inside the app, behind login and behind
 * the free-check quota. It runs entirely in the browser (see lib/security/link),
 * so serving it to anonymous traffic costs nothing at all — which makes it the
 * one tool that can be given away without a ceiling.
 *
 * That is the whole point: it is the acquisition door. Someone arrives with a
 * suspicious link, gets a real answer with no signup, and only then is asked
 * the question that leads into the product — "and your own data?".
 */
export const Route = createFileRoute("/verificar-link")({
  head: () => ({
    meta: [
      { title: "Verificar link suspeito — é golpe? | Priva" },
      {
        name: "description",
        content:
          "Cole um link e descubra em segundos se ele tem sinais de golpe: domínio imitando banco, encurtador, endereço disfarçado. Grátis e sem cadastro.",
      },
    ],
  }),
  component: VerificarLink,
});

const LEVEL_UI = {
  seguro: {
    label: "Não encontramos sinais de golpe",
    color: "#0FA968",
    bg: "rgba(15,169,104,0.10)",
    Icon: ShieldCheck,
  },
  atencao: {
    label: "Atenção — verifique antes de continuar",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.10)",
    Icon: ShieldAlert,
  },
  alto: {
    label: "Alto risco — não recomendamos abrir",
    color: "#DC2626",
    bg: "rgba(220,38,38,0.10)",
    Icon: ShieldX,
  },
} as const;

const SIGNAL_COLOR = { ok: "#0FA968", warn: "#F59E0B", danger: "#DC2626" } as const;

function VerificarLink() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<LinkResult | null>(null);

  const run = () => {
    const value = input.trim();
    if (!value) return;
    const r = analyzeLink(value);
    setResult(r);
    track("ViewContent", { content_name: "verificar_link" });
    gaEvent("link_checked", { level: r.level });
  };

  const paste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setInput(text);
    } catch {
      /* clipboard blocked — the person can paste by hand */
    }
  };

  const ui = result ? LEVEL_UI[result.level] : null;

  return (
    <main className="mx-auto min-h-screen w-full max-w-lg px-5 pb-16 pt-10">
      <div className="flex flex-col items-center text-center">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[var(--color-navy)]/10">
          <Link2 className="h-5 w-5 text-[var(--color-navy)]" />
        </span>
        <h1 className="mt-4 text-[26px] font-extrabold leading-tight text-foreground">
          Esse link é golpe?
        </h1>
        <p className="mt-2 max-w-sm text-[14px] leading-relaxed text-muted-foreground">
          Cole o endereço abaixo. A análise roda no seu próprio aparelho — o link não é enviado para
          lugar nenhum.
        </p>
      </div>

      <div className="mt-6">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              run();
            }
          }}
          rows={3}
          placeholder="Cole o link aqui (ex: site.com/promocao)"
          className="w-full resize-none rounded-2xl border border-border bg-card px-4 py-3 text-[14px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-indigo-500"
        />
        <div className="mt-2 flex gap-2">
          <button
            onClick={paste}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-border px-4 py-3 text-[13.5px] font-semibold text-foreground transition active:scale-[0.99]"
          >
            <Clipboard className="h-4 w-4" /> Colar
          </button>
          <button
            onClick={run}
            className="flex-1 rounded-xl py-3 text-[14.5px] font-bold text-white transition active:scale-[0.99]"
            style={{ background: "linear-gradient(135deg,#4F46E5,#6366F1)" }}
          >
            Verificar
          </button>
        </div>
      </div>

      {result && ui && (
        <section className="mt-6">
          <div
            className="rounded-2xl p-5"
            style={{ backgroundColor: ui.bg, border: `1px solid ${ui.color}33` }}
          >
            <div className="flex items-start gap-3">
              <ui.Icon className="mt-0.5 h-6 w-6 shrink-0" style={{ color: ui.color }} />
              <div className="min-w-0">
                <p className="text-[15.5px] font-bold" style={{ color: ui.color }}>
                  {ui.label}
                </p>
                {result.host && (
                  <p className="mt-0.5 break-all text-[12.5px] text-muted-foreground">
                    {result.host}
                  </p>
                )}
              </div>
            </div>
          </div>

          {result.signals.length > 0 && (
            <ul className="mt-3 overflow-hidden rounded-2xl border border-border">
              {result.signals.map((s) => (
                <li
                  key={s.label}
                  className="flex items-start gap-3 border-b border-border bg-card px-4 py-3 last:border-b-0"
                >
                  <span
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: SIGNAL_COLOR[s.level] }}
                  />
                  <span className="min-w-0">
                    <span className="block text-[13.5px] font-medium leading-snug text-foreground">
                      {s.label}
                    </span>
                    {s.detail && (
                      <span className="mt-0.5 block text-[12px] leading-relaxed text-muted-foreground">
                        {s.detail}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {/* What this check cannot tell you. A tool that overstates itself once
              is never trusted again, and this one is the first contact many
              people will have with the brand. */}
          <p className="mt-3 text-[11.5px] leading-relaxed text-muted-foreground">
            Analisamos a estrutura do endereço — domínio, subdomínios, encurtadores e caracteres
            disfarçados. Um link sem sinais não é garantia de segurança: nunca informe senha ou
            dados bancários em páginas que chegaram por mensagem.
          </p>

          {/* The door into the product, asked only after the answer is given. */}
          <div className="mt-6 rounded-2xl border border-border bg-card p-5 text-center">
            <p className="text-[15px] font-bold text-foreground">E os seus dados?</p>
            <p className="mx-auto mt-1.5 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
              Golpes começam com dados que já vazaram. Veja em segundos se o seu e-mail e CPF
              apareceram em vazamentos conhecidos.
            </p>
            <Link
              to="/"
              onClick={() => {
                track("Lead", { content_name: "verificar_link_cta" });
                gaEvent("link_checker_cta");
              }}
              className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-[14.5px] font-bold text-white transition active:scale-[0.99]"
              style={{ background: "linear-gradient(135deg,#4F46E5,#6366F1)" }}
            >
              Verificar meus dados grátis <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      )}

      <p className="mt-8 flex items-center justify-center gap-1.5 text-center text-[11.5px] text-muted-foreground">
        <Lock className="h-3 w-3" /> Nada do que você cola aqui é enviado ou armazenado
      </p>
    </main>
  );
}
