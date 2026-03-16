"use client";

import { useEffect, useState } from "react";
import { LuckService, LuckEntry } from "../../../lib/services/luck";
import { Loader } from "../../../components/ui/loader";
import { Button } from "../../../components/ui/button";
import { useToast } from "../../../components/ui/toast";
import { Card } from "../../../components/ui/card";

export default function LuckPage() {
  const [loading, setLoading] = useState(true);
  const [isEnabled, setIsEnabled] = useState(false);
  const [entries, setEntries] = useState<LuckEntry[]>([]);
  const [totalEntries, setTotalEntries] = useState(0);
  const [winner, setWinner] = useState<{ code: string; userName: string; drawnAt: string } | null>(null);
  const [toggling, setToggling] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [confirmDraw, setConfirmDraw] = useState(false);

  const { pushToast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await LuckService.getEntries();
      setIsEnabled(data.isEnabled);
      setEntries(data.entries || []);
      setTotalEntries(data.totalEntries || 0);
      setWinner(data.winner || null);
    } catch (err) {
      console.error(err);
      pushToast({ message: "فشل تحميل بيانات الحظ", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggle = async () => {
    setToggling(true);
    try {
      const res = await LuckService.toggle();
      setIsEnabled(res.isEnabled);
      pushToast({ message: res.message, type: "success" });
    } catch (err) {
      pushToast({ message: "فشل تغيير الحالة", type: "error" });
    } finally {
      setToggling(false);
    }
  };

  const handleDraw = async () => {
    setDrawing(true);
    setConfirmDraw(false);
    try {
      const res = await LuckService.drawWinner();
      pushToast({ message: res.message, type: "success" });
      await fetchData();
    } catch (err: any) {
      const msg = err?.response?.data?.message || "فشل سحب الفائز";
      pushToast({ message: msg, type: "error" });
    } finally {
      setDrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🎰 نظام الحظ</h1>
          <p className="text-sm text-gray-500 mt-1">
            إدارة ميزة الكود العشوائي عند تسجيل المستخدمين الجدد
          </p>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 border-r-4 border-r-amber-500">
          <p className="text-sm text-gray-500 font-medium">حالة الميزة</p>
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ${
                isEnabled
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isEnabled ? "bg-green-500" : "bg-red-500"
                }`}
              />
              {isEnabled ? "مفعّلة" : "موقوفة"}
            </span>
          </div>
        </Card>

        <Card className="p-5 border-r-4 border-r-blue-500">
          <p className="text-sm text-gray-500 font-medium">عدد المشتركين</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{totalEntries}</p>
        </Card>

        <Card className="p-5 border-r-4 border-r-purple-500">
          <p className="text-sm text-gray-500 font-medium">الكود الفائز</p>
          {winner ? (
            <div className="mt-2">
              <p className="text-2xl font-bold text-purple-700 tracking-widest">{winner.code}</p>
              <p className="text-xs text-gray-500 mt-1">{winner.userName}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-400 mt-2">لم يتم السحب بعد</p>
          )}
        </Card>
      </div>

      {/* Actions */}
      <Card className="p-5">
        <h2 className="text-lg font-bold text-gray-800 mb-4">إجراءات</h2>
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={handleToggle}
            disabled={toggling}
            className={isEnabled ? "bg-red-500 hover:bg-red-600 text-white" : "bg-green-600 hover:bg-green-700 text-white"}
          >
            {toggling ? (
              <Loader className="h-4 w-4" />
            ) : isEnabled ? (
              "⏸ إيقاف الميزة"
            ) : (
              "▶ تفعيل الميزة"
            )}
          </Button>

          {!winner && (
            <>
              {!confirmDraw ? (
                <Button
                  onClick={() => setConfirmDraw(true)}
                  disabled={drawing || totalEntries === 0}
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                >
                  🎲 سحب الفائز
                </Button>
              ) : (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 rounded-lg px-4 py-2">
                  <span className="text-sm font-medium text-amber-800">
                    هل أنت متأكد؟ السحب لا يمكن التراجع عنه!
                  </span>
                  <Button
                    onClick={handleDraw}
                    disabled={drawing}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-xs px-3 py-1"
                  >
                    {drawing ? <Loader className="h-3 w-3" /> : "نعم، اسحب الآن"}
                  </Button>
                  <Button
                    onClick={() => setConfirmDraw(false)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs px-3 py-1"
                  >
                    إلغاء
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {totalEntries === 0 && !isEnabled && (
          <p className="text-xs text-gray-400 mt-3">
            💡 فعّل الميزة أولاً حتى يبدأ المستخدمون الجدد بالحصول على أكواد
          </p>
        )}
      </Card>

      {/* Winner Banner */}
      {winner && (
        <Card className="p-6 bg-gradient-to-l from-amber-50 to-yellow-50 border-2 border-amber-300">
          <div className="flex items-center gap-4">
            <div className="text-5xl">🏆</div>
            <div>
              <p className="text-sm text-amber-700 font-medium">الكود الفائز</p>
              <p className="text-4xl font-bold text-amber-800 tracking-[0.4em] mt-1">{winner.code}</p>
              <p className="text-sm text-amber-600 mt-1">
                الفائز: <strong>{winner.userName}</strong> — تم السحب:{" "}
                {new Date(winner.drawnAt).toLocaleString("ar-BH")}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Entries Table */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">
            قائمة المشتركين ({totalEntries})
          </h2>
        </div>

        {entries.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">🎟</p>
            <p className="font-medium">لا يوجد مشتركون بعد</p>
            <p className="text-sm mt-1">فعّل الميزة وانتظر تسجيل مستخدمين جدد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-right">
                  <th className="px-5 py-3 font-semibold">#</th>
                  <th className="px-5 py-3 font-semibold">الكود</th>
                  <th className="px-5 py-3 font-semibold">اسم المستخدم</th>
                  <th className="px-5 py-3 font-semibold">البريد الإلكتروني</th>
                  <th className="px-5 py-3 font-semibold">تاريخ التسجيل</th>
                  <th className="px-5 py-3 font-semibold">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map((entry, i) => (
                  <tr
                    key={entry.id}
                    className={entry.isWinner ? "bg-amber-50" : "hover:bg-gray-50"}
                  >
                    <td className="px-5 py-3 text-gray-400">{i + 1}</td>
                    <td className="px-5 py-3">
                      <span className="font-mono font-bold text-lg tracking-widest text-gray-800">
                        {entry.code}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-700 font-medium">{entry.user.name}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{entry.user.email}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">
                      {new Date(entry.createdAt).toLocaleString("ar-BH")}
                    </td>
                    <td className="px-5 py-3">
                      {entry.isWinner ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                          🏆 فائز
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500">
                          مشترك
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
