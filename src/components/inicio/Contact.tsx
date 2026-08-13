import { useState } from "react";
import { Building2, Check, Loader2, Send, Users, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { sendContactMessage } from "@/lib/api/contact.functions";
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
            <a
              href="#contato"
              className="lp-cta inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-4 text-[15px] font-bold text-white"
              style={{ background: `linear-gradient(135deg, ${LP.violet}, ${LP.indigo})` }}
            >
              Falar com a Priva
            </a>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}

/* ── CONTATO ──────────────────────────────────────────────────────── */

const field =
  "w-full rounded-xl bg-white px-4 py-3 text-[14px] outline-none transition-colors placeholder:text-[#A0A0AE] focus:border-indigo-500";
const fieldStyle = { border: "1px solid rgba(17,17,26,0.12)", color: LP.text };

export function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const set =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const valid =
    form.name.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) &&
    form.message.trim().length >= 5;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || sending) return;
    setSending(true);
    try {
      const res = await sendContactMessage({
        data: {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          company: form.company.trim() || undefined,
          message: form.message.trim(),
        },
      });
      if (res.ok) {
        setSent(true);
      } else {
        // Never claim it was sent when SMTP is not configured or refused it.
        toast.error("Não conseguimos enviar agora. Escreva para contato@privaapp.com.br.");
      }
    } catch {
      toast.error("Não conseguimos enviar agora. Escreva para contato@privaapp.com.br.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="contato" className="py-20 sm:py-24" style={{ backgroundColor: LP.bgLight }}>
      <Container>
        <Reveal>
          <Eyebrow>Contato</Eyebrow>
          <SectionTitle className="mt-3">Fale com a gente</SectionTitle>
          <p
            className="mx-auto mt-4 max-w-[34rem] text-center text-[15px] leading-relaxed"
            style={{ color: LP.muted }}
          >
            Dúvidas sobre os planos, privacidade ou uso na sua empresa? Deixe sua mensagem que
            respondemos no seu e-mail.
          </p>
        </Reveal>

        <Reveal delay={100}>
          <div
            className="mx-auto mt-10 max-w-[640px] rounded-3xl bg-white p-7 sm:p-9"
            style={{
              border: "1px solid rgba(17,17,26,0.08)",
              boxShadow: "0 10px 36px rgba(15,15,40,0.06)",
            }}
          >
            {sent ? (
              <div className="py-8 text-center">
                <span
                  className="mx-auto grid h-14 w-14 place-items-center rounded-full"
                  style={{ backgroundColor: "rgba(15,169,104,0.12)" }}
                >
                  <Check className="h-7 w-7" strokeWidth={2.4} style={{ color: LP.green }} />
                </span>
                <h3 className="mt-5 text-[20px] font-bold" style={{ color: LP.text }}>
                  Mensagem enviada
                </h3>
                <p className="mt-2 text-[14px]" style={{ color: LP.muted }}>
                  Recebemos seu contato e respondemos em {form.email}.
                </p>
              </div>
            ) : (
              <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    className="mb-1.5 block text-[13px] font-semibold"
                    style={{ color: LP.text }}
                  >
                    Nome
                  </label>
                  <input
                    value={form.name}
                    onChange={set("name")}
                    placeholder="Seu nome"
                    className={field}
                    style={fieldStyle}
                    required
                  />
                </div>
                <div>
                  <label
                    className="mb-1.5 block text-[13px] font-semibold"
                    style={{ color: LP.text }}
                  >
                    E-mail
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={set("email")}
                    placeholder="seu@email.com"
                    className={field}
                    style={fieldStyle}
                    required
                  />
                </div>
                <div>
                  <label
                    className="mb-1.5 block text-[13px] font-semibold"
                    style={{ color: LP.text }}
                  >
                    Telefone
                  </label>
                  <input
                    value={form.phone}
                    onChange={set("phone")}
                    inputMode="tel"
                    placeholder="(00) 00000-0000"
                    className={field}
                    style={fieldStyle}
                  />
                </div>
                <div>
                  <label
                    className="mb-1.5 block text-[13px] font-semibold"
                    style={{ color: LP.text }}
                  >
                    Empresa <span style={{ color: LP.muted }}>(opcional)</span>
                  </label>
                  <input
                    value={form.company}
                    onChange={set("company")}
                    placeholder="Nome da empresa"
                    className={field}
                    style={fieldStyle}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label
                    className="mb-1.5 block text-[13px] font-semibold"
                    style={{ color: LP.text }}
                  >
                    Mensagem
                  </label>
                  <textarea
                    value={form.message}
                    onChange={set("message")}
                    rows={5}
                    placeholder="Como podemos ajudar?"
                    className={`${field} resize-none`}
                    style={fieldStyle}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={!valid || sending}
                  className="lp-cta mt-1 flex items-center justify-center gap-2 rounded-2xl py-4 text-[15px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-40 sm:col-span-2"
                  style={{ background: `linear-gradient(135deg, ${LP.violet}, ${LP.indigo})` }}
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Enviando...
                    </>
                  ) : (
                    <>
                      Enviar mensagem <Send className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
