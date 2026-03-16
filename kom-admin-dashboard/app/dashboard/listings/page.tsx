"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getPendingListings } from "../../../lib/services/moderation";
import type { ListingSummary, PaginatedResponse } from "../../../lib/types";
import { Loader } from "../../../components/ui/loader";
import { Badge } from "@/components/ui/badge";
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

export default function PendingListingsPage() {
  const [data, setData] = useState<PaginatedResponse<ListingSummary> | null>(null);
  const [loading, setLoading] = useState(true);
  const { pushToast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const response = await getPendingListings();
        setData(response);
      } catch {
        pushToast({ type: "error", message: "تعذر تحميل الإعلانات" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [pushToast]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-black/60">
        <Loader />
        جاري تحميل الإعلانات...
      </div>
    );
  }
  if (!data?.data || data.data.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-xl border border-dashed border-black/10 bg-white p-8 text-center">
        <div className="mb-4 rounded-full bg-black/5 p-4">
          <svg className="h-8 w-8 text-black/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold">لا توجد إعلانات قيد المراجعة</h3>
        <p className="mt-1 text-sm text-black/60">
          جميع الإعلانات تمت مراجعتها، أحسنت عملاً!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-white shadow-sm overflow-hidden border-none text-right">
        <div className="border-b border-gray-100 px-6 py-4 text-base font-semibold text-gray-800">
          الإعلانات قيد المراجعة
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <tr>
                <th className="p-4 text-right">رقم الإعلان</th>
                <th className="p-4 text-right">نوع الإعلان</th>
                <th className="p-4 text-right">السعر</th>
                <th className="p-4 text-right">نوع المالك</th>
                <th className="p-4 text-right">تاريخ الإنشاء</th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.map((listing) => (
                <tr key={listing.id} className="border-t border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium">
                    <Link className="text-primary hover:text-primary/80 transition-colors" href={`/dashboard/listings/${listing.id}`}>
                      {listing.id.slice(0, 8)}
                    </Link>
                  </td>
                  <td className="p-4">
                    <Badge variant="secondary" className="font-normal">{typeLabels[listing.type] ?? listing.type}</Badge>
                  </td>
                  <td className="p-4 text-gray-600">{Number(listing.price).toFixed(3)} د.ب</td>
                  <td className="p-4 text-gray-600">{ownerLabels[listing.ownerType] ?? listing.ownerType}</td>
                  <td className="p-4 text-gray-500">
                    {listing.postedAt ? new Date(listing.postedAt).toLocaleDateString("ar") : "-"}
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
