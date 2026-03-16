import api from "../api";
import type { AuthUser, UserProfile } from "../types";

export async function login(payload: { email: string; password: string }) {
  const { data } = await api.post("/auth/login", payload);
  return data.data as { user: AuthUser; accessToken: string; refreshToken: string };
}

export async function getMe() {
  const { data } = await api.get("/auth/me");
  return data.data as UserProfile;
}

export async function logout(refreshToken: string) {
  return api.post("/auth/logout", { refreshToken });
}
