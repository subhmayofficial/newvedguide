"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type DropdownOption = {
  value: string;
  label: string;
  /** Tailwind classes for the dot indicator */
  dotClass?: string;
  /** If provided, renders a coloured initial-avatar instead of a dot */
  avatarClass?: string;
};

type Props = {
  value: string;
  options: DropdownOption[];
  pending?: boolean;
  onSelect: (v: string) => void;
  /** Extra classes on the trigger button */
  className?: string;
};

// ─── Leading indicator (dot or avatar) ────────────────────────────────────

function Indicator({
  opt,
  size = "dot",
}: {
  opt: DropdownOption;
  size?: "dot" | "menu";
}) {
  if (opt.avatarClass) {
    return (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded font-bold text-white",
          size === "dot" ? "h-4 w-4 text-[9px]" : "h-[18px] w-[18px] text-[10px]",
          opt.avatarClass
        )}
      >
        {opt.label.charAt(0)}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "shrink-0 rounded-full",
        size === "dot" ? "h-[5px] w-[5px]" : "h-[6px] w-[6px]",
        opt.dotClass ?? "bg-zinc-400 dark:bg-zinc-500"
      )}
    />
  );
}

// ─── Main component ────────────────────────────────────────────────────────

export function AdminStatusDropdown({
  value,
  options,
  pending,
  onSelect,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const [domReady, setDomReady] = useState(false);

  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const current = options.find((o) => o.value === value);

  // Portal needs document.body — only available after hydration
  useEffect(() => {
    const id = requestAnimationFrame(() => setDomReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  // Close on outside interaction
  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: MouseEvent) {
      if (
        menuRef.current?.contains(e.target as Node) ||
        btnRef.current?.contains(e.target as Node)
      ) return;
      setOpen(false);
    }
    function onScrollOrResize() { setOpen(false); }

    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("scroll", onScrollOrResize, { capture: true, passive: true });
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [open]);

  function handleTrigger() {
    if (open) { setOpen(false); return; }
    if (!btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setCoords({ top: r.bottom + 4, left: r.left, width: r.width });
    setOpen(true);
  }

  // ── Trigger button ────────────────────────────────────────────────────

  const trigger = (
    <button
      ref={btnRef}
      type="button"
      disabled={!!pending}
      onClick={handleTrigger}
      className={cn(
        // base
        "inline-flex h-[26px] min-w-[112px] select-none items-center gap-1.5 rounded-md border border-border bg-card px-2 text-[11px] font-medium",
        // transitions
        "transition-all duration-150",
        // states
        open  && "ring-1 ring-ring/25 border-ring/30",
        !open && !pending && "hover:border-foreground/20 hover:bg-muted/40 cursor-pointer",
        pending && "cursor-wait opacity-50",
        className
      )}
    >
      {pending ? (
        <>
          <Loader2 size={10} className="shrink-0 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Saving…</span>
        </>
      ) : (
        <>
          <Indicator opt={current ?? { value, label: value }} size="dot" />
          <span className="flex-1 truncate text-foreground">
            {current?.label ?? value}
          </span>
          <ChevronDown
            size={9}
            className={cn(
              "shrink-0 text-muted-foreground/50 transition-transform duration-150",
              open && "rotate-180"
            )}
          />
        </>
      )}
    </button>
  );

  // ── Dropdown menu (rendered in portal so it escapes overflow:auto) ─────

  const menu =
    open && domReady
      ? createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: coords.top,
              left: coords.left,
              minWidth: Math.max(coords.width, 148),
              zIndex: 9999,
            }}
            className="admin-shell overflow-hidden rounded-xl border border-border bg-card shadow-2xl shadow-black/[0.10] dark:shadow-black/40 animate-in fade-in-0 zoom-in-95 slide-in-from-top-1 duration-[120ms]"
          >
            <div className="p-1">
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      if (!isSelected) onSelect(opt.value);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-lg px-2.5 py-[6px] text-[12px] font-medium text-left",
                      "transition-colors duration-75",
                      isSelected
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <Indicator opt={opt} size="menu" />
                    <span className="flex-1">{opt.label}</span>
                    {isSelected && (
                      <Check size={10} className="ml-auto shrink-0 text-foreground/60" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      {trigger}
      {menu}
    </>
  );
}
