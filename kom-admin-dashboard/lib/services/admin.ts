import api from "../api";
import type { AdminUser, DashboardStats, PaginatedResponse, UserProfile } from "../types";

export async function getDashboardStats() {
  const { data } = await api.get("/admin/dashboard");
  return data.data as DashboardStats;
}

export async function getUsers(params?: Record<string, unknown>) {
  const { data } = await api.get("/admin/users", { params });
  return {
    data: data.data,
    total: data.meta?.total ?? 0,
    page: data.meta?.page ?? 1,
    limit: data.meta?.take ?? 10,
  } as PaginatedResponse<UserProfile>;
}

export async function banUser(id: string, reason: string) {
  const { data } = await api.patch(`/admin/users/${id}/ban`, { reason });
  return data.data as { message: string };
}

export async function unbanUser(id: string) {
  const { data } = await api.patch(`/admin/users/${id}/unban`);
  return data.data as { message: string };
}

export async function approveUser(id: string) {
  const { data } = await api.patch(`/admin/users/${id}/approve`);
  return data.data as { message: string };
}

export async function rejectUser(id: string) {
  const { data } = await api.post(`/admin/users/${id}/reject`);
  return data.data as { message: string };
}

export async function getAdminUsers(params?: Record<string, unknown>) {
  const { data } = await api.get("/admin/admin-users", { params });
  return {
    data: data.data,
    total: data.meta?.total ?? 0,
    page: data.meta?.page ?? 1,
    limit: data.meta?.take ?? 10,
  } as PaginatedResponse<AdminUser>;
}

export async function createAdmin(payload: {
  email: string;
  password: string;
  permissions?: {
    canReviewListings?: boolean;
    canManageUsers?: boolean;
    canViewReports?: boolean;
  };
}) {
  const { data } = await api.post("/admin/admin-users", payload);
  return data.data as AdminUser;
}

export async function updateAdminPermissions(id: string, payload: {
  canReviewListings?: boolean;
  canManageUsers?: boolean;
  canViewReports?: boolean;
}) {
  const { data } = await api.patch(`/admin/admin-users/${id}/permissions`, payload);
  return data.data as AdminUser;
}
