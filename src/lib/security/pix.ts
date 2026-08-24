/**
 * Pix Protect — parses an EMV®QRCPS "BR Code" (copia-e-cola or QR payload) and
 * reports what it actually says, before the person pays.
 *
 * Everything here is deterministic and offline: the payload is a self-describing
 * TLV string with a CRC, so we can validate and read it without any API. We
 * never claim "this person is a fraudster" — we surface the concrete signals
 * (invalid CRC, no amount, unknown PSP domain, key type) and let them decide.
 */
export type PixLevel = "seguro" | "atencao" | "alto";

export type PixSignal = {
  level: "ok" | "warn" | "danger";
  label: string;
  detail: string;
};

export type PixResult = {
  valid: boolean;
  level: PixLevel;
  signals: PixSignal[];
  merchant?: string;
  city?: string;
  amount?: number;
  key?: string;
  keyKind?: string;
  dynamicUrl?: string;
  txid?: string;
  isStatic: boolean;
};

/** CRC16/CCITT-FALSE — the checksum Pix uses in field 63. */
export function crc16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

type TLV = Record<string, string>;

/** Splits an EMV TLV string: 2-digit id, 2-digit length, then the value. */
export function parseTLV(s: string): TLV {
  const out: TLV = {};
  let i = 0;
  while (i + 4 <= s.length) {
    const id = s.slice(i, i + 2);
    const len = Number(s.slice(i + 2, i + 4));
    if (!/^\d{2}$/.test(id) || Number.isNaN(len)) break;
    const value = s.slice(i + 4, i + 4 + len);
    if (value.length < len) break;
    out[id] = value;
    i += 4 + len;
  }
  return out;
}

/** Classifies a Pix key so the user can sanity-check who they're paying. */
export function keyKind(key: string): string {
  const digits = key.replace(/\D/g, "");
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key)) return "e-mail";
  if (/^\+?55\d{10,11}$/.test(digits) || /^\d{10,11}$/.test(digits)) return "telefone";
  if (digits.length === 11 && key.replace(/\D/g, "") === digits) return "CPF";
  if (digits.length === 14) return "CNPJ";
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key))
    return "chave aleatória";
  return "chave";
}

export function analyzePix(raw: string): PixResult {
  // Strip only line breaks/tabs that copy-paste adds. Spaces must survive:
  // they are part of real values ("LOJA DA MARIA", "SAO PAULO"), and removing
  // them shifts every TLV offset and breaks the CRC.
  const payload = raw.replace(/[\r\n\t]+/g, "").trim();
  const signals: PixSignal[] = [];

  const root = parseTLV(payload);
  const looksPix = payload.toUpperCase().includes("BR.GOV.BCB.PIX");

  if (!root["00"] || !looksPix) {
    return {
      valid: false,
      level: "alto",
      isStatic: true,
      signals: [
        {
          level: "danger",
          label: "Não é um código Pix válido",
          detail: "O texto colado não tem a estrutura de um Pix copia-e-cola.",
        },
      ],
    };
  }

  // ── CRC: the payload carries its own checksum. A mismatch means the code was
  // edited after being generated — the classic "trocaram o QR" tampering.
  const crcIndex = payload.lastIndexOf("6304");
  const declared = crcIndex >= 0 ? payload.slice(crcIndex + 4).toUpperCase() : "";
  const computed = crcIndex >= 0 ? crc16(payload.slice(0, crcIndex + 4)) : "";
  const crcOk = declared.length === 4 && declared === computed;
  signals.push(
    crcOk
      ? { level: "ok", label: "Código íntegro", detail: "A verificação (CRC) confere." }
      : {
          level: "danger",
          label: "Código adulterado",
          detail: "A verificação de integridade falhou — o código pode ter sido alterado.",
        },
  );

  // ── Merchant account info (26–51): the Pix block
  let key = "";
  let dynamicUrl = "";
  for (let id = 26; id <= 51; id++) {
    const block = root[String(id).padStart(2, "0")];
    if (!block) continue;
    const sub = parseTLV(block);
    if ((sub["00"] || "").toUpperCase().includes("BR.GOV.BCB.PIX")) {
      key = sub["01"] || "";
      dynamicUrl = sub["25"] || "";
    }
  }

  const isStatic = (root["01"] || "11") !== "12";
  const merchant = (root["59"] || "").trim();
  const city = (root["60"] || "").trim();
  const amountRaw = root["54"];
  const amount = amountRaw ? Number(amountRaw) : undefined;
  const txid = parseTLV(root["62"] || "")["05"];
  const country = (root["58"] || "").toUpperCase();
  const currency = root["53"] || "";

  if (country && country !== "BR") {
    signals.push({
      level: "danger",
      label: "País fora do Brasil",
      detail: `O código declara o país "${country}", não BR.`,
    });
  }
  if (currency && currency !== "986") {
    signals.push({
      level: "warn",
      label: "Moeda diferente de real",
      detail: `Código de moeda "${currency}" (real é 986).`,
    });
  }

  // ── Amount: a code with no amount lets whoever generated it (or the app) set
  // any value at payment time. Worth flagging, not condemning.
  if (typeof amount === "number" && !Number.isNaN(amount) && amount > 0) {
    signals.push({
      level: "ok",
      label: "Valor definido no código",
      detail: `R$ ${amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
    });
  } else {
    signals.push({
      level: "warn",
      label: "Sem valor definido",
      detail: "Você digita o valor ao pagar — confira com atenção antes de confirmar.",
    });
  }

  // ── Dynamic QR: the real destination lives behind a URL, which is where a
  // fake PSP domain would hide.
  if (dynamicUrl) {
    const host = dynamicUrl.replace(/^https?:\/\//i, "").split("/")[0] || dynamicUrl;
    signals.push({
      level: "warn",
      label: "QR dinâmico",
      detail: `Os dados vêm de ${host}. Confirme se o domínio é do banco esperado.`,
    });
  }

  if (!merchant) {
    signals.push({
      level: "warn",
      label: "Sem nome do recebedor",
      detail: "O código não informa quem recebe.",
    });
  } else {
    signals.push({
      level: "ok",
      label: "Recebedor informado",
      detail: merchant,
    });
  }

  if (key) {
    const kind = keyKind(key);
    signals.push({
      level: "ok",
      label: `Chave: ${kind}`,
      detail:
        kind === "chave aleatória"
          ? "Chave aleatória não revela o dono — confira o nome no app do banco."
          : "Confira se corresponde a quem você espera pagar.",
    });
  }

  const danger = signals.some((s) => s.level === "danger");
  const warns = signals.filter((s) => s.level === "warn").length;
  const level: PixLevel = danger
    ? "alto"
    : warns >= 2
      ? "atencao"
      : warns === 1
        ? "atencao"
        : "seguro";

  return {
    valid: crcOk,
    level,
    signals,
    merchant: merchant || undefined,
    city: city || undefined,
    amount: typeof amount === "number" && !Number.isNaN(amount) ? amount : undefined,
    key: key || undefined,
    keyKind: key ? keyKind(key) : undefined,
    dynamicUrl: dynamicUrl || undefined,
    txid,
    isStatic,
  };
}
