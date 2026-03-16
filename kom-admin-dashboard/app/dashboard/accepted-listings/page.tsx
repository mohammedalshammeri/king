"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAcceptedListings, reactivateListing } from "../../../lib/services/moderation";
import type { ListingSummary, PaginatedResponse } from "../../../lib/types";
import { Loader } from "../../../components/ui/loader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "../../../components/ui/toast";

const typeLabels: Record<string, string> = {
  CAR: "سيارة",
  PLATE: "لوحة",
  PART: "قطعة",
};

const ownerLabels: Record<string, string> = {
  USER_INDIVIDUAL: "فرد",
  USER_SHOWROOM: "معرض",
};

export default function AcceptedListingsPage() {
  const [data, setData] = useState<PaginatedResponse<ListingSummary> | null>(null);
  const [loading, setLoading] = useState(true);
  const { pushToast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await getAcceptedListings();
      setData(response);
    } catch {
      pushToast({ type: "error", message: "تعذر تحميل الإعلانات المقبولة" });
    } finally {
      setLoading(false);
    }
  };

  const handleReactivate = async (id: string) => {
    if (!confirm("هل أنت متأكد من إعادة تفعيل هذا الإعلان لمدة 30 يوم؟")) return;
    try {
      await reactivateListing(id);
      pushToast({ type: "success", message: "تم إعادة تفعيل الإعلان بنجاح" });
      loadData();
    } catch {
      pushToast({ type: "error", message: "فشل إعادة التفعيل" });
    }
  };

  const getDaysRemaining = (expiresAt?: string | null) => {
    if (!expiresAt) return <span className="text-gray-400">غير محدد</span>;
    const date = new Date(expiresAt);
    const diff = date.getTime() - new Date().getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    const dateStr = date.toLocaleDateString("ar", { year: "numeric", month: "short", day: "numeric" });

    if (days <= 0) {
      return (
        <div>
          <div className="text-xs text-gray-500">{dateStr}</div>
          <Badge variant="destructive">منتهي</Badge>
        </div>
      );
    }

    if (days <= 3) {
      return (
        <div>
          <div className="text-xs text-gray-500">{dateStr}</div>
          <span className="text-red-500 font-bold text-xs">{days} يوم متبقٍ</span>
        </div>
      );
    }

    return (
      <div>
        <div className="text-xs text-gray-700">{dateStr}</div>
        <span className="text-xs text-gray-400">{days} يوم متبقٍ</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-black/60">
        <Loader />
        جاري تحميل الإعلانات المقبولة...
      </div>
    );
  }

  if (!data?.data || data.data.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-black/10 bg-white p-8 text-center">
        <div className="mb-4 rounded-full bg-green-50 p-4">
          <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold">لا توجد إعلانات مقبولة</h3>
        <p className="mt-1 text-sm text-black/60">
          لم يتم قبول أي إعلانات حتى الآن.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl shadow-sm bg-white overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 text-sm font-semibold flex justify-between items-center border-b border-gray-100">
          <span>الإعلانات المقبولة (النشطة)</span>
          <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
            {data.total} إعلان
          </Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 font-medium">
              <tr>
                <th className="p-3 text-right">رقم الإعلان</th>
                <th className="p-3 text-right">العنوان</th>
                <th className="p-3 text-right">النوع</th>
                <th className="p-3 text-right">السعر</th>
                <th className="p-3 text-right">المالك</th>
                <th className="p-3 text-right">تاريخ النشر</th>
                <th className="p-3 text-right">ينتهي في</th>
                <th className="p-3 text-right">الحالة</th>
                <th className="p-3 text-right">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.map((listing) => (
                <tr key={listing.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-0">
                  <td className="p-3">
                    <Link className="text-black underline font-mono" href={`/dashboard/listings/${listing.id}`}>
                      {listing.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="p-3 max-w-[200px] truncate" title={listing.title}>
                    {listing.title}
                  </td>
                  <td className="p-3">
                    <Badge variant="secondary">{typeLabels[listing.type] ?? listing.type}</Badge>
                  </td>
                  <td className="p-3 font-medium">{Number(listing.price).toLocaleString()} د.ب</td>
                  <td className="p-3">
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                      {ownerLabels[listing.ownerType] ?? "مستخدم"}
                    </span>
                  </td>
                  <td className="p-3 text-gray-500">
                    {listing.postedAt ? new Date(listing.postedAt).toLocaleDateString("ar") : "-"}
                  </td>
                  <td className="p-3 font-medium">
                    {getDaysRemaining(listing.expiresAt)}
                  </td>
                  <td className="p-3">
                     {listing.status === "APPROVED" ? (
                       <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0">
                          مقبول
                       </Badge>
                     ) : listing.status === "EXPIRED" ? (
                       <Badge variant="destructive">
                          منتهي الصلاحية
                       </Badge>
                     ) : (
                       <Badge variant="outline">{listing.status}</Badge>
                     )}
                  </td>
                  <td className="p-3">
                    {listing.status === "EXPIRED" && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 text-xs border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800"
                        onClick={() => handleReactivate(listing.id)}
                      >
                        تجديد
                      </Button>
                    )}
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
