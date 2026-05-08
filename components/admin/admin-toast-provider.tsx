"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, Loader2, X, XCircle } from "lucide-react";

type ToastKind = "loading" | "success" | "error";

type ToastItem = {
  id: string;
  kind: ToastKind;
  message: string;
};

type AdminToastApi = {
  showLoading: (message: string, id?: string) => string;
  success: (message: string, id?: string) => string;
  error: (message: string, id?: string) => string;
  dismiss: (id: string) => void;
};

const AdminToastContext = createContext<AdminToastApi | null>(null);

function randomId() {
  return `t_${Math.random().toString(36).slice(2, 10)}`;
}

export function AdminToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const upsert = useCallback((kind: ToastKind, message: string, existingId?: string) => {
    const id = existingId ?? randomId();
    setToasts((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      if (idx === -1) return [...prev, { id, kind, message }];
      const next = [...prev];
      next[idx] = { id, kind, message };
      return next;
    });
    if (kind !== "loading") {
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 2200);
    }
    return id;
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const api = useMemo<AdminToastApi>(
    () => ({
      showLoading: (message: string, id?: string) => upsert("loading", message, id),
      success: (message: string, id?: string) => upsert("success", message, id),
      error: (message: string, id?: string) => upsert("error", message, id),
      dismiss,
    }),
    [upsert, dismiss]
  );

  return (
    <AdminToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[140] flex w-[min(420px,92vw)] flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-start gap-2 rounded-lg border border-border bg-background/95 px-3 py-2 shadow-lg backdrop-blur"
          >
            {toast.kind === "loading" ? (
              <Loader2 size={15} className="mt-0.5 shrink-0 animate-spin text-blue-600" />
            ) : toast.kind === "success" ? (
              <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600" />
            ) : (
              <XCircle size={15} className="mt-0.5 shrink-0 text-red-600" />
            )}
            <p className="flex-1 text-xs text-foreground">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="rounded p-0.5 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              aria-label="Dismiss toast"
            >
              <X size={13} />
            </button>
          </div>
        ))}
      </div>
    </AdminToastContext.Provider>
  );
}

export function useAdminToast(): AdminToastApi {
  const ctx = useContext(AdminToastContext);
  if (!ctx) {
    throw new Error("useAdminToast must be used inside AdminToastProvider.");
  }
  return ctx;
}
