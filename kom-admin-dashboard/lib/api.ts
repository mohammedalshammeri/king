import axios from "axios";
import { clearAccessToken, getAccessToken } from "./token";

const configuredBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
const fallbackBaseUrl = "http://localhost:3002/api/v1";

const baseURL = configuredBaseUrl ?? fallbackBaseUrl;

if (!configuredBaseUrl && typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.warn(
    `[KOM Admin] NEXT_PUBLIC_API_BASE_URL is not set. Falling back to ${fallbackBaseUrl}. ` +
      "If you see Axios 'Network Error', make sure the backend is running on that URL."
  );
}

const api = axios.create({
  baseURL,
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearAccessToken();
    }

    // Browser-only: Axios 'Network Error' usually means the backend is down,
    // the URL/port is wrong, or the request is blocked before getting a response.
    if (typeof window !== "undefined" && error?.message === "Network Error") {
      // eslint-disable-next-line no-console
      console.error(
        "[KOM Admin] Network Error while calling API.",
        "baseURL=", baseURL,
        "url=", error?.config?.url
      );
    }

    return Promise.reject(error);
  }
);

export default api;
