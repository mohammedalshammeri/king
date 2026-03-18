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
    console.log('⚠️ Push notifications don\'t work on simulators');
    return null;
  }

  // Request permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    console.log('📱 Requesting notification permissions...');
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.warn('❌ Notification permission denied');
    return null;
  }

  console.log('✅ Notification permission granted');

  // Android requires a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'الإشعارات',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#D4AF37',
      sound: 'default',
    });
    console.log('✅ Android notification channel created');
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: '38364066-6118-4eb7-ad6a-22eeecd37a69', // from app.json extra.eas.projectId
    });
    console.log('✅ Push token obtained:', tokenData.data.substring(0, 30) + '...');
    return tokenData.data;
  } catch (error) {
    console.error('❌ Failed to get push token:', error);
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
    console.log('✅ Push token saved to server (authenticated)');
  } catch (error) {
    console.error('Failed to save push token to server:', error);
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
    console.log('✅ Guest push token saved');
  } catch (error) {
    console.error('Failed to save guest push token:', error);
    // Silent fail — non-critical
  }
}
