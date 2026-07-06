import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseAdmin } from "../supabase.server";

// Generates the "Solicitação de Eliminação de Dados Pessoais" PDF (plano
// Proteção Total) from the user's scan + their saved LGPD authorization, uploads
// it to Supabase Storage ('cartas-lgpd'), and returns a 7-day signed URL.

export const generateCartaLgpdPdf = createServerFn({ method: "POST" })
  .inputValidator(z.object({ userId: z.string() }))
  .handler(
    async ({
      data,
    }): Promise<{ ok: boolean; url?: string; sourceUrl?: string | null; reason?: string }> => {
      const admin = getSupabaseAdmin();
      if (!admin) return { ok: false, reason: "not_configured" };

      try {
        const { generateCartaForUser } = await import("../pdf/render.server");
        const res = await generateCartaForUser(admin, data.userId);
        if (!res) return { ok: false, reason: "user_not_found" };
        return { ok: true, url: res.url, sourceUrl: res.sourceUrl };
      } catch (e) {
        return { ok: false, reason: e instanceof Error ? e.message : "generate_failed" };
      }
    },
  );
