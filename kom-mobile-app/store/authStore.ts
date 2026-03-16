import { create } from 'zustand';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import api, { BASE_URL } from '../services/api';
import { registerForPushNotificationsAsync, savePushTokenToServer } from '../lib/notifications';

// Secure token helpers — use SecureStore on native, AsyncStorage fallback on web
const isWeb = typeof document !== 'undefined';
async function saveToken(key: string, value: string) {
  if (isWeb) { window.localStorage?.setItem(key, value); return; }
  await SecureStore.setItemAsync(key, value);
}
async function getToken(key: string): Promise<string | null> {
  if (isWeb) return window.localStorage?.getItem(key) ?? null;
  return SecureStore.getItemAsync(key);
}
async function removeToken(key: string) {
  if (isWeb) { window.localStorage?.removeItem(key); return; }
  await SecureStore.deleteItemAsync(key);
}

interface User {
  id: string;
  email: string;
  role: string;
  phone?: string;
  individualProfile?: { fullName: string; avatarUrl?: string; governorate?: string; city?: string };
  showroomProfile?: { showroomName: string; logoUrl?: string; governorate?: string; city?: string };
}

type AvatarSource =
  | string
  | {
      uri?: string;
      fileName?: string;
      mimeType?: string;
      file?: any;
    };

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  restoreDeletedAccount: (email: string, password: string) => Promise<any>;
  register: (userType: 'INDIVIDUAL' | 'SHOWROOM', name: string, email: string, password: string, crNumber?: string, phone?: string, merchantType?: string) => Promise<any>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  changePassword: (oldPassion: string, newPassion: string) => Promise<void>;
  uploadAvatar: (source: AvatarSource) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: false,
  isAuthLoading: false,
  isAuthenticated: false,

  uploadAvatar: async (source) => {
    try {
      set({ isLoading: true });
      const uri = typeof source === 'string' ? source : source?.uri;
      const fileName = typeof source === 'string' ? undefined : source?.fileName;
      const mimeType = typeof source === 'string' ? undefined : source?.mimeType;
      const file = typeof source === 'string' ? undefined : source?.file;

      const fallbackName = fileName || 'avatar.jpg';
      const fallbackType = mimeType || 'image/jpeg';
      const isWebRuntime = typeof document !== 'undefined';

      if (!uri && !file) {
        throw new Error('No image selected');
      }

      const formData = new FormData();

      if (file) {
        formData.append('file', file as any);
      } else if (uri) {
        const isRemoteUri = uri.startsWith('http') || uri.startsWith('blob:') || uri.startsWith('data:');

        if (isWebRuntime && isRemoteUri) {
          const response = await fetch(uri);
          const blob = await response.blob();
          const webFile = new File([blob], fallbackName, { type: fallbackType });
          formData.append('file', webFile as any);
        } else {
          // Fix for Android: Ensure file:// prefix is present for local files
          // Cropped images from ImagePicker might return a path without schema
          let finalUri = uri;
          if (Platform.OS === 'android' && !finalUri.startsWith('file://') && !finalUri.startsWith('content://') && !isRemoteUri) {
             finalUri = `file://${finalUri}`;
          }

          formData.append('file', {
            uri: finalUri,
            name: fallbackName,
            type: fallbackType,
          } as any);
        }
      }

      // Use 'api' instance instead of 'fetch' or 'FileSystem' to benefit from token refresh interceptors
      const response = await api.post('/users/me/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        transformRequest: (data) => data, // Prevent axios from transforming FormData
      });

      const responseBody = response.data;
      const payload = responseBody?.data ?? responseBody;
      const newUrl = payload?.url;
      const currentUser = get().user;
      
      if (currentUser) {
        if (currentUser.role === 'USER_SHOWROOM' && currentUser.showroomProfile) {
          set({ user: { ...currentUser, showroomProfile: { ...currentUser.showroomProfile, logoUrl: newUrl } } });
        } else if (currentUser.role === 'USER_SHOWROOM') {
          set({ user: { ...currentUser, showroomProfile: { showroomName: currentUser.showroomProfile?.showroomName || 'Showroom', logoUrl: newUrl } } });
        } else if (currentUser.role === 'USER_INDIVIDUAL' && currentUser.individualProfile) {
          set({ user: { ...currentUser, individualProfile: { ...currentUser.individualProfile, avatarUrl: newUrl } } });
        } else if (currentUser.role === 'USER_INDIVIDUAL') {
          set({ user: { ...currentUser, individualProfile: { fullName: currentUser.individualProfile?.fullName || 'User', avatarUrl: newUrl } } });
        }
      }
    } catch (error: any) {
      console.error('Upload avatar failed', error?.response?.data || error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  updateProfile: async (data) => {
    try {
      set({ isLoading: true });
      const response = await api.patch('/users/me', data);
      // Update local user data
      const payload = response.data?.data ?? response.data;
      set({ user: payload });
    } catch (error) {
      console.error('Update profile failed', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  changePassword: async (oldPassword, newPassword) => {
    try {
      set({ isLoading: true });
      await api.post('/auth/change-password', { oldPassword, newPassword });
    } catch (error) {
      console.error('Change password failed', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    try {
      set({ isLoading: true });
      const response = await api.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });
      const { accessToken, refreshToken, user } = response.data.data;

      await saveToken('access_token', accessToken);
      await saveToken('refresh_token', refreshToken);
      set({ user, isAuthenticated: true });
      // Associate push token with this user account
      registerForPushNotificationsAsync().then((t) => { if (t) savePushTokenToServer(t); });
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  restoreDeletedAccount: async (email, password) => {
    try {
      set({ isLoading: true });
      const response = await api.post('/auth/restore-account', {
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });

      const { accessToken, refreshToken, user, message } = response.data.data;
      await saveToken('access_token', accessToken);
      await saveToken('refresh_token', refreshToken);
      set({ user, isAuthenticated: true });
      return { user, message };
    } catch (error) {
      console.error('Restore account failed', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (userType, name, email, password, crNumber, phone, merchantType) => {
    try {
      set({ isLoading: true });
      if (!email || !password || !name) {
        throw new Error('All fields are required');
      }

      const trimmedPhone = phone?.trim();

      const payload = userType === 'INDIVIDUAL'
        ? {
            email: email.trim(),
            password: password.trim(),
            userType: 'INDIVIDUAL',
            fullName: name.trim(),
            ...(trimmedPhone ? { phone: trimmedPhone } : {}),
          }
        : {
            email: email.trim(),
            password: password.trim(),
            userType: 'SHOWROOM',
            showroomName: name.trim(),
            crNumber: crNumber?.trim(),
            merchantType: merchantType,
            ...(trimmedPhone ? { phone: trimmedPhone } : {}),
          };

      const response = await api.post('/auth/register', payload);
      const data = response.data.data || response.data;
      const { accessToken, refreshToken, user, message } = data;

      if (!accessToken) {
        return { status: 'PENDING', message, luckCode: user?.luckCode ?? null };
      }

      await saveToken('access_token', accessToken);
      await saveToken('refresh_token', refreshToken);
      set({ user, isAuthenticated: true });
      // Associate push token with this user account
      registerForPushNotificationsAsync().then((t) => { if (t) savePushTokenToServer(t); });
      return { status: 'SUCCESS', user };
    } catch (error: any) {
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true });
      await removeToken('access_token');
      await removeToken('refresh_token');
      if (typeof window !== 'undefined') {
        window.localStorage?.removeItem('access_token');
        window.localStorage?.removeItem('refresh_token');
      }
      set({ user: null, isAuthenticated: false });
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      set({ isLoading: false });
    }
  },

  checkAuth: async () => {
    try {
      set({ isAuthLoading: true });
      const token = await getToken('access_token');
      const webToken = typeof window !== 'undefined' ? window.localStorage?.getItem('access_token') : null;
      const effectiveToken = token || webToken;
      if (effectiveToken) {
        // Verify token with /me endpoint
        const response = await api.get('/auth/me');
        set({ user: response.data.data, isAuthenticated: true });
      } else {
        set({ user: null, isAuthenticated: false });
      }
    } catch (error) {
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isAuthLoading: false });
    }
  },

  refreshUser: async () => {
    try {
      const response = await api.get('/auth/me');
      set({ user: response.data.data, isAuthenticated: true });
    } catch (error) {
      console.error('Refresh user failed', error);
    }
  },
}));
