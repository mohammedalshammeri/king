import api from "../api";

export interface LuckEntry {
  id: string;
  code: string;
  isWinner: boolean;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string;
    registeredAt: string;
  };
}

export interface LuckStatus {
  isEnabled: boolean;
  winner: {
    code: string;
    userName: string;
    drawnAt: string;
  } | null;
  totalEntries: number;
  entries: LuckEntry[];
}

export const LuckService = {
  async getEntries(): Promise<LuckStatus> {
    const { data } = await api.get("/admin/luck/entries");
    return (data.data ?? data) as LuckStatus;
  },

  async toggle(): Promise<{ isEnabled: boolean; message: string }> {
    const { data } = await api.post("/admin/luck/toggle");
    return (data.data ?? data) as { isEnabled: boolean; message: string };
  },

  async drawWinner(): Promise<{ success: boolean; winner: { code: string }; message: string }> {
    const { data } = await api.post("/admin/luck/draw");
    // drawWinner already returns { success: true, ... } so it may not be wrapped.
    return (data.data ?? data) as { success: boolean; winner: { code: string }; message: string };
  },

  async getStatus(): Promise<{ isEnabled: boolean; winner: { code: string; drawnAt: string; userName: string } | null }> {
    const { data } = await api.get("/luck/status");
    return (data.data ?? data) as {
      isEnabled: boolean;
      winner: { code: string; drawnAt: string; userName: string } | null;
    };
  },
};
