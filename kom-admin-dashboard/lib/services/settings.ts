import api from "../api";

export async function getSettings() {
  const { data } = await api.get("/admin/settings");
  return data.data as Record<string, string | number | boolean | unknown>;
}

export async function updateSetting(payload: { key: string; value: string | number | boolean; type?: string }) {
  const { data } = await api.patch("/admin/settings", payload);
  return data.data as { key: string; value: string };
}
