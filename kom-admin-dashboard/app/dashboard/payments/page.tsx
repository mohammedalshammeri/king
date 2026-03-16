"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getPendingPayments, getAllPayments, reviewPayment } from "../../../lib/services/payments";
import type { PaymentTransaction, PaginatedPayments, UserSubscriptionInfo } from "../../../lib/services/payments";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader } from "../../../components/ui/loader";
import { Modal } from "../../../components/ui/modal";
import { Textarea } from "../../../components/ui/textarea";
import { useToast } from "../../../components/ui/toast";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, { label: string; variant: "secondary" | "success" | "warning" | "destructive" | "default" }> = {
  PENDING:       { label: "معلقة",         variant: "warning" },
  PENDING_PROOF: { label: "قيد المراجعة",  variant: "secondary" },
  PAID:          { label: "مدفوعة",        variant: "success" },
  FAILED:        { label: "مرفوضة",        variant: "destructive" },
  REFUNDED:      { label: "مسترجعة",       variant: "default" },
};

const TYPE_LABELS: Record<string, string> = {
  LISTING_FEE:  "رسوم إعلان",
  SUBSCRIPTION: "اشتراك",
};

const MERCHANT_TYPE_ARABIC: Record<string, string> = {
  CAR_SHOWROOM:  "معرض سيارات",
  SPARE_PARTS:   "قطع غيار",
  PLATES:        "لوحات",
  MOTORCYCLES:   "دراجات نارية",
  GARAGE:        "كراج",
  OTHER:         "أخرى",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────────────────

function getUserDisplayName(tx: PaymentTransaction): string {
  if (tx.user?.showroomProfile?.showroomName) return tx.user.showroomProfile.showroomName;
  if (tx.user?.individualProfile?.fullName)   return tx.user.individualProfile.fullName;
  return tx.user?.email ?? "—";
}

function getUserType(tx: PaymentTransaction): "individual" | "showroom" | null {
  if (!tx.user?.role) return null;
  if (tx.user.role === "USER_SHOWROOM")    return "showroom";
  if (tx.user.role === "USER_INDIVIDUAL")  return "individual";
  return null;
}

function daysLeft(endDate: string): number {
  return Math.max(0, Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000));
}

// ─── Sub-components ───────────────────────────────────────────────────────────────────────────

function UserTypeBadge({ tx }: { tx: PaymentTransaction }) {
  const type = getUserType(tx);
  if (!type) return null;
  return type === "showroom" ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold px-2.5 py-0.5">
      🏪 تاجر
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-0.5">
      👤 فرد
    </span>
  );
}

function SubscriptionInfoBlock({ sub, pkg }: {
  sub?: UserSubscriptionInfo | null;
  pkg?: { name: string; durationDays: number; maxListings: number; priceMonthly: number } | null;
}) {
  const remaining = sub ? daysLeft(sub.endDate) : 0;
  const subActive = sub?.status === "ACTIVE" && remaining > 0;

  return (
    <div className="rounded-xl border border-dashed border-purple-200 dark:border-purple-700 bg-purple-50/50 dark:bg-purple-900/10 p-3 space-y-2 text-sm">
      {pkg && (
        <>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">الباقة المطلوبة:</span>
            <span className="font-bold text-purple-700 dark:text-purple-300">{pkg.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">مدة الباقة:</span>
            <span className="font-semibold">{pkg.durationDays} يوم</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">الحد الأقصى للإعلانات:</span>
            <span className="font-semibold">{pkg.maxListings} إعلان</span>
          </div>
        </>
      )}
      {sub ? (
        <div className={`space-y-1.5 ${pkg ? "pt-2 border-t border-purple-200 dark:border-purple-700" : ""}`}>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">الاشتراك الحالي:</span>
            <span className={`font-bold ${subActive ? "text-green-600" : "text-red-500"}`}>
              {subActive ? `✅ نشط — ${remaining} يوم متبقٍ` : "❌ منتهي"}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">باقة الاشتراك:</span>
            <span className="font-semibold">{sub.package.name}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">ينتهي في:</span>
            <span className="font-semibold">{new Date(sub.endDate).toLocaleDateString("ar-BH", { year: "numeric", month: "long", day: "numeric" })}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">الإعلانات المستخدمة:</span>
            <span className="font-semibold">{sub.listingsUsed} / {sub.package.maxListings}</span>
          </div>
        </div>
      ) : (
        <div className={`text-xs text-gray-400 ${pkg ? "pt-1 border-t border-purple-200 dark:border-purple-700" : ""}`}>
          لا يوجد اشتراك حالي
        </div>
      )}
    </div>
  );
}

interface ReviewDialog {
  tx: PaymentTransaction;
  action: "APPROVE" | "REJECT";
}

// ─── Main Page ────────────────────────────────────────────────────────────────────────────────

export default function PaymentsPage() {
  const { pushToast } = useToast();

  const [tab, setTab] = useState<"pending" | "all">("pending");
  const [pending, setPending] = useState<PaymentTransaction[]>([]);
  const [loadingPending, setLoadingPending] = useState(true);
  const [allData, setAllData] = useState<PaginatedPayments | null>(null);
  const [loadingAll, setLoadingAll] = useState(false);
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<ReviewDialog | null>(null);
  const [note, setNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const loadPending = async () => {
    setLoadingPending(true);
    try {
      const result = await getPendingPayments();
      if (Array.isArray(result)) {
        setPending(result);
      } else {
        console.warn('[PaymentsPage] pending load returned non-array', result);
        setPending([]);
      }
    } catch (err) {
      console.error('error loading pending payments', err);
      pushToast({ type: "error", message: "تعذر تحميل المدفوعات المعلقة" });
    } finally { setLoadingPending(false); }
  };

  const loadAll = async (p = page) => {
    setLoadingAll(true);
    try { setAllData(await getAllPayments(p, 20)); }
    catch { pushToast({ type: "error", message: "تعذر تحميل المدفوعات" }); }
    finally { setLoadingAll(false); }
  };

  useEffect(() => { loadPending(); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { if (tab === "all") loadAll(page); }, [tab, page]);

  const handleReview = async () => {
    if (!dialog) return;
    setActionLoading(true);
    try {
      await reviewPayment(dialog.tx.id, { action: dialog.action, note: note.trim() || undefined });
      pushToast({ type: "success", message: dialog.action === "APPROVE" ? "✅ تم القبول وتفعيل الاشتراك" : "تم رفض الدفعة" });
      setDialog(null);
      setNote("");
      await loadPending();
      if (tab === "all") await loadAll(page);
    } catch (error: any) {
      const msg = error?.response?.data?.message || "فشل تحديث حالة الدفعة";
      pushToast({ type: "error", message: Array.isArray(msg) ? msg[0] : msg });
    } finally {
      setActionLoading(false);
    }
  };

  const totalPages = allData ? Math.ceil(allData.total / 20) : 1;

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">المدفوعات</h1>
        <p className="text-sm text-gray-500 mt-1">مراجعة مدفوعات Benefit البنكية وإدارة الاشتراكات</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
        {[
          { key: "pending", label: `بانتظار المراجعة${pending.length > 0 ? ` (${pending.length})` : ""}` },
          { key: "all",     label: "جميع المدفوعات" },
        ].map((t) => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${tab === t.key ? "border-primary text-primary" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >{t.label}</button>
        ))}
      </div>

      {/* Pending Tab */}
      {tab === "pending" && (
        loadingPending ? (
          <div className="flex justify-center py-16"><Loader className="h-8 w-8" /></div>
        ) : pending.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-gray-400">
            <svg className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect width="22" height="16" x="1" y="4" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            <p className="text-sm">لا توجد مدفوعات بانتظار المراجعة</p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {pending.map((tx) => (
              <PaymentCard key={tx.id} tx={tx}
                onApprove={() => { setDialog({ tx, action: "APPROVE" }); setNote(""); }}
                onReject={() =>  { setDialog({ tx, action: "REJECT" });  setNote(""); }}
                onViewProof={(url) => setLightboxUrl(url)}
              />
            ))}
          </div>
        )
      )}

      {/* All Payments Tab */}
      {tab === "all" && (
        loadingAll ? (
          <div className="flex justify-center py-16"><Loader className="h-8 w-8" /></div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    {["المستخدم", "النوع", "الباقة / الاشتراك", "المبلغ", "الحالة", "التاريخ", ""].map((h, i) => (
                      <th key={i} className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {Array.isArray(allData?.data) ? allData.data.map((tx) => {
                    const st = STATUS_LABELS[tx.status] ?? STATUS_LABELS.PENDING;
                    const sub = tx.user?.subscription;
                    const remaining = sub ? daysLeft(sub.endDate) : 0;
                    const subActive = sub?.status === "ACTIVE" && remaining > 0;
                    return (
                      <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-4 py-3 min-w-[180px]">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900 dark:text-white">{getUserDisplayName(tx)}</span>
                            <UserTypeBadge tx={tx} />
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">{tx.user?.email}</div>
                          {tx.user?.phone && <div className="text-xs text-gray-400">{tx.user.phone}</div>}
                          {tx.user?.showroomProfile?.merchantType && (
                            <div className="text-xs text-purple-500 mt-0.5">
                              {MERCHANT_TYPE_ARABIC[tx.user.showroomProfile.merchantType] ?? tx.user.showroomProfile.merchantType}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-gray-600 dark:text-gray-300">
                          {TYPE_LABELS[tx.paymentType] ?? tx.paymentType}
                        </td>
                        <td className="px-4 py-3 min-w-[170px]">
                          {tx.subscriptionPackage && (
                            <div>
                              <div className="font-semibold text-purple-700 dark:text-purple-300 text-sm">{tx.subscriptionPackage.name}</div>
                              <div className="text-xs text-gray-400">{tx.subscriptionPackage.durationDays} يوم · {tx.subscriptionPackage.maxListings} إعلان</div>
                            </div>
                          )}
                          {sub && (
                            <div className="mt-1 text-xs font-medium">
                              <span className={subActive ? "text-green-600" : "text-red-500"}>
                                {subActive ? `✅ نشط — ${remaining} يوم` : "❌ منتهي"}
                              </span>
                              {subActive && (
                                <div className="text-gray-400 mt-0.5">
                                  ينتهي {new Date(sub.endDate).toLocaleDateString("ar-BH")}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 font-bold text-gray-900 dark:text-white whitespace-nowrap">
                          {Number(tx.amount).toFixed(3)} {tx.currency}
                        </td>
                        <td className="px-4 py-3"><Badge variant={st.variant as any}>{st.label}</Badge></td>
                        <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                          {new Date(tx.createdAt).toLocaleDateString("ar-BH")}
                        </td>
                        <td className="px-4 py-3">
                          {tx.proofImageUrl && (
                            <button onClick={() => setLightboxUrl(tx.proofImageUrl!)} className="block text-xs text-blue-500 hover:underline mb-1">الإثبات</button>
                          )}
                          {tx.status === "PENDING_PROOF" && (
                            <div className="flex gap-2">
                              <button onClick={() => { setDialog({ tx, action: "APPROVE" }); setNote(""); }} className="text-xs text-green-600 hover:underline font-bold">قبول</button>
                              <button onClick={() => { setDialog({ tx, action: "REJECT" });  setNote(""); }} className="text-xs text-red-500 hover:underline font-bold">رفض</button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  }) : null}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 pt-4">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>السابق</Button>
                <span className="text-sm text-gray-500 self-center">{page} / {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>التالي</Button>
              </div>
            )}
          </>
        )
      )}

      {/* Review Modal */}
      {dialog && (
        <Modal open onClose={() => setDialog(null)}
          title={dialog.action === "APPROVE" ? "✅ تأكيد قبول الدفعة" : "❌ تأكيد رفض الدفعة"}
        >
          <div className="space-y-4" dir="rtl">
            <div className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-4 space-y-2.5 text-sm">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                <span className="font-bold text-base text-gray-900 dark:text-white">{getUserDisplayName(dialog.tx)}</span>
                <UserTypeBadge tx={dialog.tx} />
              </div>
              {dialog.tx.user?.email && (
                <div className="flex justify-between"><span className="text-gray-500">البريد:</span><span className="font-medium">{dialog.tx.user.email}</span></div>
              )}
              {dialog.tx.user?.phone && (
                <div className="flex justify-between"><span className="text-gray-500">الجوال:</span><span className="font-medium">{dialog.tx.user.phone}</span></div>
              )}
              {dialog.tx.user?.showroomProfile?.merchantType && (
                <div className="flex justify-between">
                  <span className="text-gray-500">نوع التاجر:</span>
                  <span className="font-medium">{MERCHANT_TYPE_ARABIC[dialog.tx.user.showroomProfile.merchantType] ?? dialog.tx.user.showroomProfile.merchantType}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">نوع الدفع:</span>
                <span className="font-medium">{TYPE_LABELS[dialog.tx.paymentType] ?? dialog.tx.paymentType}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">المبلغ:</span>
                <span className="font-bold text-lg text-primary">{Number(dialog.tx.amount).toFixed(3)} {dialog.tx.currency}</span>
              </div>
            </div>

            {dialog.tx.paymentType === "SUBSCRIPTION" && (
              <SubscriptionInfoBlock sub={dialog.tx.user?.subscription} pkg={dialog.tx.subscriptionPackage} />
            )}

            {dialog.tx.proofImageUrl && (
              <div>
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">إثبات التحويل البنكي:</p>
                <div className="relative w-full h-52 rounded-xl overflow-hidden cursor-pointer border border-gray-200 dark:border-gray-600"
                  onClick={() => setLightboxUrl(dialog.tx.proofImageUrl!)}>
                  <Image src={dialog.tx.proofImageUrl} alt="proof" fill className="object-contain bg-gray-50" unoptimized />
                  <div className="absolute bottom-2 left-0 right-0 text-center text-xs text-white/80 bg-black/30 py-1">انقر للتكبير</div>
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                {dialog.action === "REJECT" ? "سبب الرفض (اختياري)" : "ملاحظة للمستخدم (اختياري)"}
              </label>
              <Textarea value={note} onChange={(e) => setNote(e.target.value)}
                placeholder={dialog.action === "REJECT" ? "مثال: الصورة غير واضحة، أو المبلغ غير مطابق" : ""} rows={3} />
            </div>

            <div className="flex gap-3 justify-end pt-1">
              <Button variant="outline" onClick={() => setDialog(null)} disabled={actionLoading}>إلغاء</Button>
              <Button variant={dialog.action === "APPROVE" ? "default" : "destructive"} onClick={handleReview} disabled={actionLoading}>
                {actionLoading ? <Loader className="h-4 w-4" /> : dialog.action === "APPROVE" ? "✓ قبول وتفعيل الاشتراك" : "✕ رفض الدفعة"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Lightbox */}
      {lightboxUrl && (
        <div className="fixed inset-0 bg-black/85 z-50 flex items-center justify-center p-4" onClick={() => setLightboxUrl(null)}>
          <div className="relative max-w-3xl w-full" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setLightboxUrl(null)} className="absolute -top-9 left-0 text-white/70 hover:text-white text-sm">✕ إغلاق</button>
            <Image src={lightboxUrl} alt="proof" width={900} height={700} className="w-full h-auto rounded-xl object-contain max-h-[85vh]" unoptimized />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Payment Card ─────────────────────────────────────────────────────────────────────────────

function PaymentCard({ tx, onApprove, onReject, onViewProof }: {
  tx: PaymentTransaction;
  onApprove: () => void;
  onReject: () => void;
  onViewProof: (url: string) => void;
}) {
  const name = getUserDisplayName(tx);
  const type = getUserType(tx);
  const sub = tx.user?.subscription;
  const remaining = sub ? daysLeft(sub.endDate) : 0;
  const subActive = sub?.status === "ACTIVE" && remaining > 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm flex flex-col gap-4">

      {/* Header */}
      <div className="flex justify-between items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-gray-900 dark:text-white text-base">{name}</span>
            {type === "showroom" ? (
              <span className="rounded-full bg-purple-100 text-purple-700 text-xs font-bold px-2.5 py-0.5">🏪 تاجر</span>
            ) : type === "individual" ? (
              <span className="rounded-full bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-0.5">👤 فرد</span>
            ) : null}
          </div>
          {tx.user?.email && <p className="text-xs text-gray-400 mt-0.5">{tx.user.email}</p>}
          {tx.user?.phone && <p className="text-xs text-gray-400">{tx.user.phone}</p>}
          {tx.user?.showroomProfile?.merchantType && (
            <p className="text-xs text-purple-500 mt-0.5">
              {MERCHANT_TYPE_ARABIC[tx.user.showroomProfile.merchantType] ?? tx.user.showroomProfile.merchantType}
            </p>
          )}
        </div>
        <div className="text-left shrink-0">
          <p className="text-2xl font-black text-gray-900 dark:text-white leading-none">
            {Number(tx.amount).toFixed(3)} <span className="text-sm font-semibold">{tx.currency}</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">{TYPE_LABELS[tx.paymentType] ?? tx.paymentType}</p>
        </div>
      </div>

      {/* Subscription details */}
      {tx.paymentType === "SUBSCRIPTION" && (
        <SubscriptionInfoBlock sub={sub} pkg={tx.subscriptionPackage} />
      )}

      {/* Current sub status for non-sub payments */}
      {tx.paymentType !== "SUBSCRIPTION" && sub && (
        <div className="rounded-lg bg-gray-50 dark:bg-gray-700/30 px-3 py-2 text-sm flex items-center justify-between">
          <span className="text-gray-500">الاشتراك الحالي:</span>
          <span className={subActive ? "font-semibold text-green-600" : "font-semibold text-red-500"}>
            {subActive ? `✅ نشط — ${remaining} يوم متبقٍ` : "❌ منتهي"}
          </span>
        </div>
      )}

      {/* Proof image */}
      {tx.proofImageUrl && (
        <div className="relative w-full h-44 rounded-xl overflow-hidden cursor-pointer border border-gray-100 dark:border-gray-700 group"
          onClick={() => onViewProof(tx.proofImageUrl!)}>
          <Image src={tx.proofImageUrl} alt="Payment proof" fill className="object-cover" unoptimized />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <span className="opacity-0 group-hover:opacity-100 text-white bg-black/50 px-3 py-1 rounded-full text-sm font-medium transition-opacity">عرض بحجم كامل</span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
        <p className="text-xs text-gray-400">
          {new Date(tx.createdAt).toLocaleDateString("ar-BH", { year: "numeric", month: "long", day: "numeric" })}
        </p>
        <div className="flex gap-2">
          <Button variant="destructive" size="sm" onClick={onReject}>رفض</Button>
          <Button size="sm" onClick={onApprove}>✓ قبول وتفعيل</Button>
        </div>
      </div>
    </div>
  );
}
