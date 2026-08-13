import { Building2, Users, ShieldCheck } from "lucide-react";
import { useContactDialog } from "./contact-context";
import { Container, Eyebrow, Reveal, SectionTitle } from "./ui";
import { LP } from "./theme";

/* ── PARA EMPRESAS ────────────────────────────────────────────────── */

const COMPANY_POINTS = [
  {
    Icon: Users,
    title: "Proteção para o time",
    text: "Verificação e monitoramento de exposição para os colaboradores da sua empresa.",
  },
  {
    Icon: ShieldCheck,
    title: "Apoio à conformidade",
    text: "Relatórios que ajudam a demonstrar cuidado com dados pessoais nos seus processos de LGPD.",
  },
  {
    Icon: Building2,
    title: "Condições por volume",
    text: "Planos e condições ajustados ao tamanho da equipe, com um contato direto para falar com a gente.",
  },
];

export function ForCompanies() {
  const contact = useContactDialog();
  return (
    <section id="empresas" className="py-20 sm:py-24" style={{ backgroundColor: "#FFFFFF" }}>
      <Container>
        <Reveal>
          <Eyebrow>Para empresas</Eyebrow>
          <SectionTitle className="mt-3">Privacidade também é assunto corporativo</SectionTitle>
          <p
            className="mx-auto mt-4 max-w-[38rem] text-center text-[15px] leading-relaxed"
            style={{ color: LP.muted }}
          >
            Dados vazados de colaboradores viram porta de entrada para fraude e engenharia social.
            Fale com a gente para avaliar o que faz sentido para a sua equipe.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {COMPANY_POINTS.map((c, i) => (
            <Reveal key={c.title} delay={i * 90}>
              <div
                className="h-full rounded-2xl bg-white p-6"
                style={{
                  border: "1px solid rgba(17,17,26,0.08)",
                  boxShadow: "0 6px 22px rgba(15,15,40,0.05)",
                }}
              >
                <span
                  className="grid h-11 w-11 place-items-center rounded-xl"
                  style={{ backgroundColor: "rgba(99,102,241,0.1)" }}
                >
                  <c.Icon className="h-5 w-5" strokeWidth={1.7} style={{ color: LP.indigo }} />
                </span>
                <h3 className="mt-4 text-[16px] font-bold" style={{ color: LP.text }}>
                  {c.title}
                </h3>
                <p className="mt-2 text-[14px] leading-relaxed" style={{ color: LP.muted }}>
                  {c.text}
                </p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal delay={120}>
          <div className="mt-10 text-center">
            <button
              type="button"
              onClick={contact.open}
              className="lp-cta inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-4 text-[15px] font-bold text-white"
              style={{ background: `linear-gradient(135deg, ${LP.violet}, ${LP.indigo})` }}
            >
              Falar com a Priva
            </button>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
