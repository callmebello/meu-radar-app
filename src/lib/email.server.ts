import process from "node:process";

// Brevo SMTP mailer. SERVER ONLY (.server.ts keeps creds out of the client
// bundle). Reads BREVO_SMTP_* from env. Degrades to a no-op when unconfigured
// so callers can stay best-effort.

export type MailAttachment = { filename: string; content: Buffer; contentType?: string };

const SENDER = process.env.BREVO_SENDER || "Priva <contato@privaapp.com.br>";

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  attachments?: MailAttachment[];
}): Promise<{ ok: boolean; reason?: string }> {
  const host = process.env.BREVO_SMTP_HOST;
  const port = Number(process.env.BREVO_SMTP_PORT || 587);
  const user = process.env.BREVO_SMTP_LOGIN;
  const pass = process.env.BREVO_SMTP_PASS;
  if (!host || !user || !pass) return { ok: false, reason: "smtp_not_configured" };

  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // 587 uses STARTTLS
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: SENDER,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
      attachments: opts.attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType ?? "application/pdf",
      })),
    });
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : "send_failed" };
  }
}

// Internal address that receives the manual-send LGPD notifications.
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "contato@privaapp.com.br";
