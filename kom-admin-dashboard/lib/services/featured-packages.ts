import api from "../api";

export interface FeaturedPackage {
  id: string;
  nameAr: string;
  price: number;
  durationDays: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFeaturedPackagePayload {
  nameAr: string;
  price: number;
  durationDays: number;
  sortOrder?: number;
}

export interface UpdateFeaturedPackagePayload extends Partial<CreateFeaturedPackagePayload> {
  isActive?: boolean;
}

export const FeaturedPackagesService = {
  getAll: async (): Promise<FeaturedPackage[]> => {
    const { data } = await api.get("/featured-packages/admin/all");
    return data.data ?? data;
  },

  create: async (payload: CreateFeaturedPackagePayload): Promise<FeaturedPackage> => {
    const { data } = await api.post("/featured-packages", payload);
    return data.data ?? data;
  },

  update: async (id: string, payload: UpdateFeaturedPackagePayload): Promise<FeaturedPackage> => {
    const { data } = await api.patch(`/featured-packages/${id}`, payload);
    return data.data ?? data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/featured-packages/${id}`);
  },

  featureListing: async (listingId: string, packageId: string) => {
    const { data } = await api.post(`/featured-packages/listings/${listingId}/feature`, { packageId });
    return data.data ?? data;
  },

  unfeatureListing: async (listingId: string) => {
    const { data } = await api.post(`/featured-packages/listings/${listingId}/unfeature`);
    return data.data ?? data;
  },
};
