/**
 * Link check — structural analysis of a URL, offline.
 *
 * No reputation API is configured (no Safe Browsing key), so this deliberately
 * reports only what the URL itself proves: lookalike bank domains, punycode
 * homographs, raw IPs, shorteners, credentials in the URL, risky TLDs. That is
 * genuinely useful and never guesses. When a Safe Browsing key exists, it
 * should be added as an extra signal, not a replacement for these.
 */
export type LinkLevel = "seguro" | "atencao" | "alto";

export type LinkSignal = { level: "ok" | "warn" | "danger"; label: string; detail: string };

export type LinkResult = {
  level: LinkLevel;
  url: string;
  host: string;
  signals: LinkSignal[];
};

/** Brands impersonated in Brazilian phishing, with their legitimate domains. */
const BRANDS: { name: string; needles: string[]; official: string[] }[] = [
  { name: "Nubank", needles: ["nubank", "nuconta"], official: ["nubank.com.br"] },
  { name: "Itaú", needles: ["itau", "itaú"], official: ["itau.com.br", "itau.br"] },
  { name: "Bradesco", needles: ["bradesco"], official: ["bradesco.com.br"] },
  { name: "Caixa", needles: ["caixa"], official: ["caixa.gov.br"] },
  { name: "Banco do Brasil", needles: ["bancodobrasil", "bb.com"], official: ["bb.com.br"] },
  { name: "Santander", needles: ["santander"], official: ["santander.com.br"] },
  { name: "PicPay", needles: ["picpay"], official: ["picpay.com"] },
  {
    name: "Mercado Pago",
    needles: ["mercadopago", "mercadolivre"],
    official: ["mercadopago.com.br", "mercadolivre.com.br"],
  },
  { name: "Gov.br", needles: ["govbr", "gov-br", "meugov"], official: ["gov.br"] },
  { name: "Receita Federal", needles: ["receitafederal", "receita"], official: ["gov.br"] },
  { name: "INSS", needles: ["inss"], official: ["gov.br"] },
  { name: "Correios", needles: ["correios"], official: ["correios.com.br"] },
  { name: "Serasa", needles: ["serasa"], official: ["serasa.com.br", "serasaexperian.com.br"] },
  { name: "WhatsApp", needles: ["whatsapp", "whatsap", "whats-app"], official: ["whatsapp.com"] },
];

const SHORTENERS = [
  "bit.ly",
  "tinyurl.com",
  "goo.gl",
  "t.co",
  "is.gd",
  "cutt.ly",
  "encurtador.com.br",
  "rebrand.ly",
  "shorturl.at",
  "ow.ly",
  "rb.gy",
  "l1nk.dev",
];

/** TLDs disproportionately used for throwaway phishing hosts. */
const RISKY_TLDS = [
  "zip",
  "mov",
  "top",
  "xyz",
  "click",
  "club",
  "rest",
  "quest",
  "cfd",
  "sbs",
  "icu",
  "work",
  "live",
  "fit",
  "surf",
  "monster",
  "buzz",
];

function endsWithDomain(host: string, domain: string) {
  return host === domain || host.endsWith("." + domain);
}

export function analyzeLink(raw: string): LinkResult {
  const input = raw.trim();
  const withScheme = /^https?:\/\//i.test(input) ? input : `https://${input}`;

  let u: URL;
  try {
    u = new URL(withScheme);
  } catch {
    return {
      level: "alto",
      url: input,
      host: "",
      signals: [
        { level: "danger", label: "Link inválido", detail: "Não foi possível ler este endereço." },
      ],
    };
  }

  const host = u.hostname.toLowerCase();
  const signals: LinkSignal[] = [];

  // Protocol — only meaningful when the original text stated it.
  if (/^http:\/\//i.test(input)) {
    signals.push({
      level: "warn",
      label: "Conexão sem criptografia",
      detail: "O endereço usa http://, sem cadeado. Dados digitados ali trafegam abertos.",
    });
  }

  // Raw IP instead of a name
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    signals.push({
      level: "danger",
      label: "Endereço numérico (IP)",
      detail: "Sites legítimos usam nome de domínio, não um IP cru.",
    });
  }

  // Punycode / homograph
  if (host.includes("xn--")) {
    signals.push({
      level: "danger",
      label: "Caracteres disfarçados",
      detail: "O domínio usa letras de outro alfabeto para imitar um nome conhecido.",
    });
  }

  // Credentials embedded (https://banco.com@site-falso.com)
  if (u.username || u.password || /@/.test(u.host)) {
    signals.push({
      level: "danger",
      label: "Endereço enganoso",
      detail: "Há um '@' no endereço, truque usado para esconder o site real.",
    });
  }

  // Brand impersonation: mentions a brand but isn't on its real domain
  for (const b of BRANDS) {
    const mentions = b.needles.some((n) => host.includes(n));
    const isOfficial = b.official.some((d) => endsWithDomain(host, d));
    if (mentions && !isOfficial) {
      signals.push({
        level: "danger",
        label: `Imita ${b.name}`,
        detail: `O endereço cita "${b.name}" mas não está em ${b.official[0]}.`,
      });
      break;
    }
    if (isOfficial) {
      signals.push({
        level: "ok",
        label: `Domínio oficial ${b.name}`,
        detail: `Confere com ${b.official.find((d) => endsWithDomain(host, d))}.`,
      });
      break;
    }
  }

  // Shortener hides the destination
  if (SHORTENERS.some((s) => endsWithDomain(host, s))) {
    signals.push({
      level: "warn",
      label: "Link encurtado",
      detail: "Não dá para ver o destino real antes de abrir.",
    });
  }

  // Risky TLD
  const tld = host.split(".").pop() || "";
  if (RISKY_TLDS.includes(tld)) {
    signals.push({
      level: "warn",
      label: `Domínio .${tld}`,
      detail: "Extensão muito usada em sites descartáveis de golpe.",
    });
  }

  // Very deep subdomains — "itau.com.br.seguro.xyz"
  const labels = host.split(".");
  if (labels.length >= 5) {
    signals.push({
      level: "warn",
      label: "Muitos subdomínios",
      detail: "Nome longo costuma esconder o domínio verdadeiro no final.",
    });
  }

  // Bait words in the path
  if (
    /(premio|prêmio|sorteio|recadastr|atualizar-dados|desbloqueio|liberar|resgate|bonus|cpf)/i.test(
      u.pathname + u.search,
    )
  ) {
    signals.push({
      level: "warn",
      label: "Texto de isca no endereço",
      detail: "O caminho do link usa palavras típicas de golpe.",
    });
  }

  if (signals.length === 0) {
    signals.push({
      level: "ok",
      label: "Nenhum sinal estrutural suspeito",
      detail: "Não encontramos indícios no endereço — o que não garante que o site seja confiável.",
    });
  }

  const danger = signals.some((s) => s.level === "danger");
  const warns = signals.filter((s) => s.level === "warn").length;

  return {
    level: danger ? "alto" : warns >= 2 ? "alto" : warns === 1 ? "atencao" : "seguro",
    url: withScheme,
    host,
    signals,
  };
}
