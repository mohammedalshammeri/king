"use client";

import { AuthProvider } from "../context/auth-context";
import { ToastProvider } from "../components/ui/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AuthProvider>{children}</AuthProvider>
    </ToastProvider>
  );
}
