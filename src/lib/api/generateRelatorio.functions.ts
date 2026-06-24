import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseAdmin } from "../supabase.server";

// Generates the "Relatório de Exposição Digital" PDF (plano Essencial) from the
// user's persisted scan, uploads it to Supabase Storage ('relatorios'), and
// returns a 7-day signed URL. Optionally e-mails it as an attachment (used right
// after a successful payment). All heavy deps are dynamically imported so the
// @react-pdf / nodemailer chain stays out of the client bundle.

export const generateRelatorioPdf = createServerFn({ method: "POST" })
  .inputValidator(z.object({ userId: z.string(), deliverEmail: z.boolean().optional() }))
  .handler(async ({ data }): Promise<{ ok: boolean; url?: string; reason?: string }> => {
    const admin = getSupabaseAdmin();
    if (!admin) return { ok: false, reason: "not_configured" };

    const { fetchUserAndScan, renderRelatorioBuffer, uploadAndSign } = await import("../pdf/render.server");
    const { user, scan } = await fetchUserAndScan(admin, data.userId);
    if (!user) return { ok: false, reason: "user_not_found" };

    const result = scan?.result ?? {};
    const buffer = await renderRelatorioBuffer({
      name: result.name || user.email,
      email: user.email,
      scanDate: scan?.created_at,
      result,
    });

    let url: string;
    try {
      url = await uploadAndSign(admin, "relatorios", `${data.userId}/relatorio.pdf`, buffer);
    } catch (e) {
      return { ok: false, reason: e instanceof Error ? e.message : "upload_failed" };
    }

    if (data.deliverEmail) {
      try {
        const { sendEmail } = await import("../email.server");
        await sendEmail({
          to: user.email,
          subject: "Seu Relatório de Exposição Digital — Priva",
          html: `<p>Olá,</p><p>Seu relatório completo de exposição digital está pronto e segue em anexo.</p>
                 <p>Você também pode acessá-lo por este link (válido por 7 dias): <a href="${url}">${url}</a></p>
                 <p>— Equipe Priva</p>`,
          text: `Seu relatório de exposição digital está em anexo. Link (7 dias): ${url}`,
          attachments: [{ filename: "relatorio-priva.pdf", content: buffer }],
        });
      } catch {
        /* best-effort — the URL is still returned */
      }
    }

    return { ok: true, url };
  });
