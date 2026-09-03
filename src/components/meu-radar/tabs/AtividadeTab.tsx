import { useEffect, useRef, useState } from "react";
import {
  Link2,
  QrCode,
  MessageSquareText,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Clipboard,
  Trash2,
  Camera,
  Image as ImageIcon,
  Lock,
  Users,
} from "lucide-react";
import { AppHeader } from "../Header";
import { QrScanner } from "../QrScanner";
import { EmergencyCta } from "../EmergencyCta";
import { FamiliaTab } from "./FamiliaTab";
import { useApp } from "@/contexts/AppContext";
import { analyzeLink, type LinkResult } from "@/lib/security/link";
import { analyzePix, type PixResult } from "@/lib/security/pix";
import { analyzeMessage, type MessageResult } from "@/lib/security/message";
import { decodeFromFile } from "@/lib/security/qr";
import { checksLeft, consumeCheck, tierOf, CHECKS_PER_DAY } from "@/lib/security/quota";
import { FreeAccountSheet } from "../FreeAccountSheet";
import { getUser } from "@/lib/auth";

/**
 * Verification tools: link, Pix and message.
 *
 * The tab used to repeat Proteção's own categories (Vazamentos/Web), which
 * added nothing. It now holds the checks people actually perform in the moment
 * — before clicking, before paying, after receiving something odd — each with
 * its own input so the flows never blur into one confusing box.
 *
 * All three analyses run locally (see lib/security). Nothing typed here is
 * sent anywhere; the history below lives only on this device.
 */
type Tool = "link" | "pix" | "mensagem" | "familia";
type Level = "seguro" | "atencao" | "alto";

const TOOLS: { id: Tool; label: string; Icon: typeof Link2 }[] = [
  // Pix first: it is the check people open the app for, and the one with money
  // on the other side of the decision.
  { id: "pix", label: "Pix", Icon: QrCode },
  { id: "link", label: "Link", Icon: Link2 },
  { id: "mensagem", label: "Mensagem", Icon: MessageSquareText },
  { id: "familia", label: "Família", Icon: Users },
];

const LEVEL_UI: Record<
  Level,
  { label: string; color: string; bg: string; Icon: typeof ShieldCheck }
> = {
  seguro: {
    label: "Parece seguro",
    color: "#0FA968",
    bg: "rgba(15,169,104,0.12)",
    Icon: ShieldCheck,
  },
  atencao: { label: "Atenção", color: "#D97706", bg: "rgba(217,119,6,0.12)", Icon: ShieldAlert },
  alto: { label: "Alto risco", color: "#DC2626", bg: "rgba(220,38,38,0.12)", Icon: ShieldX },
};

const SIGNAL_COLOR = { ok: "#0FA968", warn: "#D97706", danger: "#DC2626" } as const;

const HISTORY_KEY = "priva_checks";
type HistoryItem = { tool: Tool; level: Level; label: string; at: number };

function loadHistory(): HistoryItem[] {
  try {
    const v = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(v) ? (v as HistoryItem[]) : [];
  } catch {
    return [];
  }
}

const PLACEHOLDER: Record<Tool, string> = {
  link: "Cole o link aqui (ex: site.com/promocao)",
  pix: "Cole o Pix copia-e-cola aqui",
  mensagem: "Cole a mensagem suspeita aqui",
  familia: "",
};

const HELP: Record<Tool, string> = {
  link: "Analisamos o endereço: domínios que imitam bancos, encurtadores, caracteres disfarçados.",
  pix: "Escaneie o QR ou cole o código antes de pagar: integridade, valor, recebedor e tipo de chave.",
  mensagem: "Procuramos padrões de golpe no texto e verificamos os links que vierem junto.",
  familia: "",
};

export function AtividadeTab() {
  const { isPremium, openPaywall } = useApp();
  const [tool, setTool] = useState<Tool>("pix");
  const [input, setInput] = useState("");
  const [result, setResult] = useState<LinkResult | PixResult | MessageResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [scanning, setScanning] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [hasAccount, setHasAccount] = useState(false);
  const [accountSheet, setAccountSheet] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const tier = tierOf(hasAccount, isPremium);
  const [left, setLeft] = useState<number>(CHECKS_PER_DAY.anon);

  useEffect(() => setHistory(loadHistory()), []);

  // An account may exist from a previous device/session, not just from this
  // one — so trust the live session over the local flag when there is one.
  useEffect(() => {
    setHasAccount(localStorage.getItem("priva_has_account") === "true");
    void getUser()
      .then((u) => u && setHasAccount(true))
      .catch(() => {});
  }, []);

  useEffect(() => setLeft(checksLeft(tier)), [tier]);

  // A share/paste can arrive as ?verificar=... (see the share target route).
  useEffect(() => {
    const shared = new URLSearchParams(window.location.search).get("verificar");
    if (shared) {
      setTool("mensagem");
      setInput(shared);
    }
  }, []);

  const record = (level: Level, label: string) => {
    const item: HistoryItem = { tool, level, label, at: Date.now() };
    const next = [item, ...loadHistory()].slice(0, 20);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setHistory(next);
  };

  // Accepts an override so a freshly decoded QR can be analysed immediately,
  // without waiting for the input state to flush.
  const run = (override?: string) => {
    const value = (override ?? input).trim();
    if (!value) return;
    // Soft allowance, climbing one step at a time: an anonymous visitor is
    // asked for a free account (never for money) the first time they run out,
    // and only someone who already has one sees the plans. Asking to pay
    // before the tool has proved itself is what kills conversion here.
    if (!consumeCheck(tier)) {
      if (tier === "anon") setAccountSheet(true);
      else openPaywall();
      return;
    }
    setLeft(checksLeft(tier));
    if (tool === "link") {
      const r = analyzeLink(value);
      setResult(r);
      record(r.level, r.host || value.slice(0, 40));
    } else if (tool === "pix") {
      const r = analyzePix(value);
      setResult(r);
      record(r.level, r.merchant || "Código Pix");
    } else {
      const r = analyzeMessage(value);
      setResult(r);
      record(r.level, value.slice(0, 40));
    }
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setInput(text);
    } catch {
      /* clipboard permission denied — the user can paste manually */
    }
  };

  /** A decoded QR is just a payload string — same path as a pasted code. */
  const onQrResult = (value: string) => {
    setScanning(false);
    setQrError(null);
    setInput(value);
    run(value);
  };

  const onPickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // let the same file be picked again after a failure
    if (!file) return;
    setQrError(null);
    const value = await decodeFromFile(file);
    if (value) onQrResult(value);
    else setQrError("Não encontramos um QR code nessa imagem. Tente uma foto mais nítida.");
  };

  const switchTool = (t: Tool) => {
    setTool(t);
    setResult(null);
    setInput("");
    setQrError(null);
  };

  const clearHistory = () => {
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      /* ignore */
    }
    setHistory([]);
  };

  const signals = result ? result.signals : [];
  const level = (result?.level ?? "seguro") as Level;
  const ui = LEVEL_UI[level];

  return (
    <>
      {scanning && <QrScanner onResult={onQrResult} onClose={() => setScanning(false)} />}

      {accountSheet && (
        <FreeAccountSheet
          onClose={() => setAccountSheet(false)}
          onCreated={() => {
            setAccountSheet(false);
            setHasAccount(true);
          }}
          onSeePlans={() => {
            setAccountSheet(false);
            openPaywall();
          }}
        />
      )}

      <AppHeader title="Verificar" showBell />

      {/* Same segmented toolbar language as Proteção */}
      <div className="mx-5 mt-4 flex gap-1 rounded-full border border-border bg-secondary/40 p-1">
        {TOOLS.map((t) => {
          const isActive = tool === t.id;
          return (
            <button
              key={t.id}
              onClick={() => switchTool(t.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-full py-1.5 text-[13px] font-medium transition ${
                isActive ? "text-white" : "text-muted-foreground"
              }`}
              style={isActive ? { backgroundColor: "#4F46E5" } : undefined}
            >
              {/* "Mensagem" is the long one: with an icon beside it the pill
                  runs out of room and the glyph clips. The word alone is
                  clearer than a cropped icon. */}
              {t.id !== "mensagem" && <t.Icon className="h-3.5 w-3.5 shrink-0" />}
              {t.label}
            </button>
          );
        })}
      </div>

      {tool === "familia" ? (
        <FamiliaTab embedded />
      ) : (
        <>
          <p className="px-5 pt-3 text-[12.5px] leading-relaxed text-muted-foreground">
            {HELP[tool]}
          </p>

          {/* Say the limit up front — a wall that appears without warning reads
              as a bug; announced, it reads as the reason to subscribe. */}
          {!isPremium && (
            <p className="px-5 pt-1.5 text-[11.5px] text-muted-foreground">
              {left > 0 ? (
                <>
                  {left} de {CHECKS_PER_DAY[tier]}{" "}
                  {left === 1 ? "verificação gratuita hoje" : "verificações gratuitas hoje"} ·{" "}
                  <button onClick={openPaywall} className="font-semibold text-[var(--color-navy)]">
                    ilimitado no Essencial
                  </button>
                </>
              ) : (
                <>
                  Você usou suas {CHECKS_PER_DAY[tier]} verificações de hoje ·{" "}
                  {tier === "anon" ? (
                    <button
                      onClick={() => setAccountSheet(true)}
                      className="font-semibold text-[var(--color-navy)]"
                    >
                      criar conta grátis
                    </button>
                  ) : (
                    <button
                      onClick={openPaywall}
                      className="font-semibold text-[var(--color-navy)]"
                    >
                      assine para continuar
                    </button>
                  )}
                </>
              )}
            </p>
          )}

          {/* Input */}
          <div className="px-5 pt-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={tool === "mensagem" ? 5 : 3}
              placeholder={PLACEHOLDER[tool]}
              className="w-full resize-none rounded-2xl border border-border bg-card px-4 py-3 text-[14px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-indigo-500"
            />
            <div className="mt-2 flex gap-2">
              <button
                onClick={pasteFromClipboard}
                className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-[12.5px] font-medium text-muted-foreground transition active:scale-[0.99]"
              >
                <Clipboard className="h-3.5 w-3.5" /> Colar
              </button>
              <button
                onClick={() => run()}
                disabled={!input.trim()}
                className="flex-1 rounded-xl py-2.5 text-[14px] font-bold text-white transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
                style={{ background: "linear-gradient(135deg,#4F46E5,#6366F1)" }}
              >
                Verificar
              </button>
            </div>

            {/* QR reading — subscriber feature. Free users can still paste the
            copia-e-cola, so the tool stays useful and the upgrade has a reason. */}
            {tool === "pix" && (
              <div className="mt-3">
                <div className="flex gap-2">
                  <button
                    onClick={() => (isPremium ? setScanning(true) : openPaywall())}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card py-2.5 text-[13px] font-semibold text-foreground transition active:scale-[0.99]"
                  >
                    <Camera className="h-4 w-4" style={{ color: "#4F46E5" }} /> Escanear QR
                    {!isPremium && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                  </button>
                  <button
                    onClick={() => (isPremium ? fileRef.current?.click() : openPaywall())}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-card py-2.5 text-[13px] font-semibold text-foreground transition active:scale-[0.99]"
                  >
                    <ImageIcon className="h-4 w-4" style={{ color: "#4F46E5" }} /> Enviar foto
                    {!isPremium && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                  </button>
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onPickImage}
                />
                {qrError && (
                  <p className="mt-2 text-[12px] font-medium" style={{ color: "#D97706" }}>
                    {qrError}
                  </p>
                )}
                {!isPremium && (
                  <p className="mt-2 text-[11.5px] leading-snug text-muted-foreground">
                    Ler QR pela câmera ou por foto faz parte da assinatura. Colar o código
                    copia-e-cola continua livre.
                  </p>
                )}

                {/* The emergency button is here BEFORE anything is pasted, on
                    purpose. Someone who already sent the money is not going to
                    paste the code and read a verdict — they need the way out on
                    the first screen they land on. */}
                <EmergencyCta className="mt-3" />
              </div>
            )}
          </div>

          {/* Result */}
          {result && (
            <div className="animate-fade-in px-5 pt-5">
              <div
                className="rounded-2xl border p-4"
                style={{ borderColor: `${ui.color}40`, backgroundColor: ui.bg }}
              >
                <div className="flex items-center gap-3">
                  <ui.Icon
                    className="h-7 w-7 shrink-0"
                    strokeWidth={1.9}
                    style={{ color: ui.color }}
                  />
                  <div className="min-w-0">
                    <p className="text-[16px] font-bold" style={{ color: ui.color }}>
                      {ui.label}
                    </p>
                    <p className="text-[12px] text-muted-foreground">
                      {signals.length}{" "}
                      {signals.length === 1 ? "sinal analisado" : "sinais analisados"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Pix summary — the facts that matter before paying */}
              {tool === "pix" && (result as PixResult).valid && (
                <div className="mt-3 rounded-2xl border border-border bg-card p-4">
                  {/* Only rows we actually have. A bare key carries no
                      recipient or city, and printing "—" three times looks
                      like the check failed. */}
                  {(
                    [
                      ["Recebedor", (result as PixResult).merchant],
                      [
                        "Valor",
                        typeof (result as PixResult).amount === "number"
                          ? `R$ ${(result as PixResult).amount!.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                          : (result as PixResult).isStatic && (result as PixResult).merchant
                            ? "Você define ao pagar"
                            : undefined,
                      ],
                      ["Cidade", (result as PixResult).city],
                      ["Tipo de chave", (result as PixResult).keyKind],
                    ] as [string, string | undefined][]
                  )
                    .filter(([, v]) => !!v)
                    .map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-3 py-1.5 text-[13px]">
                        <span className="text-muted-foreground">{k}</span>
                        <span className="min-w-0 truncate font-semibold text-foreground">{v}</span>
                      </div>
                    ))}
                </div>
              )}

              <ul className="mt-3 space-y-2">
                {signals.map((s, i) => (
                  <li
                    key={i}
                    className="flex gap-3 rounded-2xl border border-border bg-card px-4 py-3"
                  >
                    <span
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: SIGNAL_COLOR[s.level] }}
                    />
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-bold text-foreground">{s.label}</p>
                      <p className="text-[12px] leading-snug text-muted-foreground">{s.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Pix already carries the button above the input, so only the
                  other tools add one here — and only on a high-risk verdict. */}
              {result.level === "alto" && tool !== "pix" && <EmergencyCta className="mt-4" />}

              <p className="px-2 pt-4 text-center text-[11px] leading-relaxed text-muted-foreground/70">
                Análise feita no seu aparelho, a partir do conteúdo colado. Ajuda a decidir, mas não
                substitui conferir pelo canal oficial.
              </p>
            </div>
          )}
        </>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="px-5 pb-8 pt-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[15px] font-bold text-foreground">Verificações recentes</h2>
            <button
              onClick={clearHistory}
              className="flex items-center gap-1 text-[12px] text-muted-foreground"
            >
              <Trash2 className="h-3.5 w-3.5" /> Limpar
            </button>
          </div>
          <ul className="space-y-2">
            {history.map((h, i) => {
              const hui = LEVEL_UI[h.level];
              return (
                <li
                  key={i}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-2.5"
                >
                  <hui.Icon className="h-4 w-4 shrink-0" style={{ color: hui.color }} />
                  <span className="min-w-0 flex-1 truncate text-[13px] text-foreground">
                    {h.label}
                  </span>
                  <span className="shrink-0 text-[11px] font-semibold" style={{ color: hui.color }}>
                    {hui.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
}
