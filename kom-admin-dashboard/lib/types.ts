export type UserRole = "SUPER_ADMIN" | "ADMIN" | "USER_INDIVIDUAL" | "USER_SHOWROOM";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
}

export interface UserProfile {
  id: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  isActive: boolean;
  isBanned: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
  individualProfile?: { fullName: string; governorate?: string | null; city?: string | null } | null;
  showroomProfile?: { 
    showroomName: string; 
    crNumber?: string | null; 
    governorate?: string | null; 
    city?: string | null;
    merchantType?: string | null;
  } | null;
}

export interface DashboardStats {
  users: { total: number; newToday: number; byType: { type: string; count: number }[] };
  listings: { total: number; pending: number; active: number; byType: { type: string; count: number }[] };
  reports: { open: number };
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string;
  metadata?: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
}

export interface ListingSummary {
  id: string;
  title?: string;
  type: "CAR" | "PLATE" | "PART";
  price: string;
  currency: string;
  ownerType: UserRole;
  status: string;
  postedAt: string | null;
  approvedAt?: string | null;
  expiresAt?: string | null;
  media?: { url: string; type: "IMAGE" | "VIDEO" }[];
}

export interface ListingDetail extends ListingSummary {
  title: string;
  description?: string | null;
  status: string;
  media: { url: string; type: "IMAGE" | "VIDEO"; thumbnailUrl?: string | null }[];
  owner: UserProfile & {
    individualProfile?: { fullName: string } | null;
    showroomProfile?: { showroomName: string; contactPhones?: { phone: string }[] } | null;
  };
  carDetails?: Record<string, unknown> | null;
  plateDetails?: Record<string, unknown> | null;
  partDetails?: Record<string, unknown> | null;
  ownerStats?: { totalListings: number; approvedListings: number };
}

export interface AdminUser {
  id: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  isBanned: boolean;
  createdAt: string;
  lastLoginAt?: string | null;
  adminPermission?: {
    canReviewListings?: boolean;
    canManageUsers?: boolean;
    canViewReports?: boolean;
  } | null;
}

export interface ReportItem {
  id: string;
  type: string;
  reason: string;
  status: string;
  createdAt: string;
  listing?: { id: string; title?: string | null } | null;
  reporter?: { id: string; email: string } | null;
}

export interface AuditLogItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  actor?: { id: string; email: string; role: UserRole } | null;
}
