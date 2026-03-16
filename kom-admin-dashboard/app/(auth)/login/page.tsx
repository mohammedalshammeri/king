"use client";

import type React from "react";
import { useState } from "react";
import { useAuth } from "../../../context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "../../../components/ui/input";
import { Card } from "../../../components/ui/card";
import { Loader } from "../../../components/ui/loader";
import { useToast } from "../../../components/ui/toast";

export default function LoginPage() {
  const { login } = useAuth();
  const { pushToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      pushToast({ type: "error", message: "يرجى إدخال البريد وكلمة المرور" });
      return;
    }
    try {
      setLoading(true);
      await login(email, password);
    } catch (error: any) {
      const message = error?.response?.data?.message || "فشل تسجيل الدخول";
      pushToast({ type: "error", message: Array.isArray(message) ? message[0] : message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f7f7] px-4">
      <Card className="w-full max-w-md p-6">
        <div className="mb-6 text-center">
          <h1 className="text-lg font-semibold">تسجيل الدخول</h1>
          <p className="text-sm text-black/60">لوحة تحكم ملك السوق</p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-xs text-black/60">البريد الإلكتروني</label>
            <Input
              type="email"
              placeholder="info@kotm.app"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-2 block text-xs text-black/60">كلمة المرور</label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? <Loader className="h-4 w-4" /> : "دخول"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
