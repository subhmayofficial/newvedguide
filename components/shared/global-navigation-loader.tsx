"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const SHOW_DELAY_MS = 150;

export function GlobalNavigationLoader() {
  const pathname = usePathname();
  const search = useSearchParams();
  const [visible, setVisible] = useState(false);
  const showTimerRef = useRef<number | null>(null);

  function clearTimer() {
    if (showTimerRef.current != null) {
      window.clearTimeout(showTimerRef.current);
      showTimerRef.current = null;
    }
  }

  function scheduleShow() {
    clearTimer();
    showTimerRef.current = window.setTimeout(() => {
      setVisible(true);
    }, SHOW_DELAY_MS);
  }

  useEffect(() => {
    function onClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const anchor = target.closest("a[href]") as HTMLAnchorElement | null;
      if (anchor) {
        const href = anchor.getAttribute("href") ?? "";
        if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
        scheduleShow();
        return;
      }

      const submitBtn = target.closest("button[type='submit'],input[type='submit']");
      if (submitBtn) {
        scheduleShow();
      }
    }

    function onFormSubmit() {
      scheduleShow();
    }

    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onFormSubmit, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onFormSubmit, true);
      clearTimer();
    };
  }, []);

  useEffect(() => {
    clearTimer();
    setVisible(false);
  }, [pathname, search]);

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
