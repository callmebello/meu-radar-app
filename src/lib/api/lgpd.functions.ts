import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseAdmin } from "../supabase.server";
import type { StoredScanResult } from "../pdf/types";

// Records the user's formal LGPD authorization (Proteção Total) and sends an
// internal notification e-mail to the admin so the removal letter can be
// generated + sent manually (Model B). The e-mail is best-effort: a failure to
// send never blocks the user flow (the dashboard unlocks on { ok: true }).

export const saveLgpdAuthorization = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      userId: z.string().optional(),
      email: z.string().email().optional(),
      fullName: z.string().min(2),
    }),
  )
  .handler(async ({ data }): Promise<{ ok: boolean; reason?: string }> => {
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

    const { data: authRow, error: insErr } = await admin
      .from("lgpd_authorizations")
      .insert({ user_id: userId, full_name: data.fullName, cpf_hash: cpfHash, ip_address: ip })
      .select("authorized_at")
      .maybeSingle();
    if (insErr) return { ok: false, reason: insErr.message };

    const authorizedAt = (authRow?.authorized_at as string) || new Date().toISOString();

    // Internal admin notification — best-effort, must not block the user flow.
    try {
      const { data: scanRow } = await admin
        .from("scans")
        .select("result, breach_count")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const result = ((scanRow?.result as StoredScanResult) ?? {}) as StoredScanResult;
      const breachCount =
        result.hibp?.count ?? (scanRow?.breach_count as number) ?? result.breachCount ?? 0;
      const breachNames = (result.hibp?.breaches ?? [])
        .map((b) => b.name)
        .filter(Boolean)
        .slice(0, 8)
        .join(", ");
      const ex = result.exposure;
      const sourceItems: string[] = [
        ...(ex?.github?.repos ?? []).map((r) => `Repositório: ${r.repo || r.url}`),
        ...(ex?.cpf?.sources ?? []).map((sc) => `Web (CPF): ${sc.link || sc.title}`),
        ...(ex?.phone?.sources ?? []).map((sc) => `Web (telefone): ${sc.link || sc.title}`),
      ];
      const sourcesStr = sourceItems.length
        ? sourceItems.join("; ")
        : "nenhuma fonte pública direta";
      const whenFmt = (() => {
        const d = new Date(authorizedAt);
        return isNaN(d.getTime())
          ? authorizedAt
          : d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
      })();
      const scanSummary =
        `${breachCount} vazamento(s) de e-mail` +
        (breachNames ? ` (${breachNames})` : "") +
        ` · fontes públicas: ${sourcesStr}`;

      const { sendEmail, ADMIN_EMAIL } = await import("../email.server");
      await sendEmail({
        to: ADMIN_EMAIL,
        subject: "🔔 Nova solicitação de remoção LGPD — ação necessária",
        text:
          `Nova solicitação de remoção LGPD\n\n` +
          `Nome: ${data.fullName}\n` +
          `E-mail: ${email || "—"}\n` +
          `CPF (hash): ${cpfHash || "—"}\n` +
          `Data da autorização: ${whenFmt}\n` +
          `Dados encontrados no scan: ${scanSummary}\n\n` +
          `Ação necessária: gerar carta LGPD e enviar ao controlador identificado, com o usuário em CC.`,
        html:
          `<h3>Nova solicitação de remoção LGPD</h3>` +
          `<p><strong>Nome:</strong> ${data.fullName}</p>` +
          `<p><strong>E-mail:</strong> ${email || "—"}</p>` +
          `<p><strong>CPF (hash):</strong> <code>${cpfHash || "—"}</code></p>` +
          `<p><strong>Data da autorização:</strong> ${whenFmt}</p>` +
          `<p><strong>Dados encontrados no scan:</strong> ${scanSummary}</p>` +
          `<p><strong>Ação necessária:</strong> gerar carta LGPD e enviar ao controlador identificado, com o usuário em CC.</p>`,
      });
    } catch {
      /* fire-and-forget — a failed notification never blocks the user */
    }

    return { ok: true };
  });
