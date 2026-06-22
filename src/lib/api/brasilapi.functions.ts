import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type CEPResult = { valid: boolean; city?: string; state?: string; street?: string };

// CEP validation/lookup via the free BrasilAPI (no key). Validation only — not
// an exposure source.
export const validateCEP = createServerFn({ method: "POST" })
  .inputValidator(z.object({ cep: z.string() }))
  .handler(async ({ data }): Promise<CEPResult> => {
    const digits = data.cep.replace(/\D/g, "");
    if (digits.length !== 8) return { valid: false };

    try {
      const res = await fetch(`https://brasilapi.com.br/api/cep/v1/${digits}`);
      if (!res.ok) return { valid: false };
      const json = (await res.json()) as { city?: string; state?: string; street?: string };
      return { valid: true, city: json.city, state: json.state, street: json.street };
    } catch {
      return { valid: false };
    }
  });
