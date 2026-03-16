"use client";

import { useEffect, useState } from "react";
import {
  getIndividualPackages,
  createIndividualPackage,
  updateIndividualPackage,
  deleteIndividualPackage,
  type IndividualListingPackage,
  type CreateIndividualPackagePayload,
} from "../../../lib/services/packages";
import { Button } from "@/components/ui/button";
import { Input } from "../../../components/ui/input";
import { Loader } from "../../../components/ui/loader";
import { Modal } from "../../../components/ui/modal";
import { useToast } from "../../../components/ui/toast";

const EMPTY_FORM: CreateIndividualPackagePayload = {
  name: "",
  description: "",
  listingCount: 1,
  maxStories: 2,
  price: 1.0,
  sortOrder: 0,
};

export default function IndividualPackagesPage() {
  const { pushToast } = useToast();
  const [packages, setPackages] = useState<IndividualListingPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateIndividualPackagePayload>(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await getIndividualPackages();
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

  const openEdit = (pkg: IndividualListingPackage) => {
    setEditId(pkg.id);
    setForm({
      name: pkg.name,
      description: pkg.description ?? "",
      listingCount: pkg.listingCount,
      maxStories: pkg.maxStories ?? 2,
      price: Number(pkg.price),
      sortOrder: pkg.sortOrder,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      pushToast({ type: "error", message: "اسم الباقة مطلوب" });
      return;
    }
    if (form.listingCount < 1) {
      pushToast({ type: "error", message: "عدد الإعلانات يجب أن يكون 1 على الأقل" });
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        await updateIndividualPackage(editId, form);
        pushToast({ type: "success", message: "تم تحديث الباقة" });
      } else {
        await createIndividualPackage(form);
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

  const handleToggleActive = async (pkg: IndividualListingPackage) => {
    try {
      await updateIndividualPackage(pkg.id, { isActive: !pkg.isActive });
      pushToast({ type: "success", message: pkg.isActive ? "تم إيقاف الباقة" : "تم تفعيل الباقة" });
      load();
    } catch {
      pushToast({ type: "error", message: "فشل تغيير الحالة" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteIndividualPackage(id);
      pushToast({ type: "success", message: "تم حذف الباقة" });
      setDeleteConfirm(null);
      load();
    } catch {
      pushToast({ type: "error", message: "فشل حذف الباقة" });
    }
  };

  // Price per listing helper
  const pricePerListing = (pkg: IndividualListingPackage) => {
    const ppl = Number(pkg.price) / pkg.listingCount;
    return ppl.toFixed(3);
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
          <h1 className="text-2xl font-bold text-gray-900">باقات الأفراد</h1>
          <p className="mt-1 text-sm text-gray-500">
            إدارة باقات كريدت الإعلانات للمستخدمين الأفراد (كل إعلان يخصم كريدت واحد)
          </p>
        </div>
        <Button onClick={openCreate}>+ إضافة باقة</Button>
      </div>

      {/* Info banner */}
      <div className="mb-6 rounded-xl bg-blue-50 border border-blue-200 p-4 flex gap-3">
        <svg className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
        </svg>
        <div className="text-sm text-blue-700 space-y-1">
          <p className="font-semibold">كيف يعمل النظام؟</p>
          <p>الفرد يشتري باقة كريدت → يحصل على عدد إعلانات معين → كل مرة يرفع إعلان للمراجعة يُخصم كريدت واحد تلقائياً.</p>
        </div>
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

              {/* Price */}
              <div className="mb-3 flex items-baseline gap-1">
                <span className="text-3xl font-black text-primary">{Number(pkg.price).toFixed(3)}</span>
                <span className="text-sm text-gray-500">د.ب</span>
              </div>

              <ul className="space-y-1.5 text-sm text-gray-600 mb-5">
                {/* Listing count */}
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12" /></svg>
                  {pkg.listingCount} {pkg.listingCount === 1 ? "إعلان" : "إعلانات"}
                </li>
                {/* Price per listing */}
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                  {pricePerListing(pkg)} د.ب / إعلان
                </li>
                {/* Purchase count */}
                {pkg._count !== undefined && (
                  <li className="flex items-center gap-2">
                    <svg className="h-4 w-4 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                    {pkg._count.purchases} عملية شراء
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
        title={editId ? "تعديل الباقة" : "إضافة باقة جديدة للأفراد"}
      >
        <div className="space-y-4" dir="rtl">
          <div>
            <label className="block text-sm font-semibold mb-1.5">اسم الباقة *</label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="مثال: إعلان واحد — 5 إعلانات"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5">الوصف</label>
            <Input
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="وصف مختصر (اختياري)"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1.5">عدد الإعلانات (كريدت) *</label>
              <Input
                type="number"
                min="1"
                value={form.listingCount}
                onChange={(e) => setForm({ ...form, listingCount: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1.5">الحد الأقصى للقصص 📖</label>
              <Input
                type="number"
                min="0"
                value={form.maxStories ?? 2}
                onChange={(e) => setForm({ ...form, maxStories: Number(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1.5">السعر الإجمالي (د.ب) *</label>
            <Input
              type="number"
              step="0.001"
              min="0"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
            />
          </div>

          {/* Live price per listing preview */}
          {form.listingCount > 0 && form.price > 0 && (
            <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 text-sm text-gray-600">
              سعر الإعلان الواحد:{" "}
              <span className="font-bold text-primary">
                {(form.price / form.listingCount).toFixed(3)} د.ب
              </span>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold mb-1.5">الترتيب</label>
            <Input
              type="number"
              min="0"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
            />
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
          <p className="text-sm text-gray-600">
            هل أنت متأكد من حذف هذه الباقة؟ لن يتأثر المستخدمون الذين اشتروها مسبقاً.
          </p>
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
