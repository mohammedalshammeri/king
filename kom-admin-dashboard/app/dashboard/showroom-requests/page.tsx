"use client";

import { useEffect, useState } from "react";
import { getUsers } from "../../../lib/services/admin";
import type { PaginatedResponse, UserProfile } from "../../../lib/types";
import { Loader } from "../../../components/ui/loader";
import { useToast } from "../../../components/ui/toast";
import { Badge } from "@/components/ui/badge";

export default function ShowroomRequestsPage() {
  const [data, setData] = useState<PaginatedResponse<UserProfile> | null>(null);
  const [loading, setLoading] = useState(true);
  const { pushToast } = useToast();

  const load = async () => {
    try {
      const response = await getUsers({ role: "USER_SHOWROOM" });
      setData(response);
    } catch {
      pushToast({ type: "error", message: "تعذر تحميل بيانات المعارض" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-black/60">
        <Loader />
        جاري تحميل الطلبات...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        حسابات الفرد والمعرض تُفعّل مباشرة عند التسجيل. هذه الصفحة تعرض أحدث حسابات المعارض فقط للمتابعة، وليس للموافقة اليدوية.
      </div>
       <div className="rounded-xl shadow-sm bg-white overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 text-sm font-semibold border-b border-gray-100">المعارض المسجلة حديثاً</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 font-medium">
              <tr>
                <th className="p-3 text-right">اسم المعرض</th>
                <th className="p-3 text-right">السجل التجاري</th>
                <th className="p-3 text-right">البريد الإلكتروني</th>
                <th className="p-3 text-right">رقم الهاتف</th>
                <th className="p-3 text-right">تاريخ الطلب</th>
                <th className="p-3 text-right">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.length === 0 ? (
                 <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                        لا توجد معارض مسجلة حديثاً
                    </td>
                 </tr>
              ) : (
              data?.data?.map((user) => (
                <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-0">
                  <td className="p-3 font-medium">{user.showroomProfile?.showroomName || "غير محدد"}</td>
                  <td className="p-3 font-mono text-xs">{user.showroomProfile?.crNumber || "---"}</td>
                  <td className="p-3">{user.email}</td>
                  <td className="p-3" dir="rtl">{user.phone || "-"}</td>
                  <td className="p-3 text-gray-500 text-xs">
                    {new Date(user.createdAt).toLocaleDateString("ar-BH")}
                  </td>
                  <td className="p-3">
                    <Badge className={user.isActive ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100" : "bg-amber-100 text-amber-800 hover:bg-amber-100"}>
                      {user.isActive ? "مفعل" : "غير مفعل"}
                    </Badge>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
