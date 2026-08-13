import { createContext, useContext } from "react";

/** Kept apart from the components so the dialog file stays fast-refresh clean. */
export const ContactCtx = createContext<{ open: () => void } | null>(null);

export function useContactDialog() {
  const ctx = useContext(ContactCtx);
  if (!ctx) throw new Error("useContactDialog precisa estar dentro de <ContactProvider>");
  return ctx;
}
