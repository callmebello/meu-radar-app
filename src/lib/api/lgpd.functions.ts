import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseAdmin } from "../supabase.server";

// Records the user's formal LGPD authorization (Proteção Total), then — best
// effort — generates the carta-LGPD PDF and notifies the admin so the actual
// removal request can be sent manually (Model B). The dashboard only unlocks
// after { ok: true }.

export const saveLgpdAuthorization = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      userId: z.string().optional(),
      email: z.string().email().optional(),
      fullName: z.string().min(2),
    }),
  )
  .handler(async ({ data }): Promise<{ ok: boolean; cartaUrl?: string; reason?: string }> => {
    const admin = getSupabaseAdmin();
    if (!admin) return { ok: false, reason: "not_configured" };

    // Resolve the user (need id + cpf_hash for the record).
    const lookup = admin.from("users").select("id, email, cpf_hash");
    const { data: row } = data.userId
      ? await lookup.eq("id", data.userId).maybeSingle()
      : await lookup.eq("email", data.email ?? "").maybeSingle();
    if (!row) return { ok: false, reason: "user_not_found" };

    const userId = row.id as string;
    const cpfHash = (row.cpf_hash as string) ?? "";
    const email = (row.email as string) ?? data.email ?? "";

    // Best-effort client IP for the legal record.
    let ip: string | null = null;
    try {
      const mod = (await import("@tanstack/react-start/server")) as {
        getWebRequest?: () => Request | undefined;
      };
      const req = mod.getWebRequest?.();
      const xff = req?.headers?.get("x-forwarded-for");
      ip = xff ? xff.split(",")[0].trim() : null;
    } catch {
      /* ignore — column is nullable */
    }

    const { error: insErr } = await admin.from("lgpd_authorizations").insert({
      user_id: userId,
      full_name: data.fullName,
      cpf_hash: cpfHash,
      ip_address: ip,
    });
    if (insErr) return { ok: false, reason: insErr.message };

    // Generate carta + admin notification (best-effort — authorization is saved).
    let cartaUrl: string | undefined;
    try {
      const { generateCartaForUser } = await import("../pdf/render.server");
      const res = await generateCartaForUser(admin, userId);
      if (res) {
        cartaUrl = res.url;
        const { sendEmail, ADMIN_EMAIL } = await import("../email.server");
        await sendEmail({
          to: ADMIN_EMAIL,
          subject: `Nova solicitação de remoção LGPD — ${res.fullName}`,
          html: `<h3>Nova solicitação de remoção LGPD</h3>
            <p><strong>Usuário:</strong> ${res.fullName} (${res.email || email})</p>
            <p><strong>Fonte a remover:</strong> ${res.sourceUrl ?? "—"}</p>
            <p><strong>Carta gerada:</strong> <a href="${cartaUrl}">${cartaUrl}</a></p>
            <p><strong>Ação:</strong> envie esta carta ao controlador identificado, com o usuário em CC.</p>`,
          text:
            `Nova solicitação de remoção LGPD\n` +
            `Usuário: ${res.fullName} (${res.email || email})\n` +
            `Fonte a remover: ${res.sourceUrl ?? "—"}\n` +
            `Carta gerada: ${cartaUrl}\n\n` +
            `Ação: envie esta carta ao controlador identificado, com o usuário em CC.`,
        });
      }
    } catch {
      /* best-effort */
    }

    return { ok: true, cartaUrl };
  });
