import api from "../api";

export interface SubscriptionPackageInfo {
  id: string;
  name: string;
  priceMonthly: number;
  durationDays: number;
  maxListings: number;
}

export interface UserSubscriptionInfo {
  status: string;
  startDate: string;
  endDate: string;
  listingsUsed: number;
  package: { name: string; maxListings: number; durationDays: number };
}

export interface PaymentTransaction {
  id: string;
  amount: number;
  currency: string;
  status: "PENDING" | "PENDING_PROOF" | "PAID" | "FAILED" | "REFUNDED";
  paymentType: string;
  proofImageUrl?: string | null;
  adminNote?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  subscriptionPackage?: SubscriptionPackageInfo | null;
  user?: {
    id: string;
    email: string;
    phone?: string | null;
    role?: string;
    individualProfile?: { fullName: string; avatarUrl?: string | null } | null;
    showroomProfile?: { showroomName: string; logoUrl?: string | null; merchantType?: string | null } | null;
    subscription?: UserSubscriptionInfo | null;
  };
  listing?: { id: string; title: string } | null;
}

export interface PaginatedPayments {
  data: PaymentTransaction[];
  total: number;
  page: number;
  limit: number;
}

// helper: normalize different API shapes
function extractArray(payload: any): PaymentTransaction[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.result)) return payload.result;
  return [];
}

function extractPaginated(payload: any, page: number, limit: number): PaginatedPayments {
  // common: { data: [], total, page, limit }
  if (payload && Array.isArray(payload.data)) {
    return {
      data: payload.data,
      total: Number(payload.total ?? payload.data.length ?? 0),
      page: Number(payload.page ?? page),
      limit: Number(payload.limit ?? limit),
    };
  }

  // nested: { data: { data: [], total, page, limit } }
  if (payload?.data && Array.isArray(payload.data.data)) {
    return {
      data: payload.data.data,
      total: Number(payload.data.total ?? payload.data.data.length ?? 0),
      page: Number(payload.data.page ?? page),
      limit: Number(payload.data.limit ?? limit),
    };
  }

  // fallback: array response
  const arr = extractArray(payload);
  return { data: arr, total: arr.length, page, limit };
}

export async function getPendingPayments(): Promise<PaymentTransaction[]> {
  const { data } = await api.get("/payments/admin/pending-review");
  const arr = extractArray(data);

  if (process.env.NODE_ENV === "development" && arr.length === 0) {
    console.warn("[payments] pending-review normalized empty. raw:", data);
  }

  return arr;
}

export async function getAllPayments(page = 1, limit = 20): Promise<PaginatedPayments> {
  const { data } = await api.get("/payments/admin/all", { params: { page, limit } });
  const normalized = extractPaginated(data, page, limit);

  if (process.env.NODE_ENV === "development" && normalized.data.length === 0) {
    console.warn("[payments] admin/all normalized empty. raw:", data);
  }

  return normalized;
}

export async function reviewPayment(
  id: string,
  payload: { action: "APPROVE" | "REJECT"; note?: string }
): Promise<PaymentTransaction> {
  const { data } = await api.patch(`/payments/admin/${id}/review`, payload);
  // بعض السيرفرات ترجع {data: {...}}
  return (data?.data ?? data) as PaymentTransaction;
}