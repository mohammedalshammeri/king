import api from "../api";

// ─── Merchant Subscription Packages ─────────────────────────────────────────

export interface SubscriptionPackage {
  id: string;
  name: string;
  description?: string;
  priceMonthly: number;
  price3Months?: number | null;
  price6Months?: number | null;
  price12Months?: number | null;
  discountNote?: string | null;
  maxListings: number;
  maxStories: number;
  durationDays: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  _count?: { subscriptions: number };
}

export interface CreatePackagePayload {
  name: string;
  description?: string;
  priceMonthly: number;
  price3Months?: number | null;
  price6Months?: number | null;
  price12Months?: number | null;
  discountNote?: string | null;
  maxListings: number;
  maxStories?: number;
  durationDays?: number;
  sortOrder?: number;
}

export interface UpdatePackagePayload extends Partial<CreatePackagePayload> {
  isActive?: boolean;
}

function unwrapList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && Array.isArray((data as any).data)) return (data as any).data as T[];
  return [];
}

export async function getPackages(): Promise<SubscriptionPackage[]> {
  const { data } = await api.get("/packages/admin/all");
  return unwrapList<SubscriptionPackage>(data);
}

export async function createPackage(payload: CreatePackagePayload): Promise<SubscriptionPackage> {
  const { data } = await api.post("/packages/admin", payload);
  return data?.data ?? data;
}

export async function updatePackage(id: string, payload: UpdatePackagePayload): Promise<SubscriptionPackage> {
  const { data } = await api.patch(`/packages/admin/${id}`, payload);
  return data?.data ?? data;
}

export async function deletePackage(id: string): Promise<void> {
  await api.delete(`/packages/admin/${id}`);
}

// ─── Individual Listing Packages ─────────────────────────────────────────────

export interface IndividualListingPackage {
  id: string;
  name: string;
  description?: string | null;
  listingCount: number;
  maxStories: number;
  price: number;
  currency: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  _count?: { purchases: number };
}

export interface CreateIndividualPackagePayload {
  name: string;
  description?: string | null;
  listingCount: number;
  maxStories?: number;
  price: number;
  sortOrder?: number;
}

export interface UpdateIndividualPackagePayload extends Partial<CreateIndividualPackagePayload> {
  isActive?: boolean;
}

export async function getIndividualPackages(): Promise<IndividualListingPackage[]> {
  const { data } = await api.get("/packages/admin/individual/all");
  return unwrapList<IndividualListingPackage>(data);
}

export async function createIndividualPackage(payload: CreateIndividualPackagePayload): Promise<IndividualListingPackage> {
  const { data } = await api.post("/packages/admin/individual", payload);
  return data?.data ?? data;
}

export async function updateIndividualPackage(id: string, payload: UpdateIndividualPackagePayload): Promise<IndividualListingPackage> {
  const { data } = await api.patch(`/packages/admin/individual/${id}`, payload);
  return data?.data ?? data;
}

export async function deleteIndividualPackage(id: string): Promise<void> {
  await api.delete(`/packages/admin/individual/${id}`);
}
