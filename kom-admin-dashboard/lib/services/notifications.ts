import api from "../api";
import type { NotificationItem, PaginatedResponse } from "../types";

export async function getNotifications(params?: Record<string, unknown>) {
  const { data } = await api.get("/notifications", { params });
  return {
    data: data.data,
    total: data.meta?.total ?? 0,
    page: data.meta?.page ?? 1,
    limit: data.meta?.take ?? 10,
  } as PaginatedResponse<NotificationItem>;
}

export async function getUnreadCount() {
  const { data } = await api.get("/notifications/unread-count");
  return data.data as { unreadCount: number };
}

export async function markNotificationRead(id: string) {
  const { data } = await api.patch(`/notifications/${id}/read`);
  return data.data as NotificationItem;
}

export async function markAllNotificationsRead() {
  const { data } = await api.patch("/notifications/read-all");
  return data.data as { message: string };
}

export interface BroadcastLog {
  id: string;
  title: string;
  body: string;
  targetType: string;
  sentCount: number;
  createdAt: string;
  sentBy: { id: string; email: string };
}

export async function sendBroadcast(title: string, body: string, targetType = "ALL") {
  const { data } = await api.post("/notifications/admin/broadcast", { title, body, targetType });
  return data as { sentCount: number };
}

export async function getBroadcastHistory(): Promise<BroadcastLog[]> {
  const { data } = await api.get("/notifications/admin/broadcast/history");
  return data.data ?? data;
}
