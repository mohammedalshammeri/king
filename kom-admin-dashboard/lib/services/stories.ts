import api from "../api";

export interface Story {
  id: string;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO';
  duration: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  userId: string;
  user: {
      email: string;
      fullName: string;
      avatarUrl?: string;
  };
  createdAt: string;
}

export const StoriesService = {
  getPending: async () => {
    const res = await api.get('/admin/stories/pending');
    return Array.isArray(res.data) ? res.data : (res.data?.data || []);
  },
  getActive: async () => {
    const res = await api.get('/admin/stories/active');
    return Array.isArray(res.data) ? res.data : (res.data?.data || []);
  },
  approve: async (id: string) => {
    await api.patch(`/admin/stories/${id}/approve`);
  },
  reject: async (id: string) => {
    await api.patch(`/admin/stories/${id}/reject`);
  },
  create: async (file: File, type: 'IMAGE' | 'VIDEO', duration?: number) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('mediaType', type);
    if (duration) formData.append('duration', duration.toString());
    
    await api.post('/stories', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  deleteStory: async (id: string) => {
    await api.delete(`/admin/stories/${id}`);
  },
};
