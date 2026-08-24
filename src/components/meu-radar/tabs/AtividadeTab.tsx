import { useEffect, useState } from "react";
import {
  Link2,
  QrCode,
  MessageSquareText,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Share2,
  Clipboard,
  Trash2,
} from "lucide-react";
import { AppHeader } from "../Header";
import { analyzeLink, type LinkResult } from "@/lib/security/link";
import { analyzePix, type PixResult } from "@/lib/security/pix";
import { analyzeMessage, type MessageResult } from "@/lib/security/message";

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
type Tool = "link" | "pix" | "mensagem";
type Level = "seguro" | "atencao" | "alto";

const TOOLS: { id: Tool; label: string; Icon: typeof Link2 }[] = [
  { id: "link", label: "Link", Icon: Link2 },
  { id: "pix", label: "Pix", Icon: QrCode },
  { id: "mensagem", label: "Mensagem", Icon: MessageSquareText },
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
};

const HELP: Record<Tool, string> = {
  link: "Analisamos o endereço: domínios que imitam bancos, encurtadores, caracteres disfarçados.",
  pix: "Lemos o código antes de você pagar: integridade, valor, recebedor e tipo de chave.",
  mensagem: "Procuramos padrões de golpe no texto e verificamos os links que vierem junto.",
};

export function AtividadeTab() {
  const [tool, setTool] = useState<Tool>("link");
  const [input, setInput] = useState("");
  const [result, setResult] = useState<LinkResult | PixResult | MessageResult | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => setHistory(loadHistory()), []);

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

  const run = () => {
    const value = input.trim();
    if (!value) return;
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

  const switchTool = (t: Tool) => {
    setTool(t);
    setResult(null);
    setInput("");
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
              <t.Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      <p className="px-5 pt-3 text-[12.5px] leading-relaxed text-muted-foreground">{HELP[tool]}</p>

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
            onClick={run}
            disabled={!input.trim()}
            className="flex-1 rounded-xl py-2.5 text-[14px] font-bold text-white transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: "linear-gradient(135deg,#4F46E5,#6366F1)" }}
          >
            Verificar
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="animate-fade-in px-5 pt-5">
          <div
            className="rounded-2xl border p-4"
            style={{ borderColor: `${ui.color}40`, backgroundColor: ui.bg }}
          >
            <div className="flex items-center gap-3">
              <ui.Icon className="h-7 w-7 shrink-0" strokeWidth={1.9} style={{ color: ui.color }} />
              <div className="min-w-0">
                <p className="text-[16px] font-bold" style={{ color: ui.color }}>
                  {ui.label}
                </p>
                <p className="text-[12px] text-muted-foreground">
                  {signals.length} {signals.length === 1 ? "sinal analisado" : "sinais analisados"}
                </p>
              </div>
            </div>
          </div>

          {/* Pix summary — the facts that matter before paying */}
          {tool === "pix" && (result as PixResult).valid && (
            <div className="mt-3 rounded-2xl border border-border bg-card p-4">
              {[
                ["Recebedor", (result as PixResult).merchant ?? "—"],
                [
                  "Valor",
                  typeof (result as PixResult).amount === "number"
                    ? `R$ ${(result as PixResult).amount!.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                    : "Você define ao pagar",
                ],
                ["Cidade", (result as PixResult).city ?? "—"],
                ["Tipo de chave", (result as PixResult).keyKind ?? "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 py-1.5 text-[13px]">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="min-w-0 truncate font-semibold text-foreground">{v}</span>
                </div>
              ))}
            </div>
          )}

          <ul className="mt-3 space-y-2">
            {signals.map((s, i) => (
              <li key={i} className="flex gap-3 rounded-2xl border border-border bg-card px-4 py-3">
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

          <p className="px-2 pt-4 text-center text-[11px] leading-relaxed text-muted-foreground/70">
            Análise feita no seu aparelho, a partir do conteúdo colado. Ajuda a decidir, mas não
            substitui conferir pelo canal oficial.
          </p>
        </div>
      )}

      {/* Share hint */}
      {!result && (
        <div className="mx-5 mt-5 flex items-start gap-3 rounded-2xl border border-border bg-secondary/30 px-4 py-3">
          <Share2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-navy)]" />
          <p className="text-[12px] leading-snug text-muted-foreground">
            <span className="font-semibold text-foreground">Compartilhar com a Priva:</span> no
            Android, com o app instalado, use o botão Compartilhar do WhatsApp e escolha Priva. No
            iPhone, copie e use o botão Colar acima.
          </p>
        </div>
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
