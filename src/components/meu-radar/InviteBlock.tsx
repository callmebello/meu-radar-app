import { useState } from "react";
import { Check, Gift, Share2 } from "lucide-react";
import { track, gaEvent } from "@/lib/analytics";

/**
 * Invite, at the foot of the free tools.
 *
 * It sits where someone has just finished a check and has a reason to say
 * "look at this" — and it costs nothing to give away, since the link carries
 * no data about the sender. Hidden for subscribers: they already paid, and the
 * bottom of every screen is not the place to keep asking them for something.
 */
const APP_URL = "https://privaapp.com.br";
const TEXT = `Testei se meus dados vazaram na Priva, achei útil. Faça o seu: ${APP_URL}`;

export function InviteBlock() {
  const [copied, setCopied] = useState(false);

  const invite = async () => {
    track("InviteShared");
    gaEvent("invite_shared");
    if (navigator.share) {
      try {
        await navigator.share({ title: "Priva", text: TEXT, url: APP_URL });
        return;
      } catch {
        /* dismissed */
      }
    }
    try {
      await navigator.clipboard.writeText(TEXT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  };

  return (
    <button
      onClick={() => void invite()}
      className="mx-5 mb-4 mt-6 flex w-[calc(100%-2.5rem)] items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 text-left transition active:scale-[0.99]"
    >
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
        style={{ backgroundColor: "rgba(79,70,229,0.10)" }}
      >
        <Gift className="h-4 w-4" style={{ color: "#4F46E5" }} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-bold leading-tight text-foreground">
          Convide alguém
        </span>
        <span className="block text-[11.5px] leading-tight text-muted-foreground">
          {copied ? "Link copiado" : "Mande a Priva para quem você quer proteger"}
        </span>
      </span>
      {copied ? (
        <Check className="h-4 w-4 shrink-0" style={{ color: "var(--color-success)" }} />
      ) : (
        <Share2 className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}
    </button>
  );
}
