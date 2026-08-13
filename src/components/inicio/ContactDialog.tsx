import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Check, Loader2, Send, X } from "lucide-react";
import { toast } from "sonner";
import { sendContactMessage } from "@/lib/api/contact.functions";
import { LP } from "./theme";
import { ContactCtx } from "./contact-context";

/**
 * Contact form as a dialog rather than a section at the bottom of the page.
 *
 * At the end of the scroll it was the last thing anyone would reach; as a
 * dialog it can be opened from the nav, from the companies block and from the
 * footer, at the moment the visitor actually wants to talk.
 */
const field =
  "w-full rounded-xl bg-white px-4 py-3 text-[14px] outline-none transition-colors placeholder:text-[#A0A0AE] focus:border-indigo-500";
const fieldStyle = { border: "1px solid rgba(17,17,26,0.12)", color: LP.text };

function Label({ children }: { children: ReactNode }) {
  return (
    <label className="mb-1.5 block text-[13px] font-semibold" style={{ color: LP.text }}>
      {children}
    </label>
  );
}

function Dialog({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", message: "" });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    // Stop the page behind from scrolling while the dialog is up.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const set =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const valid =
    form.name.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) &&
    form.message.trim().length >= 5;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid || sending) return;
    setSending(true);
    try {
      const res = await sendContactMessage({
        data: {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          company: form.company.trim() || undefined,
          message: form.message.trim(),
        },
      });
      if (res.ok) setSent(true);
      // Never claim it was sent when SMTP is unconfigured or refused it.
      else toast.error("Não conseguimos enviar agora. Escreva para contato@privaapp.com.br.");
    } catch {
      toast.error("Não conseguimos enviar agora. Escreva para contato@privaapp.com.br.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto p-5 py-10"
      style={{ backgroundColor: "rgba(5,5,13,0.6)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-[560px] rounded-3xl bg-white p-7 sm:p-8"
        style={{ boxShadow: "0 24px 70px rgba(5,5,13,0.35)" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Falar com a Priva"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <img src="/PRIVA_mark.png" alt="" className="mb-3 h-11 w-11 object-contain" />
            <h2 className="text-[21px] font-bold" style={{ color: LP.text }}>
              Fale com a gente
            </h2>
            <p className="mt-1 text-[13.5px] leading-relaxed" style={{ color: LP.muted }}>
              Dúvidas sobre os planos, privacidade ou uso na sua empresa.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full transition-colors hover:bg-black/5"
            style={{ color: LP.muted }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {sent ? (
          <div className="py-8 text-center">
            <span
              className="mx-auto grid h-14 w-14 place-items-center rounded-full"
              style={{ backgroundColor: "rgba(15,169,104,0.12)" }}
            >
              <Check className="h-7 w-7" strokeWidth={2.4} style={{ color: LP.green }} />
            </span>
            <h3 className="mt-5 text-[20px] font-bold" style={{ color: LP.text }}>
              Mensagem enviada
            </h3>
            <p className="mt-2 text-[14px]" style={{ color: LP.muted }}>
              Recebemos seu contato e respondemos em {form.email}.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="lp-cta mt-6 rounded-2xl px-6 py-3 text-[14px] font-bold text-white"
              style={{ background: `linear-gradient(135deg, ${LP.violet}, ${LP.indigo})` }}
            >
              Fechar
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Nome</Label>
              <input
                value={form.name}
                onChange={set("name")}
                placeholder="Seu nome"
                className={field}
                style={fieldStyle}
                required
              />
            </div>
            <div>
              <Label>E-mail</Label>
              <input
                type="email"
                value={form.email}
                onChange={set("email")}
                placeholder="seu@email.com"
                className={field}
                style={fieldStyle}
                required
              />
            </div>
            <div>
              <Label>Telefone</Label>
              <input
                value={form.phone}
                onChange={set("phone")}
                inputMode="tel"
                placeholder="(00) 00000-0000"
                className={field}
                style={fieldStyle}
              />
            </div>
            <div>
              <Label>
                Empresa <span style={{ color: LP.muted }}>(opcional)</span>
              </Label>
              <input
                value={form.company}
                onChange={set("company")}
                placeholder="Nome da empresa"
                className={field}
                style={fieldStyle}
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Mensagem</Label>
              <textarea
                value={form.message}
                onChange={set("message")}
                rows={4}
                placeholder="Como podemos ajudar?"
                className={`${field} resize-none`}
                style={fieldStyle}
                required
              />
            </div>

            <button
              type="submit"
              disabled={!valid || sending}
              className="lp-cta mt-1 flex items-center justify-center gap-2 rounded-2xl py-4 text-[15px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-40 sm:col-span-2"
              style={{ background: `linear-gradient(135deg, ${LP.violet}, ${LP.indigo})` }}
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Enviando...
                </>
              ) : (
                <>
                  Enviar mensagem <Send className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export function ContactProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const value = { open: useCallback(() => setOpen(true), []) };
  return (
    <ContactCtx.Provider value={value}>
      {children}
      {open && <Dialog onClose={() => setOpen(false)} />}
    </ContactCtx.Provider>
  );
}
