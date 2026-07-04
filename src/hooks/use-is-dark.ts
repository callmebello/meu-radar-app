import { useEffect, useState } from "react";

// Tracks the live theme by observing the `.dark` class on <html>, so theme-aware
// assets (logos, icons) swap instantly no matter which component toggled it.
export function useIsDark() {
  const [isDark, setIsDark] = useState(() =>
    // SSR always renders <html class="dark"> (dark is the default theme), so default
    // to true on the server to avoid a first-paint flash of the light-theme (black)
    // logo on the dark background. On the client we read the real class.
    typeof document === "undefined" ? true : document.documentElement.classList.contains("dark"),
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
