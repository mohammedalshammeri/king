"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { getDashboardStats } from "../../lib/services/admin";
import { getModerationStats } from "../../lib/services/moderation";
import type { DashboardStats } from "../../lib/types";
import { Loader } from "../../components/ui/loader";
import { useToast } from "../../components/ui/toast";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [moderationStats, setModerationStats] = useState<{ rejectedToday: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const { pushToast } = useToast();

  useEffect(() => {
    const load = async () => {
      try {
        const [dashboard, moderation] = await Promise.all([
          getDashboardStats(),
          getModerationStats(),
        ]);
        setStats(dashboard);
        setModerationStats({ rejectedToday: moderation.rejectedToday });
      } catch {
        pushToast({ type: "error", message: "تعذر تحميل الإحصائيات" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [pushToast]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-black/60">
        <Loader />
        جاري تحميل الإحصائيات...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>عدد الإعلانات الكلي</CardTitle>
          </CardHeader>
          <CardContent>{stats?.listings.total ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>الإعلانات قيد المراجعة</CardTitle>
          </CardHeader>
          <CardContent>{stats?.listings.pending ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>الإعلانات المقبولة</CardTitle>
          </CardHeader>
          <CardContent>{stats?.listings.active ?? 0}</CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>الإعلانات المرفوضة اليوم</CardTitle>
          </CardHeader>
          <CardContent>{moderationStats?.rejectedToday ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>عدد المستخدمين</CardTitle>
          </CardHeader>
          <CardContent>{stats?.users.total ?? 0}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>المستخدمون اليوم</CardTitle>
          </CardHeader>
          <CardContent>{stats?.users.newToday ?? 0}</CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>البلاغات المفتوحة</CardTitle>
          </CardHeader>
          <CardContent>{stats?.reports.open ?? 0}</CardContent>
        </Card>
      </div>
    </div>
  );
}
