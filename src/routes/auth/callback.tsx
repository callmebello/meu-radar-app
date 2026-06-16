import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { toast } from "sonner";
import { getUser } from "@/lib/auth";
import { markUserPaid } from "@/lib/api/account.functions";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({ meta: [{ title: "Entrando — Priva" }] }),
  component: AuthCallback,
});

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let done = false;
    (async () => {
      try {
        // Supabase parses the magic-link session from the URL automatically.
        const user = await getUser();
        if (user?.email) {
          const plan =
            (typeof localStorage !== "undefined" && localStorage.getItem("priva_plan")) || "essencial";
          try {
            await markUserPaid({ data: { email: user.email, plan } });
          } catch {
            /* best-effort */
          }
          try {
            localStorage.setItem("priva_is_paid", "true");
            if (!localStorage.getItem("priva_plan")) localStorage.setItem("priva_plan", plan);
          } catch {
            /* ignore */
          }
          toast.success("Bem-vindo ao Priva! Sua proteção está ativa.");
        }
      } finally {
        if (!done) navigate({ to: "/" });
      }
    })();
    return () => {
      done = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "#0A0A0F" }}>
      <div className="flex flex-col items-center gap-4">
        <span className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500/30 border-t-indigo-400" />
        <p className="text-sm text-gray-400">Entrando na sua conta...</p>
      </div>
    </div>
  );
}
