import { useEffect, useState } from "react";

// Tracks the live theme by observing the `.dark` class on <html>, so theme-aware
// assets (logos, icons) swap instantly no matter which component toggled it.
export function useIsDark() {
  const [isDark, setIsDark] = useState(() =>
    // SSR renders the light theme by default (no .dark class), so default to false
    // on the server. On the client we read the real class (which the anti-flash
    // script in __root sets from the stored theme before hydration).
    typeof document !== "undefined" && document.documentElement.classList.contains("dark"),
  );
  useEffect(() => {
    const el = document.documentElement;
    const sync = () => setIsDark(el.classList.contains("dark"));
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return isDark;
}
