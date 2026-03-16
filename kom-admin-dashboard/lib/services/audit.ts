import api from "../api";
import type { AuditLogItem, PaginatedResponse } from "../types";

export async function getAuditLogs(params?: Record<string, unknown>) {
  const { data } = await api.get("/admin/audit-logs", { params });
  return {
    data: data.data,
    total: data.meta?.total ?? 0,
    page: data.meta?.page ?? 1,
    limit: data.meta?.take ?? 10,
  } as PaginatedResponse<AuditLogItem>;
}
