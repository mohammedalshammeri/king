"use client";

import { useEffect, useState } from "react";
import { createAdmin, getAdminUsers, updateAdminPermissions } from "../../../lib/services/admin";
import type { AdminUser, PaginatedResponse } from "../../../lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "../../../components/ui/input";
import { Loader } from "../../../components/ui/loader";
import { useToast } from "../../../components/ui/toast";

export default function AdminUsersPage() {
  const { pushToast } = useToast();
  const [data, setData] = useState<PaginatedResponse<AdminUser> | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ email: "", password: "", canReviewListings: true, canManageUsers: false, canViewReports: true });
  const [actionLoading, setActionLoading] = useState(false);

  const load = async () => {
    try {
      const response = await getAdminUsers();
      setData(response);
    } catch {
      pushToast({ type: "error", message: "تعذر تحميل الأدمن" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!form.email || !form.password) {
      pushToast({ type: "error", message: "يرجى إدخال البريد وكلمة المرور" });
      return;
    }
    try {
      setActionLoading(true);
      await createAdmin({
        email: form.email,
        password: form.password,
        permissions: {
          canReviewListings: form.canReviewListings,
          canManageUsers: form.canManageUsers,
          canViewReports: form.canViewReports,
        },
      });
      pushToast({ type: "success", message: "تم إضافة الأدمن" });
      setForm({ email: "", password: "", canReviewListings: true, canManageUsers: false, canViewReports: true });
      await load();
    } catch (error: any) {
      const message = error?.response?.data?.message || "فشل إضافة الأدمن";
      pushToast({ type: "error", message: Array.isArray(message) ? message[0] : message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdatePermissions = async (admin: AdminUser) => {
    try {
      setActionLoading(true);
      await updateAdminPermissions(admin.id, admin.adminPermission ?? {});
      pushToast({ type: "success", message: "تم تحديث الصلاحيات" });
      await load();
    } catch (error: any) {
      const message = error?.response?.data?.message || "فشل تحديث الصلاحيات";
      pushToast({ type: "error", message: Array.isArray(message) ? message[0] : message });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-black/60">
        <Loader />
        جاري تحميل الأدمن...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white shadow-sm p-6">
        <h3 className="mb-6 text-base font-semibold text-gray-900 border-b border-gray-100 pb-2">إضافة أدمن جديد</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">البريد الإلكتروني</label>
            <Input className="h-10" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">كلمة المرور</label>
            <Input className="h-10" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className="flex items-end">
            <Button className="h-10 w-full" onClick={handleCreate} disabled={actionLoading}>إضافة</Button>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-6 text-sm">
          <label className="flex items-center gap-2 cursor-pointer text-gray-700 hover:text-gray-900">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
              checked={form.canReviewListings}
              onChange={(e) => setForm({ ...form, canReviewListings: e.target.checked })}
            />
            مراجعة الإعلانات
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-gray-700 hover:text-gray-900">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
              checked={form.canManageUsers}
              onChange={(e) => setForm({ ...form, canManageUsers: e.target.checked })}
            />
            إدارة المستخدمين
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-gray-700 hover:text-gray-900">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
              checked={form.canViewReports}
              onChange={(e) => setForm({ ...form, canViewReports: e.target.checked })}
            />
            عرض البلاغات
          </label>
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm overflow-hidden border-none text-right">
        <div className="border-b border-gray-100 px-6 py-4 text-base font-semibold text-gray-800">قائمة الأدمن</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="p-4 text-right">البريد</th>
                <th className="p-4 text-right">الدور</th>
                <th className="p-4 text-right">الصلاحيات</th>
                <th className="p-4 text-right">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.map((admin) => (
                <tr key={admin.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-gray-900 font-medium">{admin.email}</td>
                  <td className="p-4">
                     <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${admin.role === "SUPER_ADMIN" ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}`}>
                       {admin.role === "SUPER_ADMIN" ? "سوبر أدمن" : "أدمن"}
                     </span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-4">
                      <label className="flex items-center gap-2 text-gray-600">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 disabled:opacity-50"
                          checked={admin.adminPermission?.canReviewListings ?? false}
                          disabled={admin.role === "SUPER_ADMIN"}
                          onChange={(e) =>
                            setData((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    data: prev.data.map((item) =>
                                      item.id === admin.id
                                        ? {
                                            ...item,
                                            adminPermission: {
                                              ...item.adminPermission,
                                              canReviewListings: e.target.checked,
                                            },
                                          }
                                        : item
                                    ),
                                  }
                                : prev
                            )
                          }
                        />
                        <span className="text-xs">مراجعة الإعلانات</span>
                      </label>
                      <label className="flex items-center gap-2 text-gray-600">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 disabled:opacity-50"
                          checked={admin.adminPermission?.canManageUsers ?? false}
                          disabled={admin.role === "SUPER_ADMIN"}
                          onChange={(e) =>
                            setData((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    data: prev.data.map((item) =>
                                      item.id === admin.id
                                        ? {
                                            ...item,
                                            adminPermission: {
                                              ...item.adminPermission,
                                              canManageUsers: e.target.checked,
                                            },
                                          }
                                        : item
                                    ),
                                  }
                                : prev
                            )
                          }
                        />
                        <span className="text-xs">إدارة المستخدمين</span>
                      </label>
                      <label className="flex items-center gap-2 text-gray-600">
                        <input
                          type="checkbox"
                          className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4 disabled:opacity-50"
                          checked={admin.adminPermission?.canViewReports ?? false}
                          disabled={admin.role === "SUPER_ADMIN"}
                          onChange={(e) =>
                            setData((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    data: prev.data.map((item) =>
                                      item.id === admin.id
                                        ? {
                                            ...item,
                                            adminPermission: {
                                              ...item.adminPermission,
                                              canViewReports: e.target.checked,
                                            },
                                          }
                                        : item
                                    ),
                                  }
                                : prev
                            )
                          }
                        />
                        <span className="text-xs">عرض البلاغات</span>
                      </label>
                    </div>
                  </td>
                  <td className="p-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-primary hover:text-primary/80 hover:bg-primary/5"
                      onClick={() => handleUpdatePermissions(admin)}
                      disabled={actionLoading || admin.role === "SUPER_ADMIN"}
                    >
                      حفظ
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
