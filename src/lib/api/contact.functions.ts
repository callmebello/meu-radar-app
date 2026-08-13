import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { ADMIN_EMAIL, sendEmail } from "../email.server";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Contact form on the institutional landing. Sends the message to the Priva
 * inbox with the sender's address as Reply-To in the body, so answering is one
 * click. Nothing is persisted — this is a message, not a lead record.
 */
export const sendContactMessage = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      name: z.string().min(2).max(120),
      email: z.string().email(),
      phone: z.string().max(40).optional(),
      company: z.string().max(120).optional(),
      message: z.string().min(5).max(4000),
    }),
  )
  .handler(async ({ data }): Promise<{ ok: boolean; reason?: string }> => {
    const rows: [string, string][] = [
      ["Nome", data.name],
      ["E-mail", data.email],
      ["Telefone", data.phone || "—"],
      ["Empresa", data.company || "—"],
    ];

    const html = `
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#11111A">
        <h2 style="margin:0 0 16px">Nova mensagem pelo site</h2>
        <table cellpadding="6" style="border-collapse:collapse;margin-bottom:16px">
          ${rows
            .map(
              ([k, v]) =>
                `<tr><td style="color:#656575">${k}</td><td><strong>${esc(v)}</strong></td></tr>`,
            )
            .join("")}
        </table>
        <p style="color:#656575;margin:0 0 6px">Mensagem</p>
        <div style="white-space:pre-wrap;border-left:3px solid #6366F1;padding-left:12px">${esc(
          data.message,
        )}</div>
      </div>`;

    const res = await sendEmail({
      to: ADMIN_EMAIL,
      subject: `Contato pelo site — ${data.name}${data.company ? ` (${data.company})` : ""}`,
      html,
      text: `${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\nMensagem:\n${data.message}`,
    });

    return res;
  });
