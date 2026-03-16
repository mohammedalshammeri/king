"use client";

import { useEffect, useState } from "react";
import {
  FeaturedPackage,
  FeaturedPackagesService,
  CreateFeaturedPackagePayload,
} from "../../../lib/services/featured-packages";
import { Button } from "../../../components/ui/button";
import { useToast } from "../../../components/ui/toast";
import { Card } from "../../../components/ui/card";
import { Modal } from "../../../components/ui/modal";
import { Input } from "../../../components/ui/input";
import { Loader } from "../../../components/ui/loader";
import { Trash2, Pencil, Star, ToggleLeft, ToggleRight, Zap } from "lucide-react";

export default function FeaturedPackagesPage() {
  const [packages, setPackages] = useState<FeaturedPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<FeaturedPackage | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [nameAr, setNameAr] = useState("");
  const [price, setPrice] = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [sortOrder, setSortOrder] = useState("0");

  // Feature listing state
  const [listingId, setListingId] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState("");
  const [featuring, setFeaturing] = useState(false);
  const [unfeaturing, setUnfeaturing] = useState(false);

  const { pushToast } = useToast();

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const data = await FeaturedPackagesService.getAll();
      setPackages(data);
    } catch (e) {
      console.error(e);
      pushToast({ message: "فشل تحميل باقات التمييز", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const openCreate = () => {
    setEditTarget(null);
    setNameAr("");
    setPrice("");
    setDurationDays("");
    setSortOrder("0");
    setShowModal(true);
  };

  const openEdit = (pkg: FeaturedPackage) => {
    setEditTarget(pkg);
    setNameAr(pkg.nameAr);
    setPrice(String(pkg.price));
    setDurationDays(String(pkg.durationDays));
    setSortOrder(String(pkg.sortOrder));
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!nameAr.trim()) return pushToast({ message: "يرجى إدخال اسم الباقة", type: "error" });
    if (!price || isNaN(parseFloat(price))) return pushToast({ message: "يرجى إدخال سعر صحيح", type: "error" });
    if (!durationDays || isNaN(parseInt(durationDays))) return pushToast({ message: "يرجى إدخال مدة صحيحة", type: "error" });

    const payload: CreateFeaturedPackagePayload = {
      nameAr: nameAr.trim(),
      price: parseFloat(price),
      durationDays: parseInt(durationDays),
      sortOrder: parseInt(sortOrder) || 0,
    };

    setSaving(true);
    try {
      if (editTarget) {
        const updated = await FeaturedPackagesService.update(editTarget.id, payload);
        setPackages((prev) => prev.map((p) => (p.id === editTarget.id ? updated : p)));
        pushToast({ message: "تم تحديث الباقة بنجاح", type: "success" });
      } else {
        const created = await FeaturedPackagesService.create(payload);
        setPackages((prev) => [created, ...prev]);
        pushToast({ message: "تم إنشاء الباقة بنجاح", type: "success" });
      }
      setShowModal(false);
    } catch (e) {
      console.error(e);
      pushToast({ message: "فشل حفظ الباقة", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (pkg: FeaturedPackage) => {
    try {
      const updated = await FeaturedPackagesService.update(pkg.id, { isActive: !pkg.isActive });
      setPackages((prev) => prev.map((p) => (p.id === pkg.id ? updated : p)));
      pushToast({ message: updated.isActive ? "تم تفعيل الباقة" : "تم إيقاف الباقة", type: "success" });
    } catch (e) {
      console.error(e);
      pushToast({ message: "فشل تحديث الباقة", type: "error" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الباقة؟")) return;
    try {
      await FeaturedPackagesService.delete(id);
      setPackages((prev) => prev.filter((p) => p.id !== id));
      pushToast({ message: "تم حذف الباقة", type: "success" });
    } catch (e) {
      console.error(e);
      pushToast({ message: "فشل حذف الباقة", type: "error" });
    }
  };

  const handleFeatureListing = async () => {
    if (!listingId.trim()) return pushToast({ message: "يرجى إدخال معرّف الإعلان", type: "error" });
    if (!selectedPackageId) return pushToast({ message: "يرجى اختيار الباقة", type: "error" });
    setFeaturing(true);
    try {
      await FeaturedPackagesService.featureListing(listingId.trim(), selectedPackageId);
      pushToast({ message: "تم تمييز الإعلان بنجاح", type: "success" });
      setListingId("");
      setSelectedPackageId("");
    } catch (e) {
      console.error(e);
      pushToast({ message: "فشل تمييز الإعلان", type: "error" });
    } finally {
      setFeaturing(false);
    }
  };

  const handleUnfeatureListing = async () => {
    if (!listingId.trim()) return pushToast({ message: "يرجى إدخال معرّف الإعلان", type: "error" });
    if (!confirm("هل أنت متأكد من إلغاء تمييز هذا الإعلان؟")) return;
    setUnfeaturing(true);
    try {
      await FeaturedPackagesService.unfeatureListing(listingId.trim());
      pushToast({ message: "تم إلغاء تمييز الإعلان", type: "success" });
      setListingId("");
    } catch (e) {
      console.error(e);
      pushToast({ message: "فشل إلغاء تمييز الإعلان", type: "error" });
    } finally {
      setUnfeaturing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-black/60">
        <Loader />
        جاري تحميل باقات التمييز...
      </div>
    );
  }

  const activeCount = packages.filter((p) => p.isActive).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">باقات التمييز (مميز)</h1>
          <p className="text-sm text-gray-500 mt-1">إدارة باقات تمييز الإعلانات وتطبيقها على إعلانات المستخدمين</p>
        </div>
        <Button onClick={openCreate} className="bg-primary hover:bg-primary/90">
          + إضافة باقة جديدة
        </Button>
      </div>

      {/* Stats */}
      <div className="flex gap-4 flex-wrap">
        <div className="bg-white rounded-xl px-5 py-3 shadow-sm border text-center">
          <p className="text-2xl font-bold text-primary">{packages.length}</p>
          <p className="text-xs text-gray-500">إجمالي الباقات</p>
        </div>
        <div className="bg-white rounded-xl px-5 py-3 shadow-sm border text-center">
          <p className="text-2xl font-bold text-green-600">{activeCount}</p>
          <p className="text-xs text-gray-500">باقات نشطة</p>
        </div>
        <div className="bg-white rounded-xl px-5 py-3 shadow-sm border text-center">
          <p className="text-2xl font-bold text-gray-400">{packages.length - activeCount}</p>
          <p className="text-xs text-gray-500">باقات موقوفة</p>
        </div>
      </div>

      {/* Feature / Unfeature Listing */}
      <Card className="p-6 border-none shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <Zap size={20} className="text-amber-500" />
          <h2 className="text-lg font-semibold">تمييز إعلان</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">معرّف الإعلان (ID)</label>
            <Input
              value={listingId}
              onChange={(e) => setListingId(e.target.value)}
              placeholder="الصق معرّف الإعلان هنا"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">الباقة</label>
            <select
              value={selectedPackageId}
              onChange={(e) => setSelectedPackageId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              <option value="">اختر باقة</option>
              {packages.filter((p) => p.isActive).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nameAr} — {p.price} د.ب / {p.durationDays} يوم
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleFeatureListing}
              disabled={featuring || !listingId.trim() || !selectedPackageId}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center gap-2"
            >
              <Star size={16} />
              {featuring ? "جاري..." : "تمييز"}
            </Button>
            <Button
              onClick={handleUnfeatureListing}
              disabled={unfeaturing || !listingId.trim()}
              variant="ghost"
              className="flex-1 border border-gray-300 hover:bg-gray-50"
            >
              {unfeaturing ? "جاري..." : "إلغاء التمييز"}
            </Button>
          </div>
        </div>
      </Card>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {packages.map((pkg) => (
          <Card key={pkg.id} className={`p-5 border-none shadow-sm flex flex-col gap-3 ${!pkg.isActive ? "opacity-60" : ""}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Star size={20} className="text-amber-500" />
                </div>
                <div>
                  <h3 className="font-bold text-base leading-tight">{pkg.nameAr}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">ترتيب: {pkg.sortOrder}</p>
                </div>
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  pkg.isActive ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                }`}
              >
                {pkg.isActive ? "نشط" : "موقوف"}
              </span>
            </div>

            <div className="flex gap-4">
              <div className="text-center">
                <p className="text-xl font-bold text-primary">{pkg.price}</p>
                <p className="text-xs text-gray-500">د.ب</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-gray-800">{pkg.durationDays}</p>
                <p className="text-xs text-gray-500">يوم</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t gap-2">
              <button
                onClick={() => handleToggle(pkg)}
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                  pkg.isActive ? "text-green-600 hover:text-green-700" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {pkg.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                {pkg.isActive ? "نشط" : "موقوف"}
              </button>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => openEdit(pkg)}>
                  <Pencil size={14} />
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(pkg.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {packages.length === 0 && (
          <div className="col-span-full py-20 text-center text-gray-400 border-2 border-dashed rounded-xl">
            <Star size={40} className="mx-auto mb-3 opacity-40" />
            <p>لا توجد باقات تمييز</p>
            <p className="text-sm mt-1">أضف أول باقة بالضغط على الزر أعلاه</p>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => !saving && setShowModal(false)}
        title={editTarget ? "تعديل الباقة" : "إضافة باقة تمييز جديدة"}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">اسم الباقة (عربي)</label>
            <Input
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              placeholder="مثال: ذهبية — 7 أيام"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">السعر (دينار بحريني)</label>
              <Input
                type="number"
                min="0"
                step="0.1"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="مثال: 2.5"
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">المدة (أيام)</label>
              <Input
                type="number"
                min="1"
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                placeholder="مثال: 7"
                dir="ltr"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">ترتيب الظهور</label>
            <Input
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              placeholder="0"
              dir="ltr"
            />
            <p className="text-xs text-gray-500 mt-1">الأرقام الأصغر تظهر أولاً</p>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setShowModal(false)} disabled={saving}>
              إلغاء
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "جاري الحفظ..." : editTarget ? "حفظ التغييرات" : "إنشاء الباقة"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
