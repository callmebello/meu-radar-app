import { createFileRoute, useRouter } from "@tanstack/react-router";
import { Onboarding } from "@/components/onboarding/Onboarding";

/**
 * The app onboarding, on its own route while it is being built so it can be
 * opened and reviewed without touching the live funnel. Once approved it
 * becomes the first-run experience of the app build.
 */
export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Priva — Comece agora" }] }),
  component: Page,
});

function Page() {
  const router = useRouter();
  return <Onboarding onDone={() => router.navigate({ to: "/" })} />;
}
