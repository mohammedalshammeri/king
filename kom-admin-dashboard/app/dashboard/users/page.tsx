"use client";

import { useEffect, useState } from "react";
import { banUser, getUsers, unbanUser } from "../../../lib/services/admin";
import type { PaginatedResponse, UserProfile } from "../../../lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader } from "../../../components/ui/loader";
import { Modal } from "../../../components/ui/modal";
import { Textarea } from "../../../components/ui/textarea";
import { useToast } from "../../../components/ui/toast";

const roleLabels: Record<string, string> = {
  USER_INDIVIDUAL: "فرد",
  USER_SHOWROOM: "معرض",
};

export default function UsersPage() {
  const [data, setData] = useState<PaginatedResponse<UserProfile> | null>(null);
  const [loading, setLoading] = useState(true);
  const [banOpen, setBanOpen] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const { pushToast } = useToast();

  const load = async () => {
    try {
      const response = await getUsers();
      setData(response);
    } catch {
      pushToast({ type: "error", message: "تعذر تحميل المستخدمين" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleBan = async () => {
    if (!selectedUser) return;
    if (banReason.trim().length < 10) {
      pushToast({ type: "error", message: "سبب الحظر يجب أن يكون 10 أحرف على الأقل" });
      return;
    }
    try {
      setActionLoading(true);
      await banUser(selectedUser.id, banReason.trim());
      pushToast({ type: "success", message: "تم حظر المستخدم" });
      setBanOpen(false);
      setBanReason("");
      await load();
    } catch (error: any) {
      const message = error?.response?.data?.message || "فشل حظر المستخدم";
      pushToast({ type: "error", message: Array.isArray(message) ? message[0] : message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnban = async (user: UserProfile) => {
    if (!confirm("هل أنت متأكد من فك الحظر؟")) return;
    try {
      setActionLoading(true);
      await unbanUser(user.id);
      pushToast({ type: "success", message: "تم فك حظر المستخدم" });
      await load();
    } catch (error: any) {
      const message = error?.response?.data?.message || "فشل فك الحظر";
      pushToast({ type: "error", message: Array.isArray(message) ? message[0] : message });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-black/60">
        <Loader />
        جاري تحميل المستخدمين...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl shadow-sm bg-white overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 text-sm font-semibold border-b border-gray-100">إدارة المستخدمين</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 font-medium">
              <tr>
                <th className="p-3 text-right">الاسم</th>
                <th className="p-3 text-right">البريد</th>
                <th className="p-3 text-right">النوع</th>
                <th className="p-3 text-right">تاريخ التسجيل</th>
                <th className="p-3 text-right">الحالة</th>
                <th className="p-3 text-right">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400 text-sm">
                    لا يوجد مستخدمون مسجلون حتى الآن
                  </td>
                </tr>
              )}
              {data?.data?.map((user) => (
                <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-0">
                  <td className="p-3 font-medium">
                    {user.individualProfile?.fullName ?? user.showroomProfile?.showroomName ?? '—'}
                  </td>
                  <td className="p-3 text-gray-600">{user.email}</td>
                  <td className="p-3">{roleLabels[user.role] ?? user.role}</td>
                  <td className="p-3 text-gray-500 text-xs">
                    {new Date(user.createdAt).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  <td className="p-3">
                    {user.isBanned ? (
                      <Badge variant="destructive">محظور</Badge>
                    ) : !user.isActive ? (
                      <Badge variant="warning">قيد المراجعة</Badge>
                    ) : (
                      <Badge variant="success">نشط</Badge>
                    )}
                  </td>
                  <td className="p-3">
                    {user.isBanned ? (
                      <Button size="sm" variant="secondary" onClick={() => handleUnban(user)} disabled={actionLoading}>
                        فك الحظر
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          setSelectedUser(user);
                          setBanOpen(true);
                        }}
                        disabled={actionLoading}
                      >
                        حظر
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={banOpen} onClose={() => setBanOpen(false)} title="سبب الحظر">
        <div className="space-y-4">
          <Textarea
            placeholder="اكتب سبب الحظر"
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setBanOpen(false)}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={handleBan} disabled={actionLoading}>
              تأكيد الحظر
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
