export type UserRole = "SUPER_ADMIN" | "ADMIN" | "USER_INDIVIDUAL" | "USER_SHOWROOM";

export interface User {
  id: string;
  email: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  individualProfile?: { fullName: string };
  showroomProfile?: { showroomName: string };
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface Listing {
  id: string;
  title: string;
  type: "CAR" | "PLATE" | "PART" | "MOTORCYCLE";
  price: number;
  currency: string;
  status: string;
  postedAt: string;
  media: { url: string; type: "IMAGE" | "VIDEO" }[];
  ownerType: UserRole;
  owner?: User;
  carDetails?: any;
  plateDetails?: any;
  partDetails?: any;
}
