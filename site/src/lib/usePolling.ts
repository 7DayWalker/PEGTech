import { useEffect, useRef } from "react";

/**
 * Runs `callback` on a fixed interval for as long as the component stays
 * mounted, automatically skipping ticks while the browser tab is hidden
 * (and firing one immediate refresh the moment it becomes visible again)
 * so background tabs don't burn requests for no reason.
 *
 * Used to keep dashboard data (message history, unread badges, etc.)
 * fresh without the user ever having to reload the page.
 */
export function usePolling(callback: () => void, intervalMs: number, enabled = true) {
  const savedCallback = useRef(callback);
  savedCallback.current = callback;

  useEffect(() => {
    if (!enabled) return;
    function tick() {
      if (!document.hidden) savedCallback.current();
    }
    const id = setInterval(tick, intervalMs);
    function onVisibility() {
      if (!document.hidden) savedCallback.current();
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [intervalMs, enabled]);
}
