import api from "../api";
import type { PaginatedResponse, ReportItem } from "../types";

export async function getReports(params?: Record<string, unknown>) {
  const { data } = await api.get("/admin/reports", { params });
  return {
    data: data.data,
    total: data.meta?.total ?? 0,
    page: data.meta?.page ?? 1,
    limit: data.meta?.take ?? 10,
  } as PaginatedResponse<ReportItem>;
}

export async function resolveReport(id: string, payload: { action: "resolve" | "dismiss"; resolution?: string }) {
  const { data } = await api.patch(`/admin/reports/${id}/resolve`, payload);
  return data.data as { message: string };
}
