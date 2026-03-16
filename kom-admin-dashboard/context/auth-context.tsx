"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getMe, login as loginRequest, logout as logoutRequest } from "../lib/services/auth";
import {
  clearAccessToken,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from "../lib/token";
import type { AuthUser } from "../lib/types";
import { useToast } from "../components/ui/toast";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { pushToast } = useToast();

  const refreshUser = async () => {
    try {
      const token = getAccessToken();
      if (!token) {
        setUser(null);
        return;
      }
      const me = await getMe();
      setUser({ id: me.id, email: me.email, role: me.role });
    } catch (error: any) {
      if (error?.response?.status === 401) {
        // Token expired or invalid - silent logout
        clearAccessToken();
        setUser(null);
        if (window.location.pathname !== '/login') {
             router.replace('/login');
        }
        return;
      }
      console.error("Failed to refresh user:", error);
      clearAccessToken();
      setUser(null);
      // Optional: Redirect to login if 401? Layout handles this.
    }
  };

  const login = async (email: string, password: string) => {
    const response = await loginRequest({ email, password });
    setAccessToken(response.accessToken);
    setRefreshToken(response.refreshToken);
    
    // استدعاء بيانات المستخدم وتخزينها
    const me = await getMe();
    setUser({ id: me.id, email: me.email, role: me.role });

    pushToast({ type: "success", message: "تم تسجيل الدخول بنجاح" });
    router.replace("/dashboard");
  };

  const logout = async () => {
    try {
      const refreshToken = getRefreshToken();
      await logoutRequest(refreshToken || "");
    } catch {
      // ignore
    } finally {
      clearAccessToken();
      setUser(null);
      pushToast({ type: "success", message: "تم تسجيل الخروج" });
      router.replace("/login");
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await refreshUser();
      setLoading(false);
    };
    init();
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout, refreshUser }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth يجب أن يُستخدم داخل AuthProvider");
  }
  return ctx;
}
