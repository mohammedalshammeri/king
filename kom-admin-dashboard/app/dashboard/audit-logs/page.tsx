"use client";

import { useEffect, useState } from "react";
import api from "../../../lib/api";
import { getAuditLogs } from "../../../lib/services/audit";
import type { AuditLogItem, PaginatedResponse } from "../../../lib/types";
import { Badge } from "@/components/ui/badge";
import { Loader } from "../../../components/ui/loader";
import { useToast } from "../../../components/ui/toast";

export default function AuditLogsPage() {
  const { pushToast } = useToast();
  const [data, setData] = useState<PaginatedResponse<AuditLogItem> | null>(null);
  const [loading, setLoading] = useState(true);
  const [entityLookup, setEntityLookup] = useState<Record<string, { title?: string; owner?: string }>>({});

  const getActionLabel = (action: string) => {
    const map: Record<string, string> = {
      LISTING_APPROVED: "تمت الموافقة على الإعلان",
      LISTING_REJECTED: "تم رفض الإعلان",
      LISTING_REACTIVATED: "تم إعادة تفعيل الإعلان",
      USER_APPROVED: "تم اعتماد المستخدم",
      USER_REJECTED: "تم رفض المستخدم",
      USER_BANNED: "تم حظر المستخدم",
      USER_UNBANNED: "تم رفع الحظر عن المستخدم",
      ADMIN_CREATED: "تم إنشاء مسؤول",
      ADMIN_PERMISSIONS_UPDATED: "تم تحديث صلاحيات المسؤول",
      ADMIN_DEACTIVATED: "تم تعطيل المسؤول",
      SETTING_UPDATED: "تم تحديث إعدادات النظام",
      REPORT_RESOLVED: "تم حل البلاغ",
      REPORT_DISMISSED: "تم تجاهل البلاغ",
      STORY_APPROVED: "تمت الموافقة على القصة",
      STORY_REJECTED: "تم رفض القصة",
      STORY_COMMENT_APPROVED: "تمت الموافقة على تعليق",
      STORY_COMMENT_REJECTED: "تم رفض تعليق"
    };
    return map[action] || action;
  };

  const getEntityTitle = (log: AuditLogItem) => {
    const anyLog = log as any;
    const lookupKey = `${log.entityType}:${anyLog?.entityId ?? ""}`;
    return (
      entityLookup[lookupKey]?.title ||
      anyLog?.entity?.title ||
      anyLog?.entityTitle ||
      anyLog?.metadata?.listingTitle ||
      anyLog?.meta?.listingTitle ||
      anyLog?.subject?.title ||
      anyLog?.target?.title ||
      anyLog?.entity?.name ||
      anyLog?.entityName ||
      anyLog?.subject?.name ||
      anyLog?.target?.name ||
      anyLog?.entityId ||
      "-"
    );
  };

  const getEntityOwner = (log: AuditLogItem) => {
    const anyLog = log as any;
    const lookupKey = `${log.entityType}:${anyLog?.entityId ?? ""}`;
    if (entityLookup[lookupKey]?.owner) {
      return entityLookup[lookupKey]?.owner;
    }
    const entity = anyLog?.entity || anyLog?.subject || anyLog?.target;
    const owner =
      entity?.owner ||
      entity?.user ||
      anyLog?.affectedUser ||
      anyLog?.affectedOwner ||
      anyLog?.entityOwner;

    const name =
      owner?.companyName ||
      owner?.company?.name ||
      owner?.fullName ||
      owner?.name ||
      owner?.email ||
      entity?.ownerName ||
      anyLog?.entityOwnerName ||
      "-";

    const rawType =
      owner?.type ||
      owner?.ownerType ||
      entity?.ownerType ||
      anyLog?.entityOwnerType;

    if (!rawType || rawType === "-") {
      return name;
    }

    const typeLabel = rawType === "COMPANY" ? "شركة" : rawType === "INDIVIDUAL" ? "فرد" : rawType;
    return `${name} (${typeLabel})`;
  };

  const extractOwnerLabel = (owner: any) => {
    if (!owner) return "-";
    const name =
      owner.companyName ||
      owner.company?.name ||
      owner.fullName ||
      owner.individualProfile?.fullName ||
      owner.showroomProfile?.showroomName ||
      owner.name ||
      owner.email ||
      "-";
    const rawType = owner.type || owner.ownerType || owner.companyType || owner.role;
    if (!rawType || rawType === "-") return name;
    const typeLabel = rawType === "COMPANY" || rawType === "USER_SHOWROOM" ? "معرض" : rawType === "INDIVIDUAL" || rawType === "USER_INDIVIDUAL" ? "فرد" : rawType;
    return `${name} (${typeLabel})`;
  };

  const resolveEntityFromResponse = (payload: any) => {
    if (!payload) return null;
    return payload?.data ?? payload;
  };

  const fetchEntity = async (entityType: string, entityId?: string) => {
    if (!entityId) return null;
    const endpointsByType: Record<string, string[]> = {
      Listing: [
        `/admin/listings/${entityId}`,
        `/listings/${entityId}`,
      ],
      User: [
        `/admin/users/${entityId}`,
        `/users/${entityId}`,
      ],
      Report: [
        `/admin/reports/${entityId}`,
        `/reports/${entityId}`,
      ],
      SystemSetting: [
        `/admin/system-settings/${entityId}`,
        `/system-settings/${entityId}`,
      ],
      Story: [
        `/admin/stories/${entityId}`,
      ],
      StoryComment: [
        `/admin/stories/comments/${entityId}`,
      ],
    };

    const endpoints = endpointsByType[entityType] ?? [];
    for (const endpoint of endpoints) {
      try {
        const { data } = await api.get(endpoint);
        const resolved = resolveEntityFromResponse(data);
        if (resolved) return resolved;
      } catch {
        // ignore and try next endpoint
      }
    }
    return null;
  };

  const hydrateEntities = async (logs: AuditLogItem[]) => {
    const updates: Record<string, { title?: string; owner?: string }> = {};
    const requests = logs.map(async (log) => {
      const anyLog = log as any;
      const entityId = anyLog?.entityId;
      if (!entityId) return;
      const key = `${log.entityType}:${entityId}`;
      if (entityLookup[key]) return;

      const entity = await fetchEntity(log.entityType, entityId);
      if (!entity) return;

      const owner =
        entity?.owner ||
        entity?.user ||
        entity?.company ||
        entity?.ownerUser ||
        entity?.ownerCompany ||
        entity?.createdBy;

      const title =
        entity?.title ||
        entity?.name ||
        entity?.subject ||
        entity?.email ||
        (entity?.mediaType ? `${entity.mediaType} قصة` : null) ||
        (entity?.text ? `تعليق: ${entity.text.substring(0, 20)}...` : null) ||
        entity?.id ||
        "-";

      updates[key] = {
        title,
        owner: extractOwnerLabel(owner),
      };
    });

    await Promise.all(requests);

    if (Object.keys(updates).length > 0) {
      setEntityLookup((prev) => ({
        ...prev,
        ...updates,
      }));
    }
  };

  const load = async () => {
    try {
      const response = await getAuditLogs();
      setData(response);
      await hydrateEntities(response.data ?? []);
    } catch {
      pushToast({ type: "error", message: "تعذر تحميل سجل العمليات" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-black/60">
        <Loader />
        جاري تحميل السجل...
      </div>
    );
  }

  return (
    <div className="rounded-xl shadow-sm bg-white overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 text-sm font-semibold border-b border-gray-100">سجل العمليات</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500 font-medium">
            <tr>
              <th className="p-3 text-right">المشغل</th>
              <th className="p-3 text-right">العملية</th>
              <th className="p-3 text-right">الكيان</th>
              <th className="p-3 text-right">اسم الإعلان/العنصر</th>
              <th className="p-3 text-right">المالك</th>
              <th className="p-3 text-right">التاريخ</th>
            </tr>
          </thead>
          <tbody>
            {data?.data?.map((log) => (
              <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors last:border-0">
                <td className="p-3">{log.actor?.email ?? "-"}</td>
                <td className="p-3">
                  <Badge>{getActionLabel(log.action)}</Badge>
                </td>
                <td className="p-3">{log.entityType}</td>
                <td className="p-3">{getEntityTitle(log)}</td>
                <td className="p-3">{getEntityOwner(log)}</td>
                <td className="p-3" dir="rtl">
                  {new Date(log.createdAt).toLocaleString("en-GB", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
