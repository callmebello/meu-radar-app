import { useState } from "react";
import { Check, Copy, FileText, Image as ImageIcon, Link2, Loader2, X } from "lucide-react";
import { renderPrivaIdPng, type PrivaIdData } from "@/lib/privaIdImage";
import { track, gaEvent } from "@/lib/analytics";

/**
 * Sharing the Priva ID: picture, PDF or link.
 *
 * The first two are produced on the device — the card is drawn on a canvas
 * here, never uploaded and never rendered by us. The link is deliberately just
 * the app: it carries no name, no score and no identifier, so forwarding it
 * exposes nothing about the person. A public page about someone is a product
 * decision, not a share button, and this needs neither.
 */
const APP_URL = "https://privaapp.com.br";

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Native share when the platform can take a file; a download otherwise. */
async function shareFile(blob: Blob, filename: string, type: string) {
  const file = new File([blob], filename, { type });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.canShare?.({ files: [file] }) && nav.share) {
    try {
      await nav.share({ files: [file], title: "Meu Priva ID" });
      return;
    } catch {
      /* dismissed — fall through to the download */
    }
  }
  download(blob, filename);
}

export function PrivaIdShareSheet({ data, onClose }: { data: PrivaIdData; onClose: () => void }) {
  const [busy, setBusy] = useState<"png" | "pdf" | null>(null);
  const [copied, setCopied] = useState(false);

  const asImage = async () => {
    setBusy("png");
    try {
      const blob = await renderPrivaIdPng(data);
      await shareFile(blob, "priva-id.png", "image/png");
      track("PrivaIdShared");
      gaEvent("priva_id_shared", { format: "png" });
    } catch {
      /* nothing to show — the sheet stays open so they can try again */
    }
    setBusy(null);
  };

  const asPdf = async () => {
    setBusy("pdf");
    try {
      const png = await renderPrivaIdPng(data);
      const dataUrl = await new Promise<string>((resolve) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result));
        r.readAsDataURL(png);
      });
      // Loaded on demand: the PDF renderer is heavy and most people never
      // open this sheet at all.
      const { pdf, Document, Page, Image, View } = await import("@react-pdf/renderer");
      const doc = (
        <Document>
          <Page size="A6" orientation="landscape" style={{ padding: 12 }}>
            <View style={{ width: "100%", height: "100%" }}>
              <Image src={dataUrl} style={{ width: "100%" }} />
            </View>
          </Page>
        </Document>
      );
      const blob = await pdf(doc).toBlob();
      await shareFile(blob, "priva-id.pdf", "application/pdf");
      track("PrivaIdShared");
      gaEvent("priva_id_shared", { format: "pdf" });
    } catch {
      /* ignore */
    }
    setBusy(null);
  };

  const asLink = async () => {
    const text = `Testei minha exposição de dados na Priva. Faça o seu: ${APP_URL}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Priva", text, url: APP_URL });
        track("PrivaIdShared");
        gaEvent("priva_id_shared", { format: "link" });
        return;
      } catch {
        /* dismissed */
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      gaEvent("priva_id_shared", { format: "link" });
    } catch {
      /* clipboard blocked */
    }
  };

  const Option = ({
    icon: Icon,
    title,
    sub,
    onClick,
    loading,
  }: {
    icon: typeof ImageIcon;
    title: string;
    sub: string;
    onClick: () => void;
    loading?: boolean;
  }) => (
    <button
      onClick={onClick}
      disabled={busy !== null}
      className="flex w-full items-center gap-3 rounded-2xl border border-border bg-background px-4 py-3.5 text-left transition active:scale-[0.99] disabled:opacity-60"
    >
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl"
        style={{ backgroundColor: "rgba(79,70,229,0.10)" }}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" style={{ color: "#4F46E5" }} />
        ) : (
          <Icon className="h-4 w-4" style={{ color: "#4F46E5" }} />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-bold leading-tight text-foreground">{title}</span>
        <span className="block text-[11.5px] leading-tight text-muted-foreground">{sub}</span>
      </span>
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-t-3xl border border-border bg-card p-6 pb-8 sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Compartilhar Priva ID"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[18px] font-bold text-foreground">Compartilhar Priva ID</h2>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
              A imagem e o PDF são gerados no seu aparelho.
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-secondary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-2">
          <Option
            icon={ImageIcon}
            title="Imagem"
            sub="PNG do seu cartão"
            onClick={() => void asImage()}
            loading={busy === "png"}
          />
          <Option
            icon={FileText}
            title="PDF"
            sub="Uma página, pronta para anexar"
            onClick={() => void asPdf()}
            loading={busy === "pdf"}
          />
          <Option
            icon={copied ? Check : Link2}
            title={copied ? "Link copiado" : "Link"}
            sub="Convite para o app — não leva dados seus"
            onClick={() => void asLink()}
          />
        </div>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
          <Copy className="h-3 w-3" /> Valores aparecem mascarados, como na tela
        </p>
      </div>
    </div>
  );
}
