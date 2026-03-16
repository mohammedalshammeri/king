import api from "../api";

export interface Advertisement {
  id: string;
  title?: string;
  mediaUrl: string;
  mediaType: "IMAGE" | "VIDEO";
  thumbnailUrl?: string;
  linkUrl?: string;
  isActive: boolean;
  sortOrder: number;
  startDate?: string;
  endDate?: string;
  viewsCount: number;
  clicksCount: number;
  createdAt: string;
}

export const AdvertisementsService = {
  getAll: async (): Promise<Advertisement[]> => {
    const res = await api.get("/advertisements/admin/all");
    return res.data.data ?? res.data;
  },

  create: async (
    file: File,
    title?: string,
    linkUrl?: string,
    sortOrder?: number,
    startDate?: string,
    endDate?: string,
  ): Promise<Advertisement> => {
    const formData = new FormData();
    formData.append("file", file);
    if (title) formData.append("title", title);
    if (linkUrl) formData.append("linkUrl", linkUrl);
    if (sortOrder !== undefined) formData.append("sortOrder", String(sortOrder));
    if (startDate) formData.append("startDate", startDate);
    if (endDate) formData.append("endDate", endDate);

    const res = await api.post("/advertisements", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 600000,
    });
    return res.data.data ?? res.data;
  },

  toggle: async (id: string, isActive: boolean): Promise<Advertisement> => {
    const res = await api.patch(`/advertisements/${id}/toggle`, { isActive });
    return res.data.data ?? res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/advertisements/${id}`);
  },
};
