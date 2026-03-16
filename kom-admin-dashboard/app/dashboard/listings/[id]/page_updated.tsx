"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { approveListing, getListingForReview, rejectListing } from "../../../../lib/services/moderation";
import type { ListingDetail } from "../../../../lib/types";
import { Button } from "@/components/ui/button";
import { Loader } from "../../../../components/ui/loader";
import { Modal } from "../../../../components/ui/modal";
import { Textarea } from "../../../../components/ui/textarea";
import { useToast } from "../../../../components/ui/toast";
import { Badge } from "@/components/ui/badge";

export default function ListingDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { pushToast } = useToast();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [mediaIndex, setMediaIndex] = useState(0);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const typeLabels: Record<string, string> = {
    CAR: "سيارة",
    PLATE: "لوحة",
    PART: "قطعة",
  };

  const statusLabels: Record<string, string> = {
    PENDING_REVIEW: "قيد المراجعة",
    APPROVED: "مقبول",
    REJECTED: "مرفوض",
    DRAFT: "مسودة",
    ARCHIVED: "مؤرشف",
    SOLD: "مباع",
  };

  const media = listing?.media ?? [];
  const currentMedia = media[mediaIndex];

  useEffect(() => {
    if (!params?.id) return;
    const load = async () => {
      try {
        const data = await getListingForReview(params.id);
        setListing(data);
      } catch {
        pushToast({ type: "error", message: "تعذر تحميل تفاصيل الإعلان" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params?.id, pushToast]);

  const ownerName = useMemo(() => {
    if (!listing?.owner) return "-";
    return listing.owner.individualProfile?.fullName || listing.owner.showroomProfile?.showroomName || listing.owner.email;
  }, [listing]);

  const handleApprove = async () => {
    if (!confirm("هل أنت متأكد من قبول الإعلان؟")) return;
    const id = params?.id;
    if (!id) return;
    try {
      setActionLoading(true);
      await approveListing(id);
      pushToast({ type: "success", message: "تم قبول الإعلان" });
      router.push("/dashboard/listings");
    } catch (error: any) {
      const message = error?.response?.data?.message || "فشل قبول الإعلان";
      pushToast({ type: "error", message: Array.isArray(message) ? message[0] : message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (rejectReason.trim().length < 5) {
      pushToast({ type: "error", message: "سبب الرفض يجب أن يكون 5 أحرف على الأقل" });
      return;
    }
    const id = params?.id;
    if (!id) return;

    try {
      setActionLoading(true);
      await rejectListing(id, rejectReason.trim());
      pushToast({ type: "success", message: "تم رفض الإعلان" });
      setRejectOpen(false);
      router.push("/dashboard/listings");
    } catch (error: any) {
      const message = error?.response?.data?.message || "فشل رفض الإعلان";
      pushToast({ type: "error", message: Array.isArray(message) ? message[0] : message });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-3 text-sm text-muted-foreground animate-in fade-in zoom-in duration-300">
        <Loader className="h-8 w-8 text-primary" />
        <p>جاري تحميل الإعلان...</p>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-black/60">
        <p>لا توجد بيانات للإعلان</p>
        <Button variant="outline" onClick={() => router.back()}>العودة للقائمة</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight">تفاصيل الإعلان</h2>
            <Badge variant={listing.status === "PENDING_REVIEW" ? "warning" : "default"}>
              {statusLabels[listing.status] ?? listing.status}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{listing.title}</p>
        </div>
        <div className="flex items-center gap-2">
           <Button variant="outline" onClick={() => router.back()}>
            إلغاء
          </Button>
          <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={handleApprove} disabled={actionLoading}>
            {actionLoading ? "جاري المعالجة..." : "✅ قبول الإعلان"}
          </Button>
          <Button variant="destructive" onClick={() => setRejectOpen(true)} disabled={actionLoading}>
            ❌ رفض الإعلان
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Media Preview */}
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold">الصور والفيديوهات ({media.length})</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMediaIndex((prev) => (prev > 0 ? prev - 1 : media.length - 1))}
                disabled={media.length <= 1}
              >
                ←
              </Button>
              <span className="text-xs">{media.length > 0 ? `${mediaIndex + 1} / ${media.length}` : "0 / 0"}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMediaIndex((prev) => (prev + 1) % Math.max(media.length, 1))}
                disabled={media.length <= 1}
              >
                →
              </Button>
            </div>
          </div>
          <div className="relative flex aspect-video items-center justify-center rounded-lg bg-black/5 overflow-hidden">
            {currentMedia ? (
              currentMedia.type === "VIDEO" ? (
                <video src={currentMedia.url} controls className="h-full w-full object-contain" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={currentMedia.url} alt="media" className="h-full w-full object-contain" />
              )
            ) : (
              <div className="flex flex-col items-center gap-2 text-black/40">
                <span className="text-4xl">📷</span>
                <span className="text-sm">لا توجد وسائط</span>
              </div>
            )}
          </div>
          {media.length > 0 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
              {media.map((m, i) => (
                <button
                  key={i}
                  onClick={() => setMediaIndex(i)}
                  className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition-all ${
                    i === mediaIndex ? "border-primary ring-2 ring-primary/20" : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.thumbnailUrl || m.url} alt={`thumb-${i}`} className="h-full w-full object-cover" />
                  {m.type === "VIDEO" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 text-white">
                      ▶
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info Cards */}
        <div className="space-y-4">
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              معلومات الإعلان
            </h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
              <div>
                <span className="text-muted-foreground block text-xs">نوع الإعلان</span>
                <div className="font-medium">{typeLabels[listing.type] ?? listing.type}</div>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">السعر</span>
                <div className="font-medium text-lg text-green-600">{Number(listing.price).toFixed(3)} د.ب</div>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">العملة</span>
                <div className="font-medium">{listing.currency}</div>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs">تاريخ الإضافة</span>
                <div className="font-medium">{listing.postedAt ? new Date(listing.postedAt).toLocaleDateString("ar") : "-"}</div>
              </div>
            </div>
            {listing.description && (
               <div className="mt-4 border-t pt-3">
                 <span className="text-muted-foreground block text-xs mb-1">الوصف</span>
                 <p className="text-sm leading-relaxed text-gray-700">{listing.description}</p>
               </div>
            )}
          </div>

          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-primary">
               <span className="h-1.5 w-1.5 rounded-full bg-primary" />
               معلومات المالك
            </h3>
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                 {ownerName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                 <div className="font-medium">{ownerName}</div>
                 <div className="text-xs text-muted-foreground">{listing.owner.email}</div>
              </div>
              <div className="text-right">
                 <Badge variant={listing.owner.isBanned ? "destructive" : "secondary"}>
                    {listing.owner.isBanned ? "محظور" : "نشط"}
                 </Badge>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Details Section */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold">تفاصيل إضافية</h3>
        <div className="grid gap-3 text-sm">
          {listing.carDetails && (
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">مواصفات السيارة</div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 bg-gray-50 p-4 rounded-lg">
                  {Object.entries(listing.carDetails).map(([k, v]) => (
                     <div key={k}>
                        <span className="block text-xs text-gray-400 capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span className="font-medium">{String(v)}</span>
                     </div>
                  ))}
              </div>
            </div>
          )}
          {listing.plateDetails && (
            <div>
              <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">تفاصيل اللوحة</div>
              <pre className="rounded-lg bg-gray-50 p-3 text-xs font-mono">{JSON.stringify(listing.plateDetails, null, 2)}</pre>
            </div>
          )}
          {listing.partDetails && (
            <div>
               <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">تفاصيل القطعة</div>
               <pre className="rounded-lg bg-gray-50 p-3 text-xs font-mono">{JSON.stringify(listing.partDetails, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>

      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title="رفض الإعلان">
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">يرجى كتابة سبب رفض هذا الإعلان. سيتم إرسال السبب للمستخدم.</p>
          <Textarea
            placeholder="مثال: الصور غير واضحة، السعر غير منطقي..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="min-h-[100px]"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setRejectOpen(false)}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={actionLoading || rejectReason.length < 5}>
              تأكيد الرفض
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
