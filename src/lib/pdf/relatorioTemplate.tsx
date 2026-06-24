import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { PDF_COLORS as C, pdfRisk, type StoredScanResult } from "./types";

// Template-based "Relatório de Exposição Digital" (plano Essencial). No fonts
// registered → uses built-in Helvetica for robust serverless rendering.

const s = StyleSheet.create({
  page: { backgroundColor: C.navy, color: C.white, padding: 40, fontSize: 11, fontFamily: "Helvetica", lineHeight: 1.5 },
  brand: { fontSize: 22, fontFamily: "Helvetica-Bold", color: C.white, letterSpacing: 2 },
  brandDot: { color: C.indigoSoft },
  cover: { borderBottom: `2px solid ${C.indigo}`, paddingBottom: 18, marginBottom: 22 },
  h1: { fontSize: 20, fontFamily: "Helvetica-Bold", marginTop: 14, color: C.white },
  meta: { fontSize: 10, color: C.muted, marginTop: 6 },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 13, fontFamily: "Helvetica-Bold", color: C.indigoSoft, marginBottom: 8 },
  card: { backgroundColor: C.navyCard, border: `1px solid ${C.border}`, borderRadius: 8, padding: 14, marginBottom: 8 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between" },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryBig: { fontSize: 26, fontFamily: "Helvetica-Bold", color: C.white },
  summaryLabel: { fontSize: 8, color: C.muted, marginTop: 4, textAlign: "center" },
  badge: { fontSize: 16, fontFamily: "Helvetica-Bold" },
  breachName: { fontSize: 12, fontFamily: "Helvetica-Bold", color: C.white },
  breachMeta: { fontSize: 9, color: C.muted, marginTop: 2 },
  breachData: { fontSize: 9, color: C.amber, marginTop: 3 },
  clean: { fontSize: 11, color: C.green },
  bullet: { flexDirection: "row", marginBottom: 5 },
  bulletDot: { color: C.indigoSoft, marginRight: 6 },
  link: { fontSize: 9, color: C.indigoSoft },
  footer: { position: "absolute", bottom: 28, left: 40, right: 40, borderTop: `1px solid ${C.border}`, paddingTop: 10 },
  footerText: { fontSize: 7.5, color: C.muted, lineHeight: 1.4 },
});

function fmtDate(iso?: string): string {
  if (!iso) return "data não informada";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString("pt-BR");
}

const RECS = [
  "Troque imediatamente as senhas das contas envolvidas nos vazamentos.",
  "Ative a verificação em duas etapas (2FA) em todos os serviços importantes.",
  "Nunca reutilize a mesma senha em sites diferentes — use um gerenciador de senhas.",
  "Desconfie de e-mails, SMS e ligações pedindo dados ou códigos de verificação.",
  "Monitore extratos bancários e o seu CPF periodicamente.",
];

export type RelatorioProps = {
  name: string;
  email: string;
  scanDate?: string;
  result: StoredScanResult;
};

export function buildRelatorioDocument(p: RelatorioProps) {
  const breaches = p.result.hibp?.breaches ?? [];
  const breachCount = p.result.hibp?.count ?? p.result.breachCount ?? breaches.length;
  const score = typeof p.result.score === "number" ? p.result.score : Math.max(20, 70 - breachCount * 8);
  const risk = pdfRisk(breachCount);

  const ex = p.result.exposure;
  const ghRepos = ex?.github?.repos ?? [];
  const cpfSources = ex?.cpf?.sources ?? [];
  const phoneSources = ex?.phone?.sources ?? [];
  const publicHits = ghRepos.length + cpfSources.length + phoneSources.length;
  const sourcesChecked = ["HIBP (e-mail)", "SerpAPI (web pública)", "GitHub (código público)"];

  return (
    <Document title="Relatório de Exposição Digital — Priva" author="Priva">
      <Page size="A4" style={s.page}>
        {/* Cover */}
        <View style={s.cover}>
          <Text style={s.brand}>
            PRIVA<Text style={s.brandDot}>.</Text>
          </Text>
          <Text style={s.h1}>Relatório de Exposição Digital</Text>
          <Text style={s.meta}>Titular: {p.name || p.email || "—"}</Text>
          <Text style={s.meta}>Gerado em: {fmtDate(p.scanDate || new Date().toISOString())}</Text>
        </View>

        {/* Summary */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Resumo da análise</Text>
          <View style={s.card}>
            <View style={s.summaryRow}>
              <View style={s.summaryItem}>
                <Text style={s.summaryBig}>{score}</Text>
                <Text style={s.summaryLabel}>Score de exposição (0–100)</Text>
              </View>
              <View style={s.summaryItem}>
                <Text style={[s.badge, { color: risk.color }]}>{risk.label}</Text>
                <Text style={s.summaryLabel}>Nível de risco</Text>
              </View>
              <View style={s.summaryItem}>
                <Text style={s.summaryBig}>{sourcesChecked.length}</Text>
                <Text style={s.summaryLabel}>Fontes verificadas</Text>
              </View>
            </View>
            <Text style={[s.breachMeta, { marginTop: 10 }]}>Fontes: {sourcesChecked.join(" · ")}.</Text>
          </View>
        </View>

        {/* E-mail / HIBP */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Vazamentos de e-mail ({breachCount})</Text>
          {breaches.length > 0 ? (
            breaches.slice(0, 12).map((b, i) => (
              <View key={i} style={s.card}>
                <Text style={s.breachName}>{b.name || "Vazamento"}</Text>
                <Text style={s.breachMeta}>Data do vazamento: {fmtDate(b.date)}</Text>
                {Array.isArray(b.dataClasses) && b.dataClasses.length > 0 && (
                  <Text style={s.breachData}>Dados expostos: {b.dataClasses.join(", ")}</Text>
                )}
              </View>
            ))
          ) : (
            <View style={s.card}>
              <Text style={s.clean}>Nenhum vazamento de e-mail encontrado nas bases consultadas.</Text>
            </View>
          )}
        </View>

        {/* CPF / Phone — public web + GitHub */}
        <View style={s.section} wrap={false}>
          <Text style={s.sectionTitle}>Exposição pública (CPF / telefone)</Text>
          {publicHits > 0 ? (
            <View style={s.card}>
              {[...ghRepos.map((r) => ({ title: r.repo || "Repositório público", link: r.url })),
                ...cpfSources.map((r) => ({ title: r.title || r.link, link: r.link })),
                ...phoneSources.map((r) => ({ title: r.title || r.link, link: r.link }))]
                .slice(0, 10)
                .map((r, i) => (
                  <View key={i} style={{ marginBottom: 6 }}>
                    <Text style={s.breachName}>{r.title}</Text>
                    <Text style={s.link}>{r.link}</Text>
                  </View>
                ))}
            </View>
          ) : (
            <View style={s.card}>
              <Text style={s.clean}>Nenhuma exposição pública direta encontrada.</Text>
            </View>
          )}
        </View>

        {/* Recommendations */}
        <View style={s.section} wrap={false}>
          <Text style={s.sectionTitle}>Recomendações</Text>
          <View style={s.card}>
            {RECS.map((r, i) => (
              <View key={i} style={s.bullet}>
                <Text style={s.bulletDot}>•</Text>
                <Text style={{ flex: 1 }}>{r}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            Este relatório é gerado automaticamente pela Priva com base em fontes públicas e em serviços de verificação de
            vazamentos (Have I Been Pwned, busca web e GitHub) na data de geração. Tem caráter informativo e não constitui
            aconselhamento jurídico. Política de Privacidade: https://www.privaapp.com.br · contato@privaapp.com.br
          </Text>
        </View>
      </Page>
    </Document>
  );
}
