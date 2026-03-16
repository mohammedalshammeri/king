import api from "../api";
import type { ListingDetail, ListingSummary, PaginatedResponse } from "../types";

export async function getPendingListings(params?: Record<string, unknown>) {
  const { data } = await api.get("/admin/moderation/listings/pending", { params });
  return {
    data: data.data,
    total: data.meta?.total ?? 0,
    page: data.meta?.page ?? 1,
    limit: data.meta?.take ?? 10,
  } as PaginatedResponse<ListingSummary>;
}

export async function getAcceptedListings(params?: Record<string, unknown>) {
  const { data } = await api.get("/admin/moderation/listings/accepted", { params });
  return {
    data: data.data,
    total: data.meta?.total ?? 0,
    page: data.meta?.page ?? 1,
    limit: data.meta?.take ?? 10,
  } as PaginatedResponse<ListingSummary>;
}

export async function getListingForReview(id: string) {
  const { data } = await api.get(`/admin/moderation/listings/${id}`);
  return data.data as ListingDetail;
}

export async function approveListing(id: string) {
  const { data } = await api.post(`/admin/moderation/listings/${id}/approve`);
  return data.data as { message: string };
}

export async function rejectListing(id: string, reason: string) {
  const { data } = await api.post(`/admin/moderation/listings/${id}/reject`, { reason });
  return data.data as { message: string };
}

export async function reactivateListing(id: string) {
  const { data } = await api.post(`/admin/moderation/listings/${id}/reactivate`);
  return data.data;
}

export async function getModerationStats() {
  const { data } = await api.get("/admin/moderation/stats");
  return data.data as { pendingCount: number; approvedToday: number; rejectedToday: number };
}
