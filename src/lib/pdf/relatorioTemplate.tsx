import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { PRIVA_LOGO_DATAURL, PRIVA_LOGO_RATIO } from "./privaLogo";
import {
  PDF_COLORS as C,
  scoreRisk,
  translateDataClass,
  isStealerBreach,
  breachHasPassword,
  breachSeverity,
  yearOf,
  type StoredScanResult,
  type StoredBreach,
} from "./types";

// "Relatório de Exposição Digital" — exactly 3 pages, premium/executive layout
// (plano Essencial). Built-in Helvetica (robust serverless). Reusable
// sub-components. Spacing is tuned so each <Page> fits one A4 (no overflow pages).

const PAGE_PAD = 40;

const s = StyleSheet.create({
  page: {
    backgroundColor: C.page,
    color: C.ink,
    fontFamily: "Helvetica",
    fontSize: 10,
    paddingBottom: 40,
  },

  band: { backgroundColor: C.navy, paddingHorizontal: PAGE_PAD, paddingTop: 26, paddingBottom: 20 },
  bandSlim: {
    backgroundColor: C.navy,
    paddingHorizontal: PAGE_PAD,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brand: { fontSize: 17, fontFamily: "Helvetica-Bold", color: C.white, letterSpacing: 3 },
  brandDot: { color: C.indigoSoft },
  brandSmall: { fontSize: 12, fontFamily: "Helvetica-Bold", color: C.white, letterSpacing: 2 },
  bandPageLabel: { fontSize: 9, color: "#A9A9C2", letterSpacing: 1 },
  h1: { fontSize: 18, fontFamily: "Helvetica-Bold", color: C.white, marginTop: 12 },
  hSub: { fontSize: 9.5, color: "#B9B9CC", marginTop: 4, lineHeight: 1.4 },
  metaRow: { flexDirection: "row", marginTop: 14 },
  metaItem: { marginRight: 26 },
  metaKey: { fontSize: 7.5, color: "#8C8CA8", letterSpacing: 0.5, textTransform: "uppercase" },
  metaVal: { fontSize: 10, color: C.white, marginTop: 2 },

  content: { paddingHorizontal: PAGE_PAD, paddingTop: 16 },
  sectionTitle: { fontSize: 12.5, fontFamily: "Helvetica-Bold", color: C.ink, marginBottom: 3 },
  sectionHint: { fontSize: 8.5, color: C.inkSoft, marginBottom: 8 },
  block: { marginBottom: 12 },

  card: {
    backgroundColor: C.cardBg,
    border: `1px solid ${C.line}`,
    borderRadius: 9,
    padding: 10,
    marginBottom: 6,
  },

  // score card
  scoreCard: { borderRadius: 12, padding: 15, flexDirection: "row", alignItems: "center" },
  scoreLeft: {
    width: 140,
    alignItems: "center",
    borderRight: `1px solid ${C.line}`,
    paddingRight: 12,
  },
  scoreNum: { fontSize: 42, fontFamily: "Helvetica-Bold", lineHeight: 1 },
  scoreOutOf: { fontSize: 10, color: C.inkSoft, marginTop: 2 },
  scoreBadge: {
    marginTop: 7,
    borderRadius: 20,
    paddingVertical: 3,
    paddingHorizontal: 11,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  scoreRight: { flex: 1, paddingLeft: 15 },
  scoreMeaningTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", color: C.ink, marginBottom: 3 },
  scoreMeaning: { fontSize: 10, color: C.inkSoft, lineHeight: 1.4 },
  barTrack: {
    height: 7,
    backgroundColor: "#E2E2EE",
    borderRadius: 4,
    marginTop: 11,
    overflow: "hidden",
  },
  barFill: { height: 7, borderRadius: 4 },

  // summary stat boxes
  summaryRow: { flexDirection: "row" },
  stat: {
    flex: 1,
    backgroundColor: C.cardBg,
    border: `1px solid ${C.line}`,
    borderRadius: 9,
    paddingVertical: 11,
    paddingHorizontal: 5,
    marginRight: 7,
    alignItems: "center",
  },
  statNum: { fontSize: 19, fontFamily: "Helvetica-Bold", color: C.ink },
  statLabel: {
    fontSize: 7.5,
    color: C.inkSoft,
    marginTop: 4,
    textAlign: "center",
    lineHeight: 1.3,
  },

  // breach card (compact)
  bcHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  bcName: { fontSize: 11.5, fontFamily: "Helvetica-Bold", color: C.ink },
  bcSource: { fontSize: 8.5, color: C.indigo, marginTop: 1 },
  sevBadge: {
    borderRadius: 12,
    paddingVertical: 2,
    paddingHorizontal: 8,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 7 },
  chip: {
    backgroundColor: C.indigoBg,
    color: C.indigo,
    fontSize: 8.5,
    borderRadius: 10,
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginRight: 5,
    marginBottom: 4,
  },

  // stealer card
  stealerCard: {
    backgroundColor: "#FBEDED",
    border: `1px solid #F4C9C9`,
    borderRadius: 9,
    padding: 11,
    marginBottom: 6,
  },
  stealerTitle: { fontSize: 11.5, fontFamily: "Helvetica-Bold", color: C.red },
  stealerMeta: { flexDirection: "row", marginTop: 8 },
  stealerMetaItem: { flex: 1 },
  stealerMetaNum: { fontSize: 15, fontFamily: "Helvetica-Bold", color: C.ink },
  stealerMetaLabel: { fontSize: 8, color: C.inkSoft, marginTop: 1 },

  // key/value rows
  kvRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottom: `1px solid ${C.line}`,
  },
  kvKey: { fontSize: 10, color: C.ink },
  kvVal: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.ink },
  empty: { fontSize: 10, color: C.green },

  // factors / calc / recs
  factorRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  factorTick: { color: C.green, marginRight: 7, fontSize: 11, fontFamily: "Helvetica-Bold" },
  factorText: { fontSize: 10, color: C.ink, flex: 1 },
  miniLabel: {
    fontSize: 8,
    color: C.faint,
    marginTop: 8,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  calcRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3 },
  calcKey: { fontSize: 10, color: C.inkSoft },
  calcVal: { fontSize: 10, fontFamily: "Helvetica-Bold", color: C.ink },
  recRow: { flexDirection: "row", marginBottom: 4 },
  recDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.indigo,
    marginTop: 4,
    marginRight: 8,
  },
  recText: { fontSize: 9.5, color: C.ink, flex: 1, lineHeight: 1.35 },

  // upsell
  upsell: {
    backgroundColor: C.indigo,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  upsellLeft: { flex: 1, paddingRight: 14 },
  upsellTitle: { fontSize: 14, fontFamily: "Helvetica-Bold", color: C.white },
  upsellText: { fontSize: 9.5, color: "#DDE0FF", marginTop: 5, lineHeight: 1.4 },
  upsellBtn: {
    marginTop: 10,
    backgroundColor: C.white,
    color: C.indigo,
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  qrBox: { backgroundColor: C.white, borderRadius: 8, padding: 5, alignItems: "center" },
  qrImg: { width: 78, height: 78 },
  qrCap: { fontSize: 7, color: C.indigo, marginTop: 3, textAlign: "center" },

  // legal / sources
  legal: { marginTop: 11, borderTop: `1px solid ${C.line}`, paddingTop: 9 },
  legalText: { fontSize: 8, color: C.inkSoft, lineHeight: 1.5 },
  sourceMap: { fontSize: 8, color: C.faint, marginTop: 4 },
  sourceMapStrong: { color: C.ink, fontFamily: "Helvetica-Bold" },

  footer: {
    position: "absolute",
    bottom: 16,
    left: PAGE_PAD,
    right: PAGE_PAD,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 7.5, color: C.faint },
});

function fmtDate(iso?: string): string {
  if (!iso) return new Date().toLocaleDateString("pt-BR");
  const d = new Date(iso);
  return isNaN(d.getTime()) ? iso : d.toLocaleDateString("pt-BR");
}

function Brand({ small }: { small?: boolean }) {
  const h = small ? 13 : 18;
  return (
    // eslint-disable-next-line jsx-a11y/alt-text
    <Image src={PRIVA_LOGO_DATAURL} style={{ height: h, width: h * PRIVA_LOGO_RATIO }} />
  );
}

function Footer() {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>Priva · Proteção de Identidade Digital</Text>
      <Text
        style={s.footerText}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      />
    </View>
  );
}

function SlimHeader({ label }: { label: string }) {
  return (
    <View style={s.bandSlim}>
      <Brand small />
      <Text style={s.bandPageLabel}>{label}</Text>
    </View>
  );
}

function ScoreCard({ score, risk }: { score: number; risk: ReturnType<typeof scoreRisk> }) {
  const pct = Math.max(0, Math.min(100, score));
  return (
    <View style={[s.scoreCard, { backgroundColor: risk.bg, border: `1px solid ${risk.color}33` }]}>
      <View style={s.scoreLeft}>
        <Text style={[s.scoreNum, { color: risk.color }]}>{score}</Text>
        <Text style={s.scoreOutOf}>/ 100</Text>
        <Text style={[s.scoreBadge, { backgroundColor: risk.color, color: C.white }]}>
          {risk.label}
        </Text>
      </View>
      <View style={s.scoreRight}>
        <Text style={s.scoreMeaningTitle}>O que isso significa</Text>
        <Text style={s.scoreMeaning}>{risk.meaning}</Text>
        <View style={s.barTrack}>
          <View style={[s.barFill, { width: `${pct}%`, backgroundColor: risk.color }]} />
        </View>
      </View>
    </View>
  );
}

function SummaryCards({ nums }: { nums: { label: string; value: string | number }[] }) {
  return (
    <View style={s.summaryRow}>
      {nums.map((n, i) => (
        <View key={i} style={[s.stat, i === nums.length - 1 ? { marginRight: 0 } : {}]}>
          <Text style={s.statNum}>{n.value}</Text>
          <Text style={s.statLabel}>{n.label}</Text>
        </View>
      ))}
    </View>
  );
}

function BreachCard({ b }: { b: StoredBreach }) {
  const sev = breachSeverity(b);
  const yr = yearOf(b.date);
  const classes = (b.dataClasses || [])
    .map(translateDataClass)
    .filter((v, i, a) => a.indexOf(v) === i);
  return (
    <View style={s.card} wrap={false}>
      <View style={s.bcHead}>
        <View style={{ flex: 1 }}>
          <Text style={s.bcName}>{b.name || "Vazamento"}</Text>
          <Text style={s.bcSource}>Base global de vazamentos{yr ? ` · ${yr}` : ""}</Text>
        </View>
        <Text style={[s.sevBadge, { backgroundColor: sev.bg, color: sev.color }]}>
          Gravidade {sev.label}
        </Text>
      </View>
      {classes.length > 0 && (
        <View style={s.chipRow}>
          {classes.slice(0, 8).map((c, i) => (
            <Text key={i} style={s.chip}>
              {c}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

function StealerCard({ count, years, creds }: { count: number; years: string; creds: number }) {
  return (
    <View style={s.stealerCard} wrap={false}>
      <Text style={s.stealerTitle}>Credenciais encontradas em computadores infectados</Text>
      <View style={s.stealerMeta}>
        <View style={s.stealerMetaItem}>
          <Text style={s.stealerMetaNum}>{count}</Text>
          <Text style={s.stealerMetaLabel}>Registros encontrados</Text>
        </View>
        <View style={s.stealerMetaItem}>
          <Text style={s.stealerMetaNum}>{years || "—"}</Text>
          <Text style={s.stealerMetaLabel}>Período</Text>
        </View>
        <View style={s.stealerMetaItem}>
          <Text style={s.stealerMetaNum}>{creds}</Text>
          <Text style={s.stealerMetaLabel}>Credenciais</Text>
        </View>
      </View>
    </View>
  );
}

function RecommendationCard({ recs }: { recs: string[] }) {
  return (
    <View style={s.card}>
      {recs.map((r, i) => (
        <View key={i} style={s.recRow}>
          <View style={s.recDot} />
          <Text style={s.recText}>{r}</Text>
        </View>
      ))}
    </View>
  );
}

function UpsellCard({ qrDataUrl }: { qrDataUrl?: string }) {
  return (
    <View style={s.upsell} wrap={false}>
      <View style={s.upsellLeft}>
        <Text style={s.upsellTitle}>Remova seus dados da internet</Text>
        <Text style={s.upsellText}>
          Quer sair dos vazamentos? Com o plano Proteção Total (R$29,90/mês) solicitamos a remoção
          dos seus dados via LGPD e monitoramos sua exposição continuamente.
        </Text>
        <Text style={s.upsellBtn}>Assinar Proteção Total · R$29,90/mês</Text>
      </View>
      {qrDataUrl ? (
        <View style={s.qrBox}>
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image src={qrDataUrl} style={s.qrImg} />
          <Text style={s.qrCap}>Aponte a câmera</Text>
        </View>
      ) : null}
    </View>
  );
}

export type RelatorioProps = {
  name: string;
  email: string;
  scanDate?: string;
  result: StoredScanResult;
  qrDataUrl?: string;
};

export function buildRelatorioDocument(p: RelatorioProps) {
  const r = p.result;
  const breaches: StoredBreach[] = r.hibp?.breaches ?? [];
  const breachCount = r.hibp?.count ?? r.breachCount ?? breaches.length;
  const score = typeof r.score === "number" ? r.score : Math.max(20, 70 - breachCount * 8);
  const risk = scoreRisk(score);

  const stealer = breaches.filter((b) => isStealerBreach(b.name));
  const normal = breaches.filter((b) => !isStealerBreach(b.name));
  const passwordCount = breaches.filter(breachHasPassword).length;

  const ex = r.exposure;
  const cpfEx = ex?.cpf;
  const phoneEx = ex?.phone;
  const ghEx = ex?.github;
  const phoneCount = phoneEx?.count ?? 0;
  const cpfFound = Boolean(cpfEx?.found);
  const ghRepos = ghEx?.repos ?? [];
  const webHits = (cpfEx?.count ?? 0) + (phoneEx?.count ?? 0);

  const stealerYears = stealer
    .map((b) => yearOf(b.date))
    .filter(Boolean)
    .sort();
  const yearsRange =
    stealerYears.length === 0
      ? ""
      : stealerYears[0] === stealerYears[stealerYears.length - 1]
        ? stealerYears[0]
        : `${stealerYears[0]}–${stealerYears[stealerYears.length - 1]}`;

  const summary = [
    { label: "Vazamentos", value: breachCount },
    { label: "Senhas expostas", value: passwordCount },
    { label: "Telefones", value: phoneCount },
    { label: "CPF localizado", value: cpfFound ? "Sim" : "Não" },
    { label: "Fontes monitoradas", value: 3 },
  ];

  const recentYear = new Date().getFullYear() - 3;
  const hasRecent = breaches.some((b) => Number(yearOf(b.date)) >= recentYear);
  const factors: string[] = [];
  if (breachCount > 0) factors.push(`${breachCount} vazamento(s) de e-mail encontrado(s)`);
  if (passwordCount > 0) factors.push(`${passwordCount} senha(s) exposta(s)`);
  if (hasRecent) factors.push("Exposição recente (últimos anos)");
  if (phoneCount > 0) factors.push("Telefone público encontrado");
  if (cpfFound) factors.push("CPF encontrado em buscas públicas");
  if (ghRepos.length > 0) factors.push("Dados em repositórios públicos");

  const recs = [
    "Ative a autenticação em dois fatores (2FA) nas suas contas.",
    "Use um gerenciador de senhas para senhas fortes e únicas.",
    "Não reutilize a mesma senha em sites diferentes.",
  ];
  if (passwordCount > 0) recs.push("Troque imediatamente as senhas reutilizadas.");
  if (phoneCount > 0) recs.push("Considere ocultar seu telefone de perfis públicos.");
  if (cpfFound) recs.push("Monitore tentativas de fraude utilizando seu CPF.");
  if (ghRepos.length > 0) recs.push("Revise repositórios públicos em busca de segredos expostos.");

  const NORMAL_MAX = 3;
  const shownNormal = normal.slice(0, NORMAL_MAX);

  return (
    <Document title="Relatório de Exposição Digital — Priva" author="Priva">
      {/* ---------------- PAGE 1 — Diagnóstico ---------------- */}
      <Page size="A4" style={s.page}>
        <View style={s.band}>
          <Brand />
          <Text style={s.h1}>Relatório de Exposição Digital</Text>
          <Text style={s.hSub}>
            Diagnóstico personalizado da sua exposição pública na internet.
          </Text>
          <View style={s.metaRow}>
            <View style={s.metaItem}>
              <Text style={s.metaKey}>Titular</Text>
              <Text style={s.metaVal}>{p.name || p.email || "—"}</Text>
            </View>
            <View style={s.metaItem}>
              <Text style={s.metaKey}>E-mail</Text>
              <Text style={s.metaVal}>{p.email || "—"}</Text>
            </View>
            <View style={s.metaItem}>
              <Text style={s.metaKey}>Gerado em</Text>
              <Text style={s.metaVal}>{fmtDate(p.scanDate)}</Text>
            </View>
          </View>
        </View>

        <View style={s.content}>
          <View style={s.block}>
            <Text style={s.sectionTitle}>Seu Score de Proteção</Text>
            <Text style={s.sectionHint}>
              Quanto maior, mais protegida está sua identidade digital.
            </Text>
            <ScoreCard score={score} risk={risk} />
          </View>

          <View style={s.block}>
            <Text style={s.sectionTitle}>Resumo em números</Text>
            <Text style={s.sectionHint}>
              Tudo apurado a partir dos dados reais da sua verificação.
            </Text>
            <SummaryCards nums={summary} />
          </View>
        </View>
        <Footer />
      </Page>

      {/* ---------------- PAGE 2 — Exposição encontrada ---------------- */}
      <Page size="A4" style={s.page}>
        <SlimHeader label="O QUE ENCONTRAMOS" />
        <View style={s.content}>
          <Text style={s.sectionTitle}>O que encontramos</Text>
          <Text style={s.sectionHint}>
            Indícios da sua exposição em bases de vazamento e na web pública.
          </Text>

          {stealer.length > 0 && (
            <StealerCard count={stealer.length} years={yearsRange} creds={stealer.length} />
          )}

          {shownNormal.map((b, i) => (
            <BreachCard key={i} b={b} />
          ))}
          {normal.length > NORMAL_MAX && (
            <Text style={[s.sectionHint, { marginTop: 1 }]}>
              + {normal.length - NORMAL_MAX} outros vazamentos no monitoramento contínuo.
            </Text>
          )}
          {breaches.length === 0 && (
            <View style={s.card}>
              <Text style={s.empty}>Nenhum vazamento de e-mail encontrado.</Text>
            </View>
          )}

          <View style={[s.block, { marginTop: 10 }]}>
            <Text style={s.sectionTitle}>Monitoramento Web Público</Text>
            <View style={s.card}>
              <View style={s.kvRow}>
                <Text style={s.kvKey}>CPF</Text>
                <Text style={s.kvVal}>
                  {cpfFound ? `${cpfEx?.count ?? 0} resultado(s)` : "Não encontrado"}
                </Text>
              </View>
              <View style={s.kvRow}>
                <Text style={s.kvKey}>Telefone</Text>
                <Text style={s.kvVal}>
                  {phoneCount > 0 ? `${phoneCount} resultado(s)` : "Não encontrado"}
                </Text>
              </View>
              <View style={[s.kvRow, { borderBottomWidth: 0 }]}>
                <Text style={s.kvKey}>Perfis públicos / resultados</Text>
                <Text style={s.kvVal}>{webHits}</Text>
              </View>
            </View>
          </View>

          <View style={s.block}>
            <Text style={s.sectionTitle}>Repositórios de código expostos</Text>
            {ghRepos.length > 0 ? (
              <View style={s.card}>
                {ghRepos.slice(0, 5).map((g, i, arr) => (
                  <View
                    key={i}
                    style={[s.kvRow, i === arr.length - 1 ? { borderBottomWidth: 0 } : {}]}
                  >
                    <Text style={s.kvKey}>{g.repo || "Repositório público"}</Text>
                    <Text style={[s.kvVal, { color: C.indigo, fontSize: 8.5 }]}>
                      {g.path || ""}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={s.card}>
                <Text style={s.empty}>Nenhuma exposição encontrada.</Text>
              </View>
            )}
          </View>
        </View>
        <Footer />
      </Page>

      {/* ---------------- PAGE 3 — Score explicado + Recomendações ---------------- */}
      <Page size="A4" style={s.page}>
        <SlimHeader label="SCORE E RECOMENDAÇÕES" />
        <View style={s.content}>
          <View style={s.block}>
            <Text style={s.sectionTitle}>Como calculamos seu Score</Text>
            <Text style={s.sectionHint}>
              Seu Identity Score parte de uma linha de base e diminui conforme encontramos indícios
              de exposição.
            </Text>
            <View style={s.card}>
              <View style={s.calcRow}>
                <Text style={s.calcKey}>Vazamentos de e-mail</Text>
                <Text style={[s.calcVal, { color: breachCount > 0 ? C.red : C.ink }]}>
                  {breachCount > 0 ? `− ${breachCount * 8} pts (${breachCount} × 8)` : "0 pts"}
                </Text>
              </View>
              <View
                style={[
                  s.calcRow,
                  { borderTop: `1px solid ${C.line}`, marginTop: 3, paddingTop: 7 },
                ]}
              >
                <Text style={[s.calcKey, { fontFamily: "Helvetica-Bold", color: C.ink }]}>
                  Score final
                </Text>
                <Text style={[s.calcVal, { color: risk.color }]}>{score} / 100</Text>
              </View>
            </View>

            <Text style={s.miniLabel}>Fatores de risco identificados</Text>
            {factors.length > 0 ? (
              factors.map((f, i) => (
                <View key={i} style={s.factorRow}>
                  <Text style={s.factorTick}>✓</Text>
                  <Text style={s.factorText}>{f}</Text>
                </View>
              ))
            ) : (
              <Text style={s.empty}>Nenhum fator de risco crítico identificado.</Text>
            )}
          </View>

          <View style={s.block}>
            <Text style={s.sectionTitle}>Recomendações inteligentes</Text>
            <RecommendationCard recs={recs} />
          </View>

          <UpsellCard qrDataUrl={p.qrDataUrl} />

          <View style={s.legal}>
            <Text style={s.legalText}>
              Este relatório representa um retrato da exposição pública encontrada na data de sua
              geração. As informações apresentadas são provenientes de bases públicas e
              monitoramentos autorizados.
            </Text>
            <Text style={s.sourceMap}>
              <Text style={s.sourceMapStrong}>Base global de vazamentos</Text> — verificação de
              e-mail · <Text style={s.sourceMapStrong}>Monitoramento Web Público</Text> — CPF e
              telefone · <Text style={s.sourceMapStrong}>Repositórios de código expostos</Text> —
              código público
            </Text>
          </View>
        </View>
        <Footer />
      </Page>
    </Document>
  );
}
