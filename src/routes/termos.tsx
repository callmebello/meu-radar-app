import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/termos")({
  head: () => ({
    meta: [{ title: "Termos de Uso — Priva" }],
  }),
  component: Termos,
});

const SECTIONS: { title: string; body: string }[] = [
  {
    title: "1. SERVIÇO",
    body: "O Priva oferece verificação e monitoramento de exposição de dados pessoais em bases públicas e de vazamentos conhecidos. Os resultados são informativos e podem não ser completos.",
  },
  {
    title: "2. ASSINATURA",
    body: "O serviço é cobrado mensalmente via Mercado Pago. Você pode cancelar a qualquer momento sem multa ou fidelidade.",
  },
  {
    title: "3. DADOS PESSOAIS",
    body: "Coletamos CPF e e-mail apenas para realizar a verificação. Não vendemos seus dados. Tratamento conforme a LGPD (Lei 13.709/2018).",
  },
  {
    title: "4. LIMITAÇÃO DE RESPONSABILIDADE",
    body: "O Priva não garante resultado específico na remoção de dados. Atuamos como facilitador do processo via LGPD.",
  },
  {
    title: "5. PROPRIEDADE INTELECTUAL",
    body: "A marca Priva, logo e conteúdo são propriedade exclusiva do serviço.",
  },
  {
    title: "6. ALTERAÇÕES",
    body: "Podemos atualizar estes termos. Notificaremos por e-mail em caso de mudanças relevantes.",
  },
  {
    title: "7. LEI APLICÁVEL",
    body: "Brasil. Foro eleito: São Paulo, SP.",
  },
];

function Termos() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-2xl px-5 py-10">
        <h1 className="text-2xl font-extrabold">Termos de Uso — Priva</h1>
        <p className="mt-1 text-sm text-muted-foreground">Última atualização: junho 2025</p>

        <p className="mt-6 text-sm font-semibold">
          AO USAR O PRIVA VOCÊ CONCORDA COM ESTES TERMOS.
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

        <div className="mt-6 flex flex-col gap-2 border-t border-border/60 pt-5">
          <a
            href="https://www.iubenda.com/privacy-policy/23107752"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary hover:underline"
          >
            Política de Privacidade
          </a>
          <a
            href="https://www.iubenda.com/privacy-policy/23107752/cookie-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary hover:underline"
          >
            Política de Cookies
          </a>
        </div>
      </div>
    </div>
  );
}
