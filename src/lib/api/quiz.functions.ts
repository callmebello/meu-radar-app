import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getSupabaseAdmin } from "../supabase.server";
import { addBrevoContact } from "../brevo.server";

/**
 * Ties everything we know about a lead together, in one call.
 *
 * The quiz answers are the only first-party statement of intent we get — what
 * they fear, which data they believe is exposed, how long they went without
 * checking. On their own, in localStorage, they are useless for marketing. Here
 * they are joined to the user row (user_id), to the identity (cpf_hash) and to
 * the scan outcome (breach count), and pushed to Brevo as contact attributes,
 * which is what actually makes segmented campaigns possible.
 *
 * Called once per scan, after saveUser/HIBP settle, so the ids exist. Entirely
 * best-effort: a missing table or Brevo key can never break the funnel.
 */
export const syncLeadProfile = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      email: z.string().email(),
      userId: z.string().uuid().nullable().optional(),
      cpfHash: z.string().max(128).optional(),
      q1: z.string().max(120).optional(),
      q2: z.array(z.string().max(60)).max(10).optional(),
      q3: z.string().max(120).optional(),
      breachCount: z.number().int().min(0).max(10000).optional(),
    }),
  )
  .handler(async ({ data }): Promise<{ ok: boolean }> => {
    const q2 = data.q2 ?? [];

    // 1. Persist the answers, linked to the user and the hashed identity.
    const admin = getSupabaseAdmin();
    let stored = false;
    if (admin) {
      try {
        const { error } = await admin.from("quiz_answers").upsert(
          {
            email: data.email,
            user_id: data.userId ?? null,
            cpf_hash: data.cpfHash ?? null,
            q1: data.q1 ?? null,
            q2,
            q3: data.q3 ?? null,
            breach_count: data.breachCount ?? null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "email" },
        );
        stored = !error;
      } catch {
        /* ignore */
      }
    }

    // 2. Mirror onto the Brevo contact as attributes. Brevo attribute names are
    //    uppercase by convention; booleans per data type make list segmentation
    //    ("everyone who said their passwords are exposed") a one-click filter.
    await addBrevoContact(data.email, {
      QUIZ_ABORDAGEM: data.q1 ?? "",
      QUIZ_ULTIMA_CHECAGEM: data.q3 ?? "",
      QUIZ_EXPOSTOS: q2.join(", "),
      EXP_EMAIL: q2.includes("Meu e-mail"),
      EXP_CPF: q2.includes("Meu CPF"),
      EXP_TELEFONE: q2.includes("Meu telefone"),
      EXP_ENDERECO: q2.includes("Meu endereço"),
      EXP_SENHAS: q2.includes("Minhas senhas"),
      EXP_NAO_SABE: q2.includes("Não sei ao certo"),
      ...(typeof data.breachCount === "number" ? { VAZAMENTOS: data.breachCount } : {}),
    });

    return { ok: stored };
  });
