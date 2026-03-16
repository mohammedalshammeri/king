import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { getApiBaseUrl } from './api-url';

const isWeb = typeof document !== 'undefined';
async function getStoredToken(key: string): Promise<string | null> {
  if (isWeb) return window.localStorage?.getItem(key) ?? null;
  return SecureStore.getItemAsync(key);
}
async function saveStoredToken(key: string, value: string): Promise<void> {
  if (isWeb) { window.localStorage?.setItem(key, value); return; }
  await SecureStore.setItemAsync(key, value);
}
async function removeStoredToken(key: string): Promise<void> {
  if (isWeb) { window.localStorage?.removeItem(key); return; }
  await SecureStore.deleteItemAsync(key);
}

// iOS Note: If localhost doesn't work on iOS Simulator, replace with your computer's local IP
// Find it: Windows -> ipconfig (look for IPv4), Mac -> ifconfig | grep "inet "
// Example: http://192.168.1.100:3000/api/v1
const BASE_URL = getApiBaseUrl();
const API_PREFIX = '/api/v1';

if (__DEV__) {
  console.log(`🌐 API baseURL: ${BASE_URL}`);
}

const baseOrigin = BASE_URL.endsWith(API_PREFIX)
  ? BASE_URL.slice(0, -API_PREFIX.length)
  : BASE_URL;

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await getStoredToken('access_token');
    const webToken = typeof window !== 'undefined' ? window.localStorage?.getItem('access_token') : null;
    const effectiveToken = token || webToken;
    if (effectiveToken) {
      config.headers.Authorization = `Bearer ${effectiveToken}`;
    }
  } catch (error) {
    console.warn('Error fetching token:', error);
  }
  return config;
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 - Try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't attempt to refresh token if the 401 came from login itself
      if (originalRequest.url && originalRequest.url.includes('/auth/login')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await getStoredToken('refresh_token');
        const webRefreshToken = typeof window !== 'undefined' ? window.localStorage?.getItem('refresh_token') : null;
        const effectiveRefreshToken = refreshToken || webRefreshToken;
        
        if (!effectiveRefreshToken) {
          throw new Error('No refresh token');
        }

        // Call refresh endpoint
        const response = await axios.post(`${baseOrigin}${API_PREFIX}/auth/refresh`, {
          refreshToken: effectiveRefreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;

        // Save new tokens
        await saveStoredToken('access_token', accessToken);
        if (newRefreshToken) {
          await saveStoredToken('refresh_token', newRefreshToken);
        }
        if (typeof window !== 'undefined') {
          window.localStorage?.setItem('access_token', accessToken);
          if (newRefreshToken) {
            window.localStorage?.setItem('refresh_token', newRefreshToken);
          }
        }

        // Update authorization header
        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        processQueue(null, accessToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Clear tokens if refresh fails
        await removeStoredToken('access_token');
        await removeStoredToken('refresh_token');
        if (typeof window !== 'undefined') {
          window.localStorage?.removeItem('access_token');
          window.localStorage?.removeItem('refresh_token');
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Better error logging for debugging
    if (error.code === 'ERR_NETWORK') {
      console.error(`Network Error: Cannot connect to ${BASE_URL}`);
    }
    return Promise.reject(error);
  }
);

export { BASE_URL };

export default api;
