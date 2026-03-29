import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { saveScrollPosition, restoreScrollPosition } from "@/lib/persistedUiStore";

/**
 * Persists and restores scroll position per pathname.
 * Auto-saves on scroll (debounced), restores on mount/route change.
 */
export function useScrollPersistence() {
  const { pathname } = useLocation();
  const restoredRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  // Restore scroll on route change
  useEffect(() => {
    restoredRef.current = false;
    const scrollY = restoreScrollPosition(pathname);
    // Delay slightly to allow DOM to render
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY);
      restoredRef.current = true;
    });
  }, [pathname]);

  // Save scroll on scroll events (debounced)
  useEffect(() => {
    const handleScroll = () => {
      if (!restoredRef.current) return;
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        saveScrollPosition(pathname);
      }, 300);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [pathname]);

  // Flush on beforeunload
  useEffect(() => {
    const flush = () => saveScrollPosition(pathname);
    window.addEventListener("beforeunload", flush);
    return () => window.removeEventListener("beforeunload", flush);
  }, [pathname]);
}
