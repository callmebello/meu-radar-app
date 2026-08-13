import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "@/components/inicio/Hero";
import { HowItWorks, Product, Security } from "@/components/inicio/Explain";
import { MobileApp, Pricing } from "@/components/inicio/Convert";
import { Faq, FinalCta, SiteFooter } from "@/components/inicio/Close";
import { Contact, ForCompanies } from "@/components/inicio/Contact";
import { LP } from "@/components/inicio/theme";

export const Route = createFileRoute("/inicio")({
  head: () => ({
    meta: [
      { title: "Priva — Seus dados. Sob seu controle." },
      {
        name: "description",
        content:
          "Descubra onde seus dados estão expostos e proteja sua privacidade online com a Priva. Verificação gratuita, monitoramento contínuo e conformidade com a LGPD.",
      },
      { property: "og:title", content: "Priva — Seus dados. Sob seu controle." },
      {
        property: "og:description",
        content: "Descubra onde seus dados estão expostos e proteja sua privacidade online.",
      },
    ],
  }),
  component: Inicio,
});

/**
 * Institutional landing page (privaapp.com.br/inicio).
 *
 * Standalone by design: it does not mount AppProvider, the in-app shell or the
 * pre-scan quiz, and it uses its own literal palette rather than the app's theme
 * tokens so it renders identically for every visitor. All conversion paths lead
 * to "/" — the existing scan funnel.
 */
function Inicio() {
  return (
    <div className="lp-root" style={{ backgroundColor: LP.bgLight }}>
      <Hero />
      <HowItWorks />
      <Product />
      <Security />
      <Pricing />
      <ForCompanies />
      <MobileApp />
      <Faq />
      <Contact />
      <FinalCta />
      <SiteFooter />
    </div>
  );
}
