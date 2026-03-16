"use client";

import { useEffect, useState } from "react";
import { BroadcastLog, sendBroadcast, getBroadcastHistory } from "../../../lib/services/notifications";
import { Button } from "../../../components/ui/button";
import { useToast } from "../../../components/ui/toast";
import { Card } from "../../../components/ui/card";
import { Loader } from "../../../components/ui/loader";
import { Send, History, Users, MessageSquare } from "lucide-react";

export default function NotificationsPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [history, setHistory] = useState<BroadcastLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const { pushToast } = useToast();

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await getBroadcastHistory();
      setHistory(data);
    } catch (e) {
      console.error(e);
      pushToast({ message: "فشل تحميل سجل الإشعارات", type: "error" });
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSend = async () => {
    if (!title.trim()) {
      pushToast({ message: "يرجى إدخال عنوان الإشعار", type: "error" });
      return;
    }
    if (!body.trim()) {
      pushToast({ message: "يرجى إدخال نص الإشعار", type: "error" });
      return;
    }
    if (!confirm(`هل أنت متأكد من إرسال هذا الإشعار لجميع المستخدمين؟\n\nالعنوان: ${title}\nالنص: ${body}`)) return;

    setSending(true);
    try {
      const result = await sendBroadcast(title, body, "ALL");
      pushToast({ message: `تم إرسال الإشعار لـ ${result.sentCount} مستخدم بنجاح`, type: "success" });
      setTitle("");
      setBody("");
      fetchHistory();
    } catch (e) {
      console.error(e);
      pushToast({ message: "فشل إرسال الإشعار", type: "error" });
    } finally {
      setSending(false);
    }
  };

  const totalSent = history.reduce((sum, log) => sum + log.sentCount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">إشعارات الإذاعة</h1>
        <p className="text-sm text-gray-500 mt-1">إرسال إشعارات جماعية لجميع مستخدمي التطبيق</p>
      </div>

      {/* Stats */}
      <div className="flex gap-4 flex-wrap">
        <div className="bg-white rounded-xl px-5 py-3 shadow-sm border text-center">
          <p className="text-2xl font-bold text-primary">{history.length}</p>
          <p className="text-xs text-gray-500">إجمالي الإذاعات</p>
        </div>
        <div className="bg-white rounded-xl px-5 py-3 shadow-sm border text-center">
          <p className="text-2xl font-bold text-green-600">{totalSent.toLocaleString("ar-BH")}</p>
          <p className="text-xs text-gray-500">إجمالي الإشعارات المُرسلة</p>
        </div>
      </div>

      {/* Compose Card */}
      <Card className="p-6 border-none shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <MessageSquare size={20} className="text-primary" />
          <h2 className="text-lg font-semibold">إنشاء إشعار جديد</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">عنوان الإشعار</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: عروض خاصة لعيد الفطر"
              maxLength={100}
              className="w-full border rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
              dir="rtl"
            />
            <p className="text-xs text-gray-400 mt-1 text-left">{title.length}/100</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">نص الإشعار</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="اكتب نص الإشعار هنا..."
              maxLength={300}
              rows={4}
              className="w-full border rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition resize-none"
              dir="rtl"
            />
            <p className="text-xs text-gray-400 mt-1 text-left">{body.length}/300</p>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-3 pt-2 border-t">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Users size={16} />
              <span>سيُرسل لجميع المستخدمين المفعّلين</span>
            </div>
            <Button
              onClick={handleSend}
              disabled={sending || !title.trim() || !body.trim()}
              className="bg-primary hover:bg-primary/90 flex items-center gap-2"
            >
              <Send size={16} />
              {sending ? "جاري الإرسال..." : "إرسال الإشعار"}
            </Button>
          </div>
        </div>
      </Card>

      {/* History */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <History size={20} className="text-gray-600" />
          <h2 className="text-lg font-semibold">سجل الإذاعات</h2>
        </div>

        {loadingHistory ? (
          <div className="flex items-center gap-2 text-sm text-black/60 py-8">
            <Loader />
            جاري تحميل السجل...
          </div>
        ) : history.length === 0 ? (
          <div className="py-16 text-center text-gray-400 border-2 border-dashed rounded-lg">
            <MessageSquare size={40} className="mx-auto mb-3 opacity-40" />
            <p>لا توجد إذاعات سابقة</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((log) => (
              <Card key={log.id} className="p-4 border-none shadow-sm">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base">{log.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{log.body}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      بواسطة: {log.sentBy?.email ?? "غير معروف"} •{" "}
                      {new Date(log.createdAt).toLocaleString("ar-BH")}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-lg font-bold text-primary">{log.sentCount.toLocaleString("ar-BH")}</span>
                    <p className="text-xs text-gray-500">مستخدم تلقى</p>
                    <span className="mt-1 inline-block bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                      {log.targetType === "ALL" ? "الكل" : "المسجّلون"}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
