"use client";

import { useEffect, useState } from "react";
import { getReports, resolveReport } from "../../../lib/services/reports";
import type { PaginatedResponse, ReportItem } from "../../../lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader } from "../../../components/ui/loader";
import { Modal } from "../../../components/ui/modal";
import { Textarea } from "../../../components/ui/textarea";
import { useToast } from "../../../components/ui/toast";

const statusLabels: Record<string, { label: string; variant: "secondary" | "success" | "warning" | "destructive" }> = {
  OPEN: { label: "مفتوح", variant: "warning" },
  UNDER_REVIEW: { label: "قيد المراجعة", variant: "secondary" },
  RESOLVED: { label: "تم الحل", variant: "success" },
  DISMISSED: { label: "مرفوض", variant: "destructive" },
};

const typeLabels: Record<string, string> = {
  LISTING: "بلاغ إعلان",
  COMPLAINT: "شكوى",
};

export default function ReportsPage() {
  const { pushToast } = useToast();
  const [data, setData] = useState<PaginatedResponse<ReportItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [selected, setSelected] = useState<ReportItem | null>(null);
  const [open, setOpen] = useState(false);
  const [resolution, setResolution] = useState("");

  const load = async () => {
    try {
      const response = await getReports();
      setData(response);
    } catch {
      pushToast({ type: "error", message: "تعذر تحميل البلاغات" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleResolve = async (action: "resolve" | "dismiss") => {
    if (!selected) return;
    try {
      setActionLoading(true);
      await resolveReport(selected.id, { action, resolution: resolution.trim() || undefined });
      pushToast({ type: "success", message: "تم تحديث البلاغ" });
      setOpen(false);
      setResolution("");
      await load();
    } catch (error: any) {
      const message = error?.response?.data?.message || "فشل تحديث البلاغ";
      pushToast({ type: "error", message: Array.isArray(message) ? message[0] : message });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-black/60">
        <Loader />
        جاري تحميل البلاغات...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl shadow-sm bg-white overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 text-sm font-semibold border-b border-gray-100">البلاغات</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 font-medium">
              <tr>
                <th className="p-3 text-right">النوع</th>
                <th className="p-3 text-right">السبب</th>
                <th className="p-3 text-right">الحالة</th>
                <th className="p-3 text-right">تاريخ البلاغ</th>
                <th className="p-3 text-right">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {data?.data?.map((report) => {
                const status = statusLabels[report.status] || { label: report.status, variant: "secondary" as const };
                return (
                  <tr key={report.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-0">
                    <td className="p-3 text-gray-700">{typeLabels[report.type] || report.type}</td>
                    <td className="p-3">{report.reason}</td>
                    <td className="p-3">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </td>
                    <td className="p-3">{new Date(report.createdAt).toLocaleDateString("ar")}</td>
                    <td className="p-3">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => {
                          setSelected(report);
                          setOpen(true);
                        }}
                      >
                        معالجة
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="معالجة البلاغ">
        <div className="space-y-4">
          <Textarea
            placeholder="ملاحظات القرار (اختياري)"
            value={resolution}
            onChange={(e) => setResolution(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={() => handleResolve("dismiss")} disabled={actionLoading}>
              رفض البلاغ
            </Button>
            <Button onClick={() => handleResolve("resolve")} disabled={actionLoading}>
              حل البلاغ
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
