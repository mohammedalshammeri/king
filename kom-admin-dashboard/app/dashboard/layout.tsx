"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "../../components/layout/sidebar";
import { Topbar } from "../../components/layout/topbar";
import { useAuth } from "../../context/auth-context";
import { Loader } from "../../components/ui/loader";

const superAdminOnly = ["/dashboard/admin-users", "/dashboard/settings", "/dashboard/audit-logs"];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
    if (!loading && user && user.role !== "SUPER_ADMIN" && superAdminOnly.includes(pathname)) {
      router.replace("/dashboard");
    }
  }, [loading, user, pathname, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader className="h-6 w-6" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center gap-4 p-4">
        <div className="text-black/60">
          جاري التحويل إلى صفحة الدخول...
        </div>
        <div className="text-sm text-gray-500">
          يجب تسجيل الدخول للوصول إلى لوحة التحكم
        </div>
        <button 
           onClick={() => router.replace("/login")}
           className="px-4 py-2 bg-primary text-white text-sm rounded-md hover:bg-primary/90 transition-colors"
        >
           الانتقال إلى صفحة الدخول
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />
      <div className="flex flex-1 flex-col w-full min-w-0">
        <Topbar onMenuClick={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
