import api from "../api";

export interface AdminVideo {
  id: string;
  title?: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  viewsCount: number;
  isActive: boolean;
  createdAt: string;
}

export const AdminVideosService = {
  getAll: async (): Promise<AdminVideo[]> => {
    const res = await api.get("/admin-videos");
    return res.data.data;
  },

  create: async (file: File, title?: string, description?: string) => {
    const formData = new FormData();
    formData.append("file", file);
    if (title) formData.append("title", title);
    if (description) formData.append("description", description);

    const res = await api.post("/admin-videos", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 600000, // 10 minutes for video uploads
    });
    return res.data.data;
  },

  delete: async (id: string) => {
      await api.delete(`/admin-videos/${id}`);
  }
};
