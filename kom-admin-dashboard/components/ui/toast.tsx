"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import { cn } from "../../lib/utils";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  pushToast: (toast: Omit<Toast, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const pushToast = (toast: Omit<Toast, "id">) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const value = useMemo(() => ({ pushToast }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed left-6 top-6 z-50 space-y-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "rounded-lg px-4 py-3 text-sm shadow-lg",
              toast.type === "success" && "bg-emerald-600 text-white",
              toast.type === "error" && "bg-red-600 text-white",
              toast.type === "info" && "bg-black text-white"
            )}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast يجب أن يُستخدم داخل ToastProvider");
  return ctx;
}
