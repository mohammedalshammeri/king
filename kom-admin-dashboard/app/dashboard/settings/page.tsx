"use client";

import { useEffect, useState } from "react";
import { getSettings, updateSetting } from "../../../lib/services/settings";
import { Button } from "@/components/ui/button";
import { Input } from "../../../components/ui/input";
import { Loader } from "../../../components/ui/loader";
import { useToast } from "../../../components/ui/toast";

interface SettingMeta {
  label: string;
  description: string;
  type: "boolean" | "number" | "string";
  unit?: string;
}

const SETTING_META: Record<string, SettingMeta> = {
  REQUIRE_PAYMENT_FOR_CAR_LISTING: {
    label: "تفعيل الدفع قبل نشر الإعلان",
    description: "عند التفعيل، يجب على المستخدم دفع رسوم قبل نشر إعلان السيارة",
    type: "boolean",
  },
  LISTING_FEE_BHD: {
    label: "رسوم نشر الإعلان",
    description: "المبلغ المطلوب دفعه لنشر إعلان سيارة واحد",
    type: "number",
    unit: "د.ب",
  },
  MAX_IMAGES_PER_LISTING: {
    label: "الحد الأقصى للصور في الإعلان",
    description: "أقصى عدد يمكن للمستخدم رفعه من الصور في إعلان واحد",
    type: "number",
    unit: "صورة",
  },
  MAX_VIDEOS_PER_LISTING: {
    label: "الحد الأقصى للفيديوهات في الإعلان",
    description: "أقصى عدد يمكن للمستخدم رفعه من الفيديوهات في إعلان واحد",
    type: "number",
    unit: "فيديو",
  },
  MAX_IMAGE_SIZE_MB: {
    label: "الحد الأقصى لحجم الصورة",
    description: "أقصى حجم مسموح به للصورة الواحدة عند الرفع",
    type: "number",
    unit: "ميجابايت",
  },
  MAX_VIDEO_SIZE_MB: {
    label: "الحد الأقصى لحجم الفيديو",
    description: "أقصى حجم مسموح به للفيديو الواحد عند الرفع",
    type: "number",
    unit: "ميجابايت",
  },
  MIN_IMAGES_FOR_CAR: {
    label: "الحد الأدنى للصور (سيارة)",
    description: "الحد الأدنى المطلوب من الصور لإتمام إعلان السيارة",
    type: "number",
    unit: "صورة",
  },
  PRESIGN_UPLOAD_EXPIRATION_SECONDS: {
    label: "مهلة رابط رفع الملفات",
    description: "المدة الزمنية التي يبقى فيها رابط الرفع المؤقت صالحاً",
    type: "number",
    unit: "ثانية",
  },
  THROTTLE_LOGIN_LIMIT: {
    label: "حد محاولات تسجيل الدخول",
    description: "أقصى عدد لمحاولات تسجيل الدخول الفاشلة قبل الحجب المؤقت",
    type: "number",
    unit: "محاولة",
  },
  THROTTLE_TTL: {
    label: "مدة دورة التحديد (Throttle TTL)",
    description: "الفترة الزمنية بالثواني التي يُحسب فيها حد الطلبات",
    type: "number",
    unit: "ثانية",
  },
  THROTTLE_LIMIT: {
    label: "حد الطلبات العام",
    description: "أقصى عدد من الطلبات المسموح بها من نفس العنوان خلال فترة TTL",
    type: "number",
    unit: "طلب",
  },
};

function getFallbackMeta(key: string): SettingMeta {
  return {
    label: key,
    description: "إعداد عام للنظام",
    type: "string",
  };
}

export default function SettingsPage() {
  const { pushToast } = useToast();
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const data = await getSettings();
      setSettings(data);
    } catch {
      pushToast({ type: "error", message: "تعذر تحميل الإعدادات" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const startEdit = (key: string, currentVal: unknown) => {
    setEditKey(key);
    setEditValue(String(currentVal));
  };

  const cancelEdit = () => {
    setEditKey(null);
    setEditValue("");
  };

  const handleSave = async (key: string) => {
    const meta = SETTING_META[key] ?? getFallbackMeta(key);
    try {
      setSaving(true);
      await updateSetting({ key, value: editValue, type: meta.type });
      pushToast({ type: "success", message: "تم حفظ الإعداد بنجاح" });
      cancelEdit();
      await load();
    } catch (error: unknown) {
      const message =
        (error as { response?: { data?: { message?: unknown } } })?.response?.data?.message ||
        "فشل حفظ الإعداد";
      pushToast({ type: "error", message: Array.isArray(message) ? message[0] : String(message) });
    } finally {
      setSaving(false);
    }
  };

  const handleBooleanToggle = async (key: string, currentVal: unknown) => {
    const newVal = String(currentVal) === "true" ? "false" : "true";
    try {
      setSaving(true);
      await updateSetting({ key, value: newVal, type: "boolean" });
      pushToast({ type: "success", message: "تم تحديث الإعداد" });
      await load();
    } catch {
      pushToast({ type: "error", message: "فشل تحديث الإعداد" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-black/60">
        <Loader />
        جاري تحميل الإعدادات...
      </div>
    );
  }

  const entries = settings ? Object.entries(settings) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">إعدادات النظام</h1>
        <p className="text-sm text-gray-500 mt-1">
          جميع الإعدادات التي تؤثر على سلوك التطبيق ومتطلباته
        </p>
      </div>

      <div className="space-y-3">
        {entries.map(([key, val]) => {
          const meta = SETTING_META[key] ?? getFallbackMeta(key);
          const isBoolean = meta.type === "boolean" || String(val) === "true" || String(val) === "false";
          const isEditing = editKey === key;

          return (
            <div
              key={key}
              className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              {/* Label + description */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm">{meta.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{meta.description}</p>
                <p className="text-xs text-gray-300 mt-1 font-mono">{key}</p>
              </div>

              {/* Value / editor */}
              <div className="flex items-center gap-3 shrink-0">
                {isBoolean ? (
                  /* Boolean toggle */
                  <button
                    onClick={() => handleBooleanToggle(key, val)}
                    disabled={saving}
                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${
                      String(val) === "true" ? "bg-green-500" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                        String(val) === "true" ? "translate-x-8" : "translate-x-1"
                      }`}
                    />
                    <span className="sr-only">{String(val) === "true" ? "مفعّل" : "معطّل"}</span>
                  </button>
                ) : isEditing ? (
                  /* Inline edit mode */
                  <div className="flex items-center gap-2">
                    <Input
                      type={meta.type === "number" ? "number" : "text"}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="h-9 w-28 text-sm"
                      dir="ltr"
                      autoFocus
                    />
                    {meta.unit && <span className="text-xs text-gray-500">{meta.unit}</span>}
                    <Button size="sm" onClick={() => handleSave(key)} disabled={saving} className="h-8 text-xs">
                      {saving ? "..." : "حفظ"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-8 text-xs">
                      إلغاء
                    </Button>
                  </div>
                ) : (
                  /* Display mode */
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-700 bg-gray-50 border rounded-lg px-3 py-1.5 min-w-[60px] text-center" dir="ltr">
                      {String(val)}
                    </span>
                    {meta.unit && <span className="text-xs text-gray-400">{meta.unit}</span>}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => startEdit(key, val)}
                      className="h-8 text-xs"
                    >
                      تعديل
                    </Button>
                  </div>
                )}

                {/* Boolean label */}
                {isBoolean && (
                  <span
                    className={`text-xs font-medium ${
                      String(val) === "true" ? "text-green-600" : "text-gray-400"
                    }`}
                  >
                    {String(val) === "true" ? "مفعّل" : "معطّل"}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {entries.length === 0 && (
          <div className="py-12 text-center text-gray-400 border-2 border-dashed rounded-xl">
            لا توجد إعدادات محفوظة
          </div>
        )}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
        ⚠️ تغيير هذه الإعدادات يؤثر مباشرة على سلوك التطبيق. تأكد من القيم قبل الحفظ.
      </div>
    </div>
  );
}
