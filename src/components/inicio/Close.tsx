import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, Instagram, Linkedin, Lock, Mail } from "lucide-react";
import { Container, Eyebrow, PrivaWordmark, Reveal, ScanCta, SectionTitle } from "./ui";
import { LP, SCAN_HREF } from "./theme";

/* ── 8. FAQ ───────────────────────────────────────────────────────── */

/**
 * Answers are written to match what the product actually does: the CPF is
 * stored only as a salted hash (see saveUser), removal is a best-effort LGPD
 * request rather than a guarantee, and monitoring covers known breach sources.
 */
const FAQ = [
  {
    q: "A Priva armazena meus dados?",
    a: "Seu CPF nunca é guardado como você digita: ele é convertido em um código irreversível usado apenas para comparar com bases de vazamento. Guardamos seu e-mail para enviar o resultado e os alertas de monitoramento.",
  },
  {
    q: "Vocês vendem ou compartilham meus dados com terceiros?",
    a: "Não. A Priva não comercializa nem compartilha seus dados para publicidade. Nosso negócio é a assinatura — o oposto do modelo dos data brokers.",
  },
  {
    q: "Quais tipos de dados vocês verificam?",
    a: "Verificamos se o seu e-mail e o seu CPF aparecem em vazamentos de dados conhecidos e em fontes públicas da internet, além de sinais associados a telefone e dados pessoais.",
  },
  {
    q: "Como funciona o monitoramento?",
    a: "Depois da primeira verificação, continuamos acompanhando as fontes que consultamos. Quando algo novo relacionado aos seus dados aparece, você recebe um alerta por e-mail.",
  },
  {
    q: "Vocês conseguem remover meus dados?",
    a: "Ajudamos você a solicitar a remoção junto às empresas que tratam seus dados, com base nos direitos que a LGPD garante. O prazo e a resposta dependem de cada empresa, por isso não prometemos remoção garantida.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim. A assinatura não tem fidelidade nem multa: você cancela quando quiser e mantém o acesso até o fim do período já pago.",
  },
  {
    q: "Como a Priva trata meus dados de acordo com a LGPD?",
    a: "Coletamos o mínimo necessário para executar a verificação, com a sua autorização, e seguimos a Lei 13.709/2018 em todos os processos. Você pode pedir acesso, correção ou exclusão dos seus dados a qualquer momento.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="overflow-hidden rounded-2xl bg-white"
      style={{ border: "1px solid rgba(17,17,26,0.09)" }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="text-[14.5px] font-semibold leading-snug" style={{ color: LP.text }}>
          {q}
        </span>
        <ChevronDown
          className="h-4 w-4 shrink-0 transition-transform duration-300"
          style={{ color: LP.muted, transform: open ? "rotate(180deg)" : "none" }}
        />
      </button>
      {/* Grid-rows trick: animates from 0 to content height without knowing it. */}
      <div
        className="grid transition-all duration-300 ease-out"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <p className="px-5 pb-5 text-[13.5px] leading-relaxed" style={{ color: LP.muted }}>
            {a}
          </p>
        </div>
      </div>
    </div>
  );
}

export function Faq() {
  const mid = Math.ceil(FAQ.length / 2);
  return (
    <section id="faq" className="py-20 sm:py-28" style={{ backgroundColor: LP.bgLight }}>
      <Container>
        <Reveal>
          <Eyebrow>Dúvidas frequentes</Eyebrow>
          <SectionTitle className="mt-3">Perguntas mais comuns</SectionTitle>
        </Reveal>
        <div className="mt-12 grid gap-4 lg:grid-cols-2 lg:gap-x-5">
          <div className="space-y-4">
            {FAQ.slice(0, mid).map((f, i) => (
              <Reveal key={f.q} delay={i * 60}>
                <FaqItem {...f} />
              </Reveal>
            ))}
          </div>
          <div className="space-y-4">
            {FAQ.slice(mid).map((f, i) => (
              <Reveal key={f.q} delay={i * 60}>
                <FaqItem {...f} />
              </Reveal>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ── 9. CTA FINAL ─────────────────────────────────────────────────── */

export function FinalCta() {
  return (
    <section className="px-5 pb-16 pt-4 sm:px-8" style={{ backgroundColor: LP.bgLight }}>
      <Reveal>
        <div
          className="relative mx-auto max-w-[1200px] overflow-hidden rounded-3xl px-7 py-12 sm:px-14 sm:py-16"
          style={{
            background: `linear-gradient(120deg, ${LP.dark} 0%, #16123A 55%, #1E1650 100%)`,
          }}
        >
          <span
            className="pointer-events-none absolute -left-10 top-1/2 h-64 w-64 -translate-y-1/2 rounded-full"
            style={{ backgroundColor: LP.violet, opacity: 0.28, filter: "blur(70px)" }}
            aria-hidden="true"
          />

          <div className="relative flex flex-col items-start gap-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-6">
              <span
                className="hidden h-24 w-24 shrink-0 place-items-center rounded-3xl sm:grid"
                style={{
                  backgroundColor: "rgba(139,124,255,0.12)",
                  border: "1px solid rgba(139,124,255,0.25)",
                }}
              >
                <Lock className="h-10 w-10" strokeWidth={1.3} style={{ color: LP.lilac }} />
              </span>
              <div>
                <h2 className="text-[26px] font-bold leading-[1.15] tracking-tight text-white sm:text-[34px]">
                  Descubra o que a internet
                  <br className="hidden sm:block" /> sabe sobre você.
                </h2>
                <p className="mt-3 max-w-[26rem] text-[14.5px] leading-relaxed text-white/65">
                  Faça sua primeira verificação e dê o primeiro passo para proteger sua privacidade.
                </p>
              </div>
            </div>

            <div className="w-full shrink-0 lg:w-auto">
              <ScanCta size="lg" className="w-full lg:w-auto" />
              <p className="mt-3 text-center text-[12.5px] text-white/55 lg:text-right">
                Leva menos de 1 minuto • Seguro e confidencial
              </p>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ── 10. FOOTER ───────────────────────────────────────────────────── */

const FOOTER_LINKS: { label: string; to?: string; href?: string }[] = [
  { label: "Como funciona", href: "#como-funciona" },
  { label: "Planos", href: "#planos" },
  { label: "Conteúdos", href: "#faq" },
  { label: "Privacidade", href: "https://www.iubenda.com/privacy-policy/23107752" },
  { label: "Termos", to: "/termos" },
  { label: "Contato", href: "mailto:contato@privaapp.com.br" },
];

export function SiteFooter() {
  return (
    <footer style={{ backgroundColor: "#FFFFFF", borderTop: "1px solid rgba(17,17,26,0.08)" }}>
      <Container className="flex flex-col gap-8 py-10 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <PrivaWordmark />
          <p className="mt-2 text-[13px]" style={{ color: LP.muted }}>
            Sua privacidade em primeiro lugar.
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-2">
          {FOOTER_LINKS.map((l) =>
            l.to ? (
              <Link
                key={l.label}
                to={l.to}
                className="text-[13px] transition-colors hover:opacity-70"
                style={{ color: LP.muted }}
              >
                {l.label}
              </Link>
            ) : (
              <a
                key={l.label}
                href={l.href}
                target={l.href?.startsWith("#") ? undefined : "_blank"}
                rel="noopener noreferrer"
                className="text-[13px] transition-colors hover:opacity-70"
                style={{ color: LP.muted }}
              >
                {l.label}
              </a>
            ),
          )}
        </nav>

        <div className="flex items-center gap-3">
          {[
            { Icon: Instagram, href: "https://instagram.com", label: "Instagram" },
            { Icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
            { Icon: Mail, href: "mailto:contato@privaapp.com.br", label: "E-mail" },
          ].map((s) => (
            <a
              key={s.label}
              href={s.href}
              aria-label={s.label}
              target="_blank"
              rel="noopener noreferrer"
              className="grid h-9 w-9 place-items-center rounded-full transition-colors"
              style={{ backgroundColor: "#F1F1F6", color: LP.muted }}
            >
              <s.Icon className="h-4 w-4" strokeWidth={1.7} />
            </a>
          ))}
        </div>
      </Container>

      <div style={{ borderTop: "1px solid rgba(17,17,26,0.07)" }}>
        <Container className="flex flex-col items-center justify-between gap-2 py-5 sm:flex-row">
          <p className="text-[12px]" style={{ color: LP.muted }}>
            © {new Date().getFullYear()} Priva. Todos os direitos reservados.
          </p>
          <Link to={SCAN_HREF} className="text-[12px] font-semibold" style={{ color: LP.indigo }}>
            Verificar meus dados grátis
          </Link>
        </Container>
      </div>
    </footer>
  );
}
