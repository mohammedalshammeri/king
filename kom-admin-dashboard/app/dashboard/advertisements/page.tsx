"use client";

import { useEffect, useState } from "react";
import { Advertisement, AdvertisementsService } from "../../../lib/services/advertisements";
import { Loader } from "../../../components/ui/loader";
import { Button } from "../../../components/ui/button";
import { useToast } from "../../../components/ui/toast";
import { Card } from "../../../components/ui/card";
import { Trash2, ToggleLeft, ToggleRight, Image as ImageIcon, Video } from "lucide-react";
import { Modal } from "../../../components/ui/modal";
import { Input } from "../../../components/ui/input";

export default function AdvertisementsPage() {
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [uploading, setUploading] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");
  const [newSortOrder, setNewSortOrder] = useState("0");
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const { pushToast } = useToast();

  const fetchAds = async () => {
    setLoading(true);
    try {
      const data = await AdvertisementsService.getAll();
      setAds(data || []);
    } catch (err) {
      console.error(err);
      pushToast({ message: "فشل تحميل الإعلانات", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAds();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const handleCreate = async () => {
    if (!selectedFile) {
      pushToast({ message: "يرجى اختيار ملف صورة أو فيديو", type: "error" });
      return;
    }
    setUploading(true);
    try {
      const newAd = await AdvertisementsService.create(
        selectedFile,
        newTitle || undefined,
        newLinkUrl || undefined,
        parseInt(newSortOrder, 10) || 0,
        newStartDate || undefined,
        newEndDate || undefined,
      );
      setAds([newAd, ...ads]);
      pushToast({ message: "تم رفع الإعلان بنجاح", type: "success" });
      setShowAddModal(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setNewTitle("");
      setNewLinkUrl("");
      setNewSortOrder("0");
      setNewStartDate("");
      setNewEndDate("");
    } catch (e) {
      console.error(e);
      pushToast({ message: "فشل رفع الإعلان", type: "error" });
    } finally {
      setUploading(false);
    }
  };

  const handleToggle = async (ad: Advertisement) => {
    try {
      const updated = await AdvertisementsService.toggle(ad.id, !ad.isActive);
      setAds((prev) => prev.map((a) => (a.id === ad.id ? { ...a, isActive: updated.isActive } : a)));
      pushToast({
        message: updated.isActive ? "تم تفعيل الإعلان" : "تم إيقاف الإعلان",
        type: "success",
      });
    } catch (e) {
      console.error(e);
      pushToast({ message: "فشل تحديث الإعلان", type: "error" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الإعلان؟")) return;
    try {
      await AdvertisementsService.delete(id);
      setAds((prev) => prev.filter((a) => a.id !== id));
      pushToast({ message: "تم حذف الإعلان", type: "success" });
    } catch (e) {
      console.error(e);
      pushToast({ message: "فشل حذف الإعلان", type: "error" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-black/60">
        <Loader />
        جاري تحميل الإعلانات...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">إدارة الإعلانات البانر</h1>
          <p className="text-sm text-gray-500 mt-1">
            الإعلانات تظهر في تطبيق الموبايل قبل القصص في الصفحة الرئيسية • المقاس الموصى به: 1200 × 400px
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="bg-primary hover:bg-primary/90">
          + إضافة إعلان جديد
        </Button>
      </div>

      {/* Stats */}
      <div className="flex gap-4 flex-wrap">
        <div className="bg-white rounded-xl px-5 py-3 shadow-sm border text-center">
          <p className="text-2xl font-bold text-primary">{ads.length}</p>
          <p className="text-xs text-gray-500">إجمالي الإعلانات</p>
        </div>
        <div className="bg-white rounded-xl px-5 py-3 shadow-sm border text-center">
          <p className="text-2xl font-bold text-green-600">{ads.filter((a) => a.isActive).length}</p>
          <p className="text-xs text-gray-500">إعلانات نشطة</p>
        </div>
        <div className="bg-white rounded-xl px-5 py-3 shadow-sm border text-center">
          <p className="text-2xl font-bold text-gray-400">{ads.filter((a) => !a.isActive).length}</p>
          <p className="text-xs text-gray-500">إعلانات موقوفة</p>
        </div>
        <div className="bg-white rounded-xl px-5 py-3 shadow-sm border text-center">
          <p className="text-2xl font-bold text-blue-600">{ads.reduce((s, a) => s + (a.viewsCount ?? 0), 0).toLocaleString("ar-BH")}</p>
          <p className="text-xs text-gray-500">إجمالي المشاهدات</p>
        </div>
        <div className="bg-white rounded-xl px-5 py-3 shadow-sm border text-center">
          <p className="text-2xl font-bold text-purple-600">{ads.reduce((s, a) => s + (a.clicksCount ?? 0), 0).toLocaleString("ar-BH")}</p>
          <p className="text-xs text-gray-500">إجمالي النقرات</p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ads.map((ad) => (
          <Card key={ad.id} className={`overflow-hidden border-none shadow-sm flex flex-col ${!ad.isActive ? "opacity-60" : ""}`}>
            <div className="relative bg-black" style={{ aspectRatio: "3/1" }}>
              {ad.mediaType === "VIDEO" ? (
                <video
                  src={ad.mediaUrl}
                  poster={ad.thumbnailUrl}
                  controls
                  className="w-full h-full object-cover"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ad.mediaUrl}
                  alt={ad.title || "إعلان"}
                  className="w-full h-full object-cover"
                />
              )}
              {/* Type badge */}
              <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-white text-xs flex items-center gap-1">
                {ad.mediaType === "VIDEO" ? <Video size={11} /> : <ImageIcon size={11} />}
                {ad.mediaType === "VIDEO" ? "فيديو" : "صورة"}
              </div>
              {/* Status badge */}
              <div
                className={`absolute top-2 left-2 px-2 py-1 rounded text-xs font-medium ${
                  ad.isActive ? "bg-green-500 text-white" : "bg-gray-500 text-white"
                }`}
              >
                {ad.isActive ? "نشط" : "موقوف"}
              </div>
            </div>
            <div className="p-4 bg-white flex-1 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base line-clamp-1">{ad.title || "بدون عنوان"}</h3>
                  {ad.linkUrl && (
                    <p className="text-xs text-blue-500 line-clamp-1 mt-0.5">{ad.linkUrl}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    الترتيب: {ad.sortOrder} • {new Date(ad.createdAt).toLocaleDateString("ar-BH")}
                  </p>
                  {(ad.startDate || ad.endDate) && (
                    <p className="text-xs text-amber-600 mt-0.5">
                      {ad.startDate ? new Date(ad.startDate).toLocaleDateString("ar-BH") : ""}
                      {ad.startDate && ad.endDate ? " ← " : ""}
                      {ad.endDate ? new Date(ad.endDate).toLocaleDateString("ar-BH") : ""}
                    </p>
                  )}
                  <div className="flex gap-3 mt-1.5">
                    <span className="text-xs text-blue-500">👁 {(ad.viewsCount ?? 0).toLocaleString("ar-BH")}</span>
                    <span className="text-xs text-purple-500">🖱 {(ad.clicksCount ?? 0).toLocaleString("ar-BH")}</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center mt-2 pt-2 border-t gap-2">
                <button
                  onClick={() => handleToggle(ad)}
                  className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
                    ad.isActive ? "text-green-600 hover:text-green-700" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {ad.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                  {ad.isActive ? "نشط" : "موقوف"}
                </button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(ad.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {ads.length === 0 && (
          <div className="col-span-full py-20 text-center text-gray-400 border-2 border-dashed rounded-lg">
            <ImageIcon size={40} className="mx-auto mb-3 opacity-40" />
            <p>لا توجد إعلانات مضافة حالياً</p>
            <p className="text-sm mt-1">أضف إعلانك الأول بالضغط على الزر أعلاه</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <Modal
        open={showAddModal}
        onClose={() => !uploading && setShowAddModal(false)}
        title="إضافة إعلان بانر جديد"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">عنوان الإعلان (اختياري)</label>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="مثال: عروض رمضان"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">رابط الإعلان (اختياري)</label>
            <Input
              value={newLinkUrl}
              onChange={(e) => setNewLinkUrl(e.target.value)}
              placeholder="https://..."
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">ترتيب الظهور</label>
            <Input
              type="number"
              value={newSortOrder}
              onChange={(e) => setNewSortOrder(e.target.value)}
              placeholder="0"
              dir="ltr"
            />
            <p className="text-xs text-gray-500 mt-1">الأرقام الأصغر تظهر أولاً</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">تاريخ البدء (اختياري)</label>
              <Input
                type="date"
                value={newStartDate}
                onChange={(e) => setNewStartDate(e.target.value)}
                dir="ltr"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">تاريخ الانتهاء (اختياري)</label>
              <Input
                type="date"
                value={newEndDate}
                onChange={(e) => setNewEndDate(e.target.value)}
                dir="ltr"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 -mt-2">إذا تُركا فارغَين، يظهر الإعلان دائماً</p>
          <div>
            <label className="block text-sm font-medium mb-1">الصورة أو الفيديو</label>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="block w-full text-sm text-slate-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-primary/10 file:text-primary
                hover:file:bg-primary/20"
            />
            <p className="text-xs text-gray-500 mt-1">
              صور: JPG, PNG, WebP | فيديو: MP4, MOV | الحد الأقصى 150 ميجابايت
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              المقاس الموصى به للصور: 1200 × 400 px (نسبة 3:1)
            </p>
          </div>

          {/* Preview */}
          {previewUrl && selectedFile && (
            <div className="rounded-lg overflow-hidden border" style={{ aspectRatio: "3/1" }}>
              {selectedFile.type.startsWith("video/") ? (
                <video src={previewUrl} controls className="w-full h-full object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={previewUrl} alt="معاينة" className="w-full h-full object-cover" />
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setShowAddModal(false)} disabled={uploading}>
              إلغاء
            </Button>
            <Button onClick={handleCreate} disabled={uploading || !selectedFile}>
              {uploading ? "جاري الرفع..." : "رفع الإعلان"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
