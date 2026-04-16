"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Loader } from "../../../components/ui/loader";

type HealthStatus = "idle" | "checking" | "healthy" | "degraded";

type EndpointCheck = {
  label: string;
  url: string;
  status: HealthStatus;
  details: string;
};

function getStatusClasses(status: HealthStatus) {
  if (status === "healthy") return "bg-green-50 text-green-700 border-green-200";
  if (status === "degraded") return "bg-red-50 text-red-700 border-red-200";
  if (status === "checking") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-gray-50 text-gray-600 border-gray-200";
}

export default function OperationsPage() {
  const [apiBaseUrl, setApiBaseUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState<string>("");
  const [checks, setChecks] = useState<EndpointCheck[]>([]);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_API_BASE_URL || "NOT SET";
    setApiBaseUrl(url);

    void runChecks(url);
  }, []);

  const runChecks = async (resolvedBaseUrl?: string) => {
    const baseUrl = resolvedBaseUrl || apiBaseUrl || process.env.NEXT_PUBLIC_API_BASE_URL || "";
    if (!baseUrl || baseUrl === "NOT SET") {
      setChecks([
        {
          label: "إعداد API",
          url: "NEXT_PUBLIC_API_BASE_URL",
          status: "degraded",
          details: "متغير البيئة غير مضبوط.",
        },
      ]);
      return;
    }

    setLoading(true);
    const endpointList: EndpointCheck[] = [
      { label: "جاهزية الباكند", url: `${baseUrl}/health/ready`, status: "checking", details: "جاري الفحص..." },
      { label: "حيوية الباكند", url: `${baseUrl}/health/live`, status: "checking", details: "جاري الفحص..." },
      { label: "الفحص الكامل", url: `${baseUrl}/health/check`, status: "checking", details: "جاري الفحص..." },
    ];
    setChecks(endpointList);

    try {
      const results = await Promise.all(
        endpointList.map(async (endpoint) => {
          try {
            const response = await fetch(endpoint.url, { method: "GET" });
            const rawBody = await response.text();
            return {
              ...endpoint,
              status: response.ok ? "healthy" : "degraded",
              details: response.ok
                ? `HTTP ${response.status}`
                : `HTTP ${response.status} - ${rawBody.slice(0, 120) || "بدون تفاصيل"}`,
            } satisfies EndpointCheck;
          } catch (error: unknown) {
            return {
              ...endpoint,
              status: "degraded",
              details: error instanceof Error ? error.message : "فشل الاتصال",
            } satisfies EndpointCheck;
          }
        })
      );

      setChecks(results);
      setLastCheckedAt(new Date().toLocaleString("ar-BH"));
    } finally {
      setLoading(false);
    }
  };

  const healthyCount = checks.filter((item) => item.status === "healthy").length;
  const degradedCount = checks.filter((item) => item.status === "degraded").length;

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">مركز التشغيل</h1>
        <p className="mt-1 text-sm text-gray-500">فحص الاتصال، الجاهزية، ومعلومات الربط التشغيلي للوحة التحكم.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>رابط API</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="break-all text-sm text-gray-700">{apiBaseUrl || "NOT SET"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>الواجهات السليمة</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{healthyCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>الواجهات المتعثرة</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-600">{degradedCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>آخر فحص</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700">{lastCheckedAt || "لم يُنفذ بعد"}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>فحص الجاهزية والحيوية</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm text-gray-500">يتم اختبار endpoints الخاصة بالـ health على الباكند الفعلي.</div>
            <Button onClick={() => void runChecks()} disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader />
                  جاري الفحص...
                </span>
              ) : (
                "إعادة الفحص"
              )}
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {checks.map((check) => (
              <div key={check.label} className={`rounded-xl border p-4 ${getStatusClasses(check.status)}`}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="font-semibold">{check.label}</h3>
                  <span className="rounded-full bg-white/70 px-2 py-1 text-xs">
                    {check.status === "healthy"
                      ? "سليم"
                      : check.status === "degraded"
                        ? "متعثر"
                        : check.status === "checking"
                          ? "جاري الفحص"
                          : "غير مفحوص"}
                  </span>
                </div>
                <p className="mb-2 break-all text-xs opacity-80">{check.url}</p>
                <p className="text-sm">{check.details}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ملاحظات تشغيلية</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>إذا كان رابط API غير مضبوط أو فارغًا فستستخدم اللوحة الرابط المحلي الافتراضي.</p>
          <p>أي فشل في ready أو check يعني أن الباكند أو قاعدة البيانات غير جاهزين بشكل كامل.</p>
          <p>هذه الصفحة بديل تشغيلي عن صفحة Debug القديمة، وتركز على الحالة الفعلية بدل طباعة معلومات خام فقط.</p>
        </CardContent>
      </Card>
    </div>
  );
}
