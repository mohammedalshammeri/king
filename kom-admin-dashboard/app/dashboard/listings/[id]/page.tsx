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

function toText(value: unknown, fallback = "-"): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : fallback;
  }
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
}

function toNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export default function ListingDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { pushToast } = useToast();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
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

  useEffect(() => {
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
  }, [params.id, pushToast]);

  const ownerName = useMemo(() => {
    if (!listing?.owner) return "-";
    return listing.owner.individualProfile?.fullName || listing.owner.showroomProfile?.showroomName || listing.owner.email;
  }, [listing]);

  const handleApprove = async () => {
    if (!confirm("هل أنت متأكد من قبول الإعلان؟")) return;
    try {
      setActionLoading(true);
      await approveListing(params.id);
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
    if (rejectReason.trim().length < 10) {
      pushToast({ type: "error", message: "سبب الرفض يجب أن يكون 10 أحرف على الأقل" });
      return;
    }
    try {
      setActionLoading(true);
      await rejectListing(params.id, rejectReason.trim());
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
      <div className="flex items-center gap-2 text-sm text-black/60">
        <Loader />
        جاري تحميل الإعلان...
      </div>
    );
  }

  if (!listing) {
    return <div className="text-sm text-black/60">لا توجد بيانات</div>;
  }

  const carBodyType = toText(listing.carDetails?.bodyType, "");
  const carTrim = toText(listing.carDetails?.trim, "");
  const carEngineSize = toText(listing.carDetails?.engineSize, "");
  const carVin = toText(listing.carDetails?.vin, "");

  const plateCode = toText(listing.plateDetails?.plateCode, "");

  const partBrand = toText(listing.partDetails?.brand, "");
  const partNumber = toText(listing.partDetails?.partNumber, "");
  const partCompatibleMake = toText(listing.partDetails?.compatibleCarMake, "");
  const partCompatibleModel = toText(listing.partDetails?.compatibleCarModel, "");
  const partYearFrom = toNumber(listing.partDetails?.compatibleYearFrom);
  const partYearTo = toNumber(listing.partDetails?.compatibleYearTo);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">تفاصيل الإعلان</h2>
          <p className="text-sm text-black/60">{listing.title}</p>
        </div>
        <div className="flex items-center gap-2">
          {listing.status === "PENDING_REVIEW" && (
            <>
              <Button 
                variant="default" 
                onClick={handleApprove} 
                disabled={actionLoading} 
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                قبول الإعلان
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => setRejectOpen(true)} 
                disabled={actionLoading}
                className="gap-2"
              >
                <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                رفض الإعلان
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold text-gray-900">الصور والفيديوهات ({media.length})</span>
          </div>
          
          {media.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {media.map((item, index) => (
                <div key={index} className="aspect-video relative rounded-lg bg-gray-50 overflow-hidden shadow-sm group border border-gray-100">
                  {item.type === "VIDEO" ? (
                     <video src={item.url} controls className="h-full w-full object-contain" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="block h-full w-full">
                      <img src={item.url} alt={`media-${index}`} className="h-full w-full object-cover hover:scale-105 transition-transform duration-500" />
                    </a>
                  )}
                  <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded-md backdrop-blur-md">
                    {item.type === "VIDEO" ? "فيديو" : "صورة"}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex min-h-[200px] items-center justify-center rounded-lg bg-gray-50 border border-dashed border-gray-200 text-sm text-gray-400">
              لا توجد وسائط
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-xl bg-white shadow-sm p-6">
            <h3 className="mb-4 text-base font-semibold text-gray-900 border-b border-gray-50 pb-2">معلومات الإعلان</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <span className="text-gray-500 text-xs">نوع الإعلان</span>
                <div className="font-medium text-gray-900">{typeLabels[listing.type] ?? listing.type}</div>
              </div>
              <div className="space-y-1">
                <span className="text-gray-500 text-xs">السعر</span>
                <div className="font-medium text-gray-900 font-mono text-base">{Number(listing.price).toFixed(3)} د.ب</div>
              </div>
              <div className="space-y-1">
                <span className="text-gray-500 text-xs">الحالة</span>
                <div>
                  <Badge variant="outline" className="font-medium">{statusLabels[listing.status] ?? listing.status}</Badge>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-gray-500 text-xs">تاريخ الإضافة</span>
                <div className="font-medium text-gray-900">{listing.postedAt ? new Date(listing.postedAt).toLocaleDateString("ar") : "-"}</div>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-white shadow-sm p-6">
            <h3 className="mb-4 text-base font-semibold text-gray-900 border-b border-gray-50 pb-2">معلومات المالك</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <span className="text-gray-500 text-xs">الاسم</span>
                <div className="font-medium text-gray-900">{ownerName}</div>
              </div>
              <div className="space-y-1">
                <span className="text-gray-500 text-xs">البريد</span>
                <div className="font-medium text-gray-900">{listing.owner.email}</div>
              </div>
              <div className="space-y-1">
                <span className="text-gray-500 text-xs">الحالة</span>
                <div className={`font-medium ${listing.owner.isBanned ? "text-red-500" : "text-emerald-600"}`}>
                  {listing.owner.isBanned ? "محظور" : "نشط"}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-gray-500 text-xs">عدد الإعلانات</span>
                <div className="font-medium text-gray-900">{listing.ownerStats?.totalListings ?? 0}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white shadow-sm p-6">
        <h3 className="mb-4 text-base font-semibold text-gray-900">تفاصيل إضافية</h3>
        <div className="space-y-4">
          {listing.carDetails && (
            <div>
              <div className="mb-2 text-sm font-medium text-black/80">تفاصيل السيارة</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-black/60">الصانع</span>
                  <div className="font-medium">{toText(listing.carDetails.make)}</div>
                </div>
                <div>
                  <span className="text-black/60">الموديل</span>
                  <div className="font-medium">{toText(listing.carDetails.model)}</div>
                </div>
                <div>
                  <span className="text-black/60">السنة</span>
                  <div className="font-medium">{toText(listing.carDetails.year)}</div>
                </div>
                <div>
                  <span className="text-black/60">الحالة</span>
                  <div className="font-medium">
                    {toText(listing.carDetails.condition) === "NEW"
                      ? "جديدة"
                      : toText(listing.carDetails.condition) === "USED"
                        ? "مستعملة"
                        : "ممتازة"}
                  </div>
                </div>
                <div>
                  <span className="text-black/60">الكيلومترات</span>
                  <div className="font-medium">{(toNumber(listing.carDetails.mileageKm)?.toLocaleString() ?? "-")} كم</div>
                </div>
                <div>
                  <span className="text-black/60">ناقل الحركة</span>
                  <div className="font-medium">{toText(listing.carDetails.transmission) === "AUTO" ? "أوتوماتيك" : "يدوي"}</div>
                </div>
                <div>
                  <span className="text-black/60">نوع الوقود</span>
                  <div className="font-medium">
                    {toText(listing.carDetails.fuel) === "PETROL"
                      ? "بنزين"
                      : toText(listing.carDetails.fuel) === "DIESEL"
                        ? "ديزل"
                        : toText(listing.carDetails.fuel) === "HYBRID"
                          ? "هايبرد"
                          : "كهربائي"}
                  </div>
                </div>
                <div>
                  <span className="text-black/60">اللون</span>
                  <div className="font-medium">{toText(listing.carDetails.color)}</div>
                </div>
                {carBodyType ? (
                  <div>
                    <span className="text-black/60">نوع الهيكل</span>
                    <div className="font-medium">{carBodyType}</div>
                  </div>
                ) : null}
                {carTrim ? (
                  <div>
                    <span className="text-black/60">الفئة</span>
                    <div className="font-medium">{carTrim}</div>
                  </div>
                ) : null}
                {carEngineSize ? (
                  <div>
                    <span className="text-black/60">حجم المحرك</span>
                    <div className="font-medium">{carEngineSize}</div>
                  </div>
                ) : null}
                {carVin ? (
                  <div className="col-span-2">
                    <span className="text-black/60">رقم الهيكل (VIN)</span>
                    <div className="font-medium font-mono text-xs">{carVin}</div>
                  </div>
                ) : null}
              </div>
            </div>
          )}
          {listing.plateDetails && (
            <div>
              <div className="mb-2 text-sm font-medium text-black/80">تفاصيل اللوحة</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-black/60">رقم اللوحة</span>
                  <div className="font-medium font-mono text-lg">{toText(listing.plateDetails.plateNumber)}</div>
                </div>
                <div>
                  <span className="text-black/60">الفئة</span>
                  <div className="font-medium">{toText(listing.plateDetails.plateCategory)}</div>
                </div>
                {plateCode ? (
                  <div>
                    <span className="text-black/60">الرمز</span>
                    <div className="font-medium">{plateCode}</div>
                  </div>
                ) : null}
              </div>
            </div>
          )}
          {listing.partDetails && (
            <div>
              <div className="mb-2 text-sm font-medium text-black/80">تفاصيل القطعة</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-black/60">اسم القطعة</span>
                  <div className="font-medium">{toText(listing.partDetails.partName)}</div>
                </div>
                <div>
                  <span className="text-black/60">الفئة</span>
                  <div className="font-medium">{toText(listing.partDetails.partCategory)}</div>
                </div>
                <div>
                  <span className="text-black/60">الحالة</span>
                  <div className="font-medium">
                    {toText(listing.partDetails.condition) === "NEW"
                      ? "جديدة"
                      : toText(listing.partDetails.condition) === "USED"
                        ? "مستعملة"
                        : "ممتازة"}
                  </div>
                </div>
                {partBrand ? (
                  <div>
                    <span className="text-black/60">العلامة التجارية</span>
                    <div className="font-medium">{partBrand}</div>
                  </div>
                ) : null}
                {partNumber ? (
                  <div>
                    <span className="text-black/60">رقم القطعة</span>
                    <div className="font-medium font-mono text-xs">{partNumber}</div>
                  </div>
                ) : null}
                {partCompatibleMake ? (
                  <div>
                    <span className="text-black/60">متوافقة مع</span>
                    <div className="font-medium">{partCompatibleMake} {partCompatibleModel}</div>
                  </div>
                ) : null}
                {(partYearFrom !== null || partYearTo !== null) ? (
                  <div>
                    <span className="text-black/60">سنوات التوافق</span>
                    <div className="font-medium">
                      {(partYearFrom ?? "-")} - {(partYearTo ?? "-")}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title="سبب رفض الإعلان">
        <div className="space-y-4">
          <Textarea
            placeholder="اكتب سبب الرفض بشكل واضح"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setRejectOpen(false)}>
              إلغاء
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={actionLoading}>
              تأكيد الرفض
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
