"use client";

import { AuthProvider } from "../context/auth-context";
import { AdminI18nProvider } from "../context/i18n-context";
import { ToastProvider } from "../components/ui/toast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AdminI18nProvider>
        <AuthProvider>{children}</AuthProvider>
      </AdminI18nProvider>
    </ToastProvider>
  );
}
