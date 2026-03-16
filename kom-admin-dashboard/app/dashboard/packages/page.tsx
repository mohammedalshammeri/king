"use client";

import { useEffect, useState } from "react";
import {
  getPackages,
  createPackage,
  updatePackage,
  deletePackage,
  type SubscriptionPackage,
  type CreatePackagePayload,
} from "../../../lib/services/packages";
import { Button } from "@/components/ui/button";
import { Input } from "../../../components/ui/input";
import { Loader } from "../../../components/ui/loader";
import { Modal } from "../../../components/ui/modal";
import { useToast } from "../../../components/ui/toast";

const EMPTY_FORM: CreatePackagePayload = {
  name: "",
  description: "",
  priceMonthly: 9.9,
  price3Months: null,
  price6Months: null,
  price12Months: null,
  discountNote: "",
  maxListings: 5,
  maxStories: 3,
  durationDays: 30,
  sortOrder: 0,
};

function numVal(v: number | null | undefined): string {
  return v == null ? "" : String(v);
}
function toNum(s: string): number | null {
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

export default function PackagesPage() {
  const { pushToast } = useToast();
  const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<CreatePackagePayload>(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await getPackages();
      setPackages(Array.isArray(data) ? data : []);
    } catch {
      pushToast({ type: "error", message: "تعذر تحميل الباقات" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditId(null);
    setForm(EMPTY_FORM);
    setOpen(true);
  };

  const openEdit = (pkg: SubscriptionPackage) => {
    setEditId(pkg.id);
    setForm({
      name: pkg.name,
      description: pkg.description ?? "",
      priceMonthly: Number(pkg.priceMonthly),
      price3Months: pkg.price3Months != null ? Number(pkg.price3Months) : null,
      price6Months: pkg.price6Months != null ? Number(pkg.price6Months) : null,
      price12Months: pkg.price12Months != null ? Number(pkg.price12Months) : null,
      discountNote: pkg.discountNote ?? "",
      maxListings: pkg.maxListings,
      maxStories: pkg.maxStories ?? 3,
      durationDays: pkg.durationDays,
      sortOrder: pkg.sortOrder,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      pushToast({ type: "error", message: "اسم الباقة مطلوب" });
      return;
    }
    setSaving(true);
    try {
      const payload: CreatePackagePayload = {
        ...form,
        discountNote: form.discountNote?.trim() || null,
      };
      if (editId) {
        await updatePackage(editId, payload);
        pushToast({ type: "success", message: "تم تحديث الباقة" });
      } else {
        await createPackage(payload);
        pushToast({ type: "success", message: "تم إنشاء الباقة" });
      }
      setOpen(false);
      load();
    } catch {
      pushToast({ type: "error", message: "فشلت العملية" });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (pkg: SubscriptionPackage) => {
    try {
      await updatePackage(pkg.id, { isActive: !pkg.isActive });
      pushToast({ type: "success", message: pkg.isActive ? "تم إيقاف الباقة" : "تم تفعيل الباقة" });
      load();
    } catch {
      pushToast({ type: "error", message: "فشل تغيير الحالة" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePackage(id);
      pushToast({ type: "success", message: "تم حذف الباقة" });
      setDeleteConfirm(null);
      load();
    } catch {
      pushToast({ type: "error", message: "فشل حذف الباقة" });
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader className="h-8 w-8 text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6" dir="rtl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">باقات التجار</h1>
          <p className="mt-1 text-sm text-gray-500">إدارة باقات اشتراك أصحاب المعارض</p>
        </div>
        <Button onClick={openCreate}>+ إضافة باقة</Button>
      </div>

      {packages.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 p-16 text-center">
          <p className="text-gray-400 text-sm">لا توجد باقات. أنشئ باقة جديدة.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative rounded-2xl border bg-white p-5 shadow-sm transition-all ${
                pkg.isActive ? "border-primary/30" : "border-gray-200 opacity-60"
              }`}
            >
              {/* Status badge */}
              <span
                className={`absolute top-4 left-4 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  pkg.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                }`}
              >
                {pkg.isActive ? "نشط" : "موقوف"}
              </span>

              <h3 className="text-lg font-bold text-gray-900 mb-1">{pkg.name}</h3>
              {pkg.description && (
                <p className="text-sm text-gray-500 mb-3">{pkg.description}</p>
              )}

              {/* Main price */}
              <div className="mb-3 flex items-baseline gap-1">
                <span className="text-3xl font-black text-primary">{Number(pkg.priceMonthly).toFixed(3)}</span>
                <span className="text-sm text-gray-500">د.ب / شهر</span>
              </div>

              {/* Multi-duration prices */}
              {(pkg.price3Months || pkg.price6Months || pkg.price12Months) && (
                <div className="mb-3 flex flex-wrap gap-2">
                  {pkg.price3Months && (
                    <span className="rounded-lg bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                      3 أشهر: {Number(pkg.price3Months).toFixed(3)} د.ب
                    </span>
                  )}
                  {pkg.price6Months && (
                    <span className="rounded-lg bg-purple-50 px-2 py-1 text-xs font-semibold text-purple-700">
                      6 أشهر: {Number(pkg.price6Months).toFixed(3)} د.ب
                    </span>
                  )}
                  {pkg.price12Months && (
                    <span className="rounded-lg bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                      سنة: {Number(pkg.price12Months).toFixed(3)} د.ب
                    </span>
                  )}
                </div>
              )}
              {pkg.discountNote && (
                <p className="mb-3 text-xs font-medium text-green-600">✨ {pkg.discountNote}</p>
              )}

              <ul className="space-y-1.5 text-sm text-gray-600 mb-5">
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                  حتى {pkg.maxListings} إعلانات نشطة
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                  مدة {pkg.durationDays} يوم
                </li>
                {pkg._count !== undefined && (
                  <li className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    {pkg._count.subscriptions} مشترك
                  </li>
                )}
              </ul>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(pkg)}>
                  تعديل
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleToggleActive(pkg)}
                >
                  {pkg.isActive ? "إيقاف" : "تفعيل"}
                </Button>
                <button
                  onClick={() => setDeleteConfirm(pkg.id)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg border border-red-200 text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editId ? "تعديل الباقة" : "إضافة باقة جديدة"}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pl-1" dir="rtl">
          {/* Basic info */}
          <div>
            <label className="block text-sm font-semibold mb-1.5">اسم الباقة *</label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="الباقة الأساسية"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">الوصف</label>
            <Input
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="وصف مختصر للباقة"
            />
          </div>

          {/* Core pricing & limits */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">سعر شهر واحد (د.ب) *</label>
              <Input
                type="number"
                step="0.001"
                min="0"
                value={form.priceMonthly}
                onChange={(e) => setForm({ ...form, priceMonthly: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">الحد الأقصى للإعلانات *</label>
              <Input
                type="number"
                min="1"
                value={form.maxListings}
                onChange={(e) => setForm({ ...form, maxListings: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* Stories quota */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">الحد الأقصى للقصص 📖</label>
              <Input
                type="number"
                min="0"
                value={form.maxStories ?? 3}
                onChange={(e) => setForm({ ...form, maxStories: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* Multi-duration pricing */}
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-4 space-y-3">
            <p className="text-sm font-bold text-gray-700">أسعار المدد المتعددة (اختياري)</p>
            <p className="text-xs text-gray-500">اتركها فارغة إذا لم تريد تفعيل هذه المدة</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-blue-700">3 أشهر (د.ب)</label>
                <Input
                  type="number"
                  step="0.001"
                  min="0"
                  placeholder="مثال: 27.000"
                  value={numVal(form.price3Months)}
                  onChange={(e) => setForm({ ...form, price3Months: toNum(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-purple-700">6 أشهر (د.ب)</label>
                <Input
                  type="number"
                  step="0.001"
                  min="0"
                  placeholder="مثال: 50.000"
                  value={numVal(form.price6Months)}
                  onChange={(e) => setForm({ ...form, price6Months: toNum(e.target.value) })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-amber-700">سنة كاملة (د.ب)</label>
                <Input
                  type="number"
                  step="0.001"
                  min="0"
                  placeholder="مثال: 90.000"
                  value={numVal(form.price12Months)}
                  onChange={(e) => setForm({ ...form, price12Months: toNum(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-green-700">ملاحظة الخصم (تظهر للمستخدم)</label>
              <Input
                placeholder="مثال: وفّر 25% مع الاشتراك السنوي"
                value={form.discountNote ?? ""}
                onChange={(e) => setForm({ ...form, discountNote: e.target.value })}
              />
            </div>
          </div>

          {/* Sort & Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">مدة الشهر الواحد (أيام)</label>
              <Input
                type="number"
                min="1"
                value={form.durationDays}
                onChange={(e) => setForm({ ...form, durationDays: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">الترتيب</label>
              <Input
                type="number"
                min="0"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? <Loader className="h-4 w-4" /> : editId ? "حفظ التعديلات" : "إنشاء الباقة"}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)} className="flex-1">
              إلغاء
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="تأكيد الحذف"
      >
        <div className="space-y-4" dir="rtl">
          <p className="text-sm text-gray-600">هل أنت متأكد من حذف هذه الباقة؟ في حال وجود مشتركين سيتم إيقاف الباقة بدلاً من حذفها.</p>
          <div className="flex gap-3">
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="flex-1"
            >
              حذف
            </Button>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="flex-1">
              إلغاء
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
