"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const SHOW_DELAY_MS = 150;

function isSameOriginInAppNavigation(anchor: HTMLAnchorElement): boolean {
  if (anchor.target === "_blank" || anchor.download) return false;
  const href = anchor.getAttribute("href") ?? "";
  if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
    return false;
  }
  if (href.startsWith("javascript:")) return false;
  try {
    const url = new URL(href, window.location.href);
    return url.origin === window.location.origin;
  } catch {
    return false;
  }
}

export function GlobalNavigationLoader() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [visible, setVisible] = useState(false);
  const showTimerRef = useRef<number | null>(null);

  const clearTimer = useCallback(() => {
    if (showTimerRef.current != null) {
      window.clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
  }, []);

  const scheduleShow = useCallback(() => {
    clearTimer();
    showTimerRef.current = window.setTimeout(() => {
      setVisible(true);
    }, SHOW_DELAY_MS);
  }, [clearTimer]);

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = target.closest("a[href]") as HTMLAnchorElement | null;
      if (anchor) {
        if (!isSameOriginInAppNavigation(anchor)) return;
        scheduleShow();
      }
    }

    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      clearTimer();
    };
  }, [scheduleShow, clearTimer]);

  useEffect(() => {
    clearTimer();
    const id = requestAnimationFrame(() => {
      setVisible(false);
    });
    return () => {
      cancelAnimationFrame(id);
    };
  }, [pathname, search, clearTimer]);

  if (!visible) return null;

  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[120] h-1 overflow-hidden bg-transparent">
        <div className="loader-top-progress h-full w-1/2 bg-brand" />
      </div>
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
        <div className="rounded-2xl border border-white/30 bg-background/95 px-6 py-5 shadow-xl">
          <div className="mx-auto h-11 w-11 rounded-full border-2 border-muted border-t-brand animate-spin" />
          <p className="mt-3 text-center text-sm font-medium text-foreground">Loading...</p>
        </div>
      </div>
    </>
  );
}
