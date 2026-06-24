import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";

// "Solicitação de Eliminação de Dados Pessoais" (carta LGPD — plano Proteção
// Total). Light/formal layout suitable to forward to a data controller.

const s = StyleSheet.create({
  page: { backgroundColor: "#FFFFFF", color: "#111118", padding: 48, fontSize: 11, fontFamily: "Helvetica", lineHeight: 1.6 },
  brand: { fontSize: 16, fontFamily: "Helvetica-Bold", letterSpacing: 2, color: "#4F46E5" },
  brandLine: { borderBottom: "2px solid #4F46E5", paddingBottom: 12, marginBottom: 22, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  date: { fontSize: 10, color: "#555" },
  h1: { fontSize: 15, fontFamily: "Helvetica-Bold", marginBottom: 16, color: "#111118" },
  label: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#4F46E5", marginTop: 14, marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 },
  p: { marginBottom: 8, textAlign: "justify" },
  field: { fontSize: 11, marginBottom: 2 },
  fieldKey: { fontFamily: "Helvetica-Bold" },
  source: { fontSize: 10, color: "#1d4ed8" },
  box: { backgroundColor: "#F4F4FA", border: "1px solid #E2E2EF", borderRadius: 6, padding: 12, marginTop: 4 },
  closing: { marginTop: 22, fontSize: 10, color: "#444" },
  sign: { marginTop: 30, fontSize: 11, fontFamily: "Helvetica-Bold" },
  footer: { position: "absolute", bottom: 30, left: 48, right: 48, borderTop: "1px solid #E2E2EF", paddingTop: 8 },
  footerText: { fontSize: 7.5, color: "#888", lineHeight: 1.4 },
});

function fmtDate(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

export type CartaLgpdProps = {
  fullName: string;
  cpfLast2?: string;
  email: string;
  sourceUrl?: string | null;
  authorizedAt?: string;
};

export function buildCartaLgpdDocument(p: CartaLgpdProps) {
  const cpfMasked = `***.***.***-${(p.cpfLast2 || "**").padStart(2, "*")}`;
  const today = fmtDate();
  const source = p.sourceUrl || "Fonte identificada no relatório de exposição do titular";

  return (
    <Document title="Solicitação de Eliminação de Dados Pessoais" author="Priva">
      <Page size="A4" style={s.page}>
        <View style={s.brandLine}>
          <Text style={s.brand}>PRIVA</Text>
          <Text style={s.date}>{today}</Text>
        </View>

        <Text style={s.h1}>Solicitação de Eliminação de Dados Pessoais</Text>

        <Text style={s.p}>
          Prezados(as), na qualidade de representante autorizada do titular dos dados abaixo identificado, a Priva
          encaminha a presente solicitação de eliminação de dados pessoais, com fundamento na Lei nº 13.709/2018 (Lei
          Geral de Proteção de Dados — LGPD).
        </Text>

        <Text style={s.label}>Identificação do titular</Text>
        <View style={s.box}>
          <Text style={s.field}>
            <Text style={s.fieldKey}>Nome completo: </Text>
            {p.fullName || "—"}
          </Text>
          <Text style={s.field}>
            <Text style={s.fieldKey}>CPF: </Text>
            {cpfMasked}
          </Text>
          <Text style={s.field}>
            <Text style={s.fieldKey}>E-mail: </Text>
            {p.email || "—"}
          </Text>
        </View>

        <Text style={s.label}>Base legal</Text>
        <Text style={s.p}>
          Nos termos do art. 18, incisos IV e VI, da Lei nº 13.709/2018 (LGPD), o titular tem o direito de obter, a
          qualquer momento e mediante requisição, a eliminação dos dados pessoais tratados com o seu consentimento, bem
          como a anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em
          desconformidade com a referida Lei.
        </Text>

        <Text style={s.label}>Fonte identificada</Text>
        <View style={s.box}>
          <Text style={s.source}>{source}</Text>
        </View>

        <Text style={s.label}>Prazo de resposta</Text>
        <Text style={s.p}>
          Solicitamos a confirmação da eliminação dos dados, ou justificativa fundamentada para a sua manutenção, no
          prazo de 15 (quinze) dias a contar do recebimento desta solicitação, conforme a boa prática regulatória
          aplicável às requisições de titulares previstas na LGPD.
        </Text>

        <Text style={s.closing}>
          Solicitação enviada por Priva em nome do titular, conforme autorização registrada em {fmtDate(p.authorizedAt)}.
        </Text>

        <Text style={s.sign}>Priva — Proteção de Identidade Digital</Text>

        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            Documento gerado automaticamente pela Priva (www.privaapp.com.br) a pedido e mediante autorização do titular.
            Em caso de dúvidas sobre esta solicitação, contate contato@privaapp.com.br.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
