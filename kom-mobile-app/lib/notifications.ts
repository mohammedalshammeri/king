import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import api from '../services/api';

// Configure how notifications appear while app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotificationsAsync(): Promise<string | null> {
  if (!Device.isDevice) {
    // Push notifications don't work on simulators
    return null;
  }

  // Request permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  // Android requires a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'الإشعارات',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#D4AF37',
      sound: 'default',
    });
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: '076a3d84-3f92-4bf7-b8b3-9b208fa98891', // from app.json extra.eas.projectId
    });
    return tokenData.data;
  } catch {
    return null;
  }
}

import axios from 'axios';
import { BASE_URL } from '../services/api';

// Save token for authenticated (logged-in) users — associates token with userId
export async function savePushTokenToServer(token: string): Promise<void> {
  try {
    await api.post('/notifications/devices/token', {
      token,
      platform: Platform.OS,
    });
  } catch {
    // Silent fail — non-critical
  }
}

// Save token for anonymous/guest users — no auth required
export async function saveGuestPushToken(token: string): Promise<void> {
  try {
    await axios.post(`${BASE_URL}/notifications/devices/token/guest`, {
      token,
      platform: Platform.OS,
    });
  } catch {
    // Silent fail — non-critical
  }
}
