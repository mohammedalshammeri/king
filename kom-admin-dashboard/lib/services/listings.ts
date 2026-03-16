import api from "../api";
import type { ListingSummary, PaginatedResponse } from "../types";

export async function getApprovedListings(params?: Record<string, unknown>) {
  // Uses the public endpoint which returns approved listings by default
  const { data } = await api.get("/listings", { params });
  return {
    data: data.data,
    total: data.meta?.total ?? 0,
    page: data.meta?.page ?? 1,
    limit: data.meta?.take ?? 10,
  } as PaginatedResponse<ListingSummary>;
}

export async function getListingDetails(id: string) {
    // Tries to get public listing details
    const { data } = await api.get(`/listings/${id}`);
    return data;
}
