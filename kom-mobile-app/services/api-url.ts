import Constants from 'expo-constants';
import { Platform } from 'react-native';

const DEFAULT_PORT = 3000;
const DEFAULT_PREFIX = '/api/v1';

function stripTrailingSlashes(url: string): string {
  return url.replace(/\/+$/, '');
}

function getHostFromExpoDevServer(): string | null {
  // Typically looks like: "192.168.1.10:8081"
  const hostUri =
    Constants.expoConfig?.hostUri ??
    // legacy fallbacks
    (Constants as any).manifest?.hostUri ??
    (Constants as any).manifest2?.extra?.expoClient?.hostUri;

  if (!hostUri || typeof hostUri !== 'string') return null;
  return hostUri.split(':')[0] || null;
}

export function getApiBaseUrl(): string {
  // 1. If an explicit API URL is set in env vars, use it (works in Dev and Prod)
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && envUrl.trim()) {
    console.log('[api-url] Using EXPO_PUBLIC_API_URL:', envUrl);
    return stripTrailingSlashes(envUrl.trim());
  }

  // 🚨 Release safety: Never allow a production (non-dev) native build to guess the API URL.
  // In EAS/Store builds `__DEV__` is false, and hostUri/devServerHost isn't available.
  // Without EXPO_PUBLIC_API_URL the app would fall back to localhost/IP and break in production.
  if (!__DEV__ && Platform.OS !== 'web') {
    throw new Error(
      '[api-url] Missing EXPO_PUBLIC_API_URL for a non-dev build. ' +
        'Set EXPO_PUBLIC_API_URL (e.g. https://api.yourdomain.com/api/v1) via EAS build profile env or EAS secrets.',
    );
  }

  // Determine Port and Prefix
  const port = process.env.EXPO_PUBLIC_API_PORT
    ? Number(process.env.EXPO_PUBLIC_API_PORT)
    : DEFAULT_PORT;

  const prefix = process.env.EXPO_PUBLIC_API_PREFIX || DEFAULT_PREFIX;

  const devServerHost = getHostFromExpoDevServer();

  // Debug Log
  if (__DEV__) {
    console.log(
      `[api-url] platform=${Platform.OS} isDevice=${String(Constants.isDevice)} hostUri=${String(
        Constants.expoConfig?.hostUri,
      )} devServerHost=${String(devServerHost)} process.env.API_PORT=${process.env.EXPO_PUBLIC_API_PORT}`,
    );
  }

  // 2. Handle Web Platform
  if (Platform.OS === 'web') {
    // If running in browser, use the same hostname (e.g. localhost or 192.168.x.x)
    if (typeof window !== 'undefined' && window.location && window.location.hostname) {
      const hostname = window.location.hostname;
      console.log(`[api-url] Web detected. Using hostname: ${hostname}`);
      return `http://${hostname}:${port}${prefix}`;
    }
    console.log('[api-url] Web detected fallback to localhost');
    return `http://localhost:${port}${prefix}`;
  }

  // 3. Handle Android Emulator
  const deviceName = (Constants.deviceName ?? '').toLowerCase();
  const isAndroidEmulator = Platform.OS === 'android' && Constants.isDevice === false;
  const isLikelyAndroidEmulator =
    Platform.OS === 'android' &&
    (isAndroidEmulator ||
      deviceName.includes('emulator') ||
      deviceName.includes('android sdk') ||
      deviceName.includes('sdk_gphone') ||
      deviceName.includes('google_sdk') ||
      deviceName.includes('vbox'));

  // Android emulator should use 10.0.2.2 to reach the host machine
  if (isLikelyAndroidEmulator) {
    return `http://10.0.2.2:${port}${prefix}`;
  }

  // 4. Handle iOS Simulator / Physical Device (Dev Mode)
  // Prefer using the same host as the Expo dev server
  if (devServerHost) {
    return `http://${devServerHost}:${port}${prefix}`;
  }

  // 5. Fallback for Android emulator when hostUri isn't available
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${port}${prefix}`;
  }

  // 6. Generic Fallback
  return `http://localhost:${port}${prefix}`;
}
