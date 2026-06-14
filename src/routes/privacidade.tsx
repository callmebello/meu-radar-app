import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [{ title: "Política de Privacidade — Priva" }],
  }),
  component: Privacidade,
});

const SECTIONS: { title: string; body: string }[] = [
  {
    title: "1. DADOS QUE COLETAMOS",
    body: "Coletamos CPF e e-mail apenas para realizar a verificação de exposição de dados. Não solicitamos senhas nem dados bancários.",
  },
  {
    title: "2. COMO USAMOS SEUS DADOS",
    body: "Seus dados são usados exclusivamente para consultar bases públicas e de vazamentos conhecidos e para enviar seu relatório e alertas. Não vendemos nem compartilhamos seus dados com terceiros para fins de marketing.",
  },
  {
    title: "3. BASE LEGAL (LGPD)",
    body: "O tratamento dos seus dados segue a Lei 13.709/2018 (LGPD), com base no seu consentimento e no legítimo interesse de protegê-lo contra fraudes e vazamentos.",
  },
  {
    title: "4. ARMAZENAMENTO E SEGURANÇA",
    body: "Os dados são transmitidos de forma criptografada e armazenados apenas pelo tempo necessário para prestar o serviço.",
  },
  {
    title: "5. SEUS DIREITOS",
    body: "Você pode solicitar a qualquer momento o acesso, a correção ou a exclusão dos seus dados, bem como revogar o consentimento, entrando em contato pelo e-mail abaixo.",
  },
  {
    title: "6. COMPARTILHAMENTO",
    body: "Pagamentos são processados pelo Mercado Pago. Não temos acesso aos dados completos do seu cartão.",
  },
  {
    title: "7. ALTERAÇÕES",
    body: "Podemos atualizar esta política. Notificaremos por e-mail em caso de mudanças relevantes.",
  },
  {
    title: "8. LEI APLICÁVEL",
    body: "Brasil. Foro eleito: São Paulo, SP.",
  },
];

function Privacidade() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-5 py-10">
        <h1 className="text-2xl font-extrabold">Política de Privacidade — Priva</h1>
        <p className="mt-1 text-sm text-muted-foreground">Última atualização: junho 2025</p>

        <p className="mt-6 text-sm font-semibold">
          SUA PRIVACIDADE É O CENTRO DO PRIVA. ESTA POLÍTICA EXPLICA COMO TRATAMOS SEUS DADOS.
        </p>

        <div className="mt-6 space-y-5">
          {SECTIONS.map((s) => (
            <section key={s.title}>
              <h2 className="text-sm font-bold">{s.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-8 border-t border-border/60 pt-5">
          <h2 className="text-sm font-bold">CONTATO</h2>
          <p className="mt-1 text-sm text-muted-foreground">contato@privaapp.com.br</p>
          <p className="text-sm text-muted-foreground">privaapp.com.br</p>
        </div>
      </div>
    </div>
  );
}
