import { afterEach, describe, expect, it, vi } from 'vitest';

type ApiUrlOptions = {
  os: 'android' | 'ios' | 'web';
  envUrl?: string;
  isDevice?: boolean;
  hostUri?: string;
  deviceName?: string;
  isDev?: boolean;
  hostname?: string;
};

async function loadGetApiBaseUrl(options: ApiUrlOptions) {
  vi.resetModules();
  vi.stubEnv('EXPO_PUBLIC_API_URL', options.envUrl ?? '');
  vi.stubGlobal('__DEV__', options.isDev ?? true);

  vi.doMock('expo-constants', () => ({
    default: {
      expoConfig: options.hostUri ? { hostUri: options.hostUri } : {},
      isDevice: options.isDevice ?? true,
      deviceName: options.deviceName ?? '',
    },
  }));

  vi.doMock('react-native', () => ({
    Platform: { OS: options.os },
  }));

  if (options.os === 'web') {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: {
        hostname: options.hostname ?? 'localhost',
      },
    });
  }

  const module = await import('./api-url');
  return module.getApiBaseUrl;
}

describe('getApiBaseUrl', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses EXPO_PUBLIC_API_URL when it is provided', async () => {
    const getApiBaseUrl = await loadGetApiBaseUrl({
      os: 'ios',
      envUrl: 'https://api.kotm.app/api/v1/',
    });

    expect(getApiBaseUrl()).toBe('https://api.kotm.app/api/v1');
  });

  it('throws in non-dev native builds when EXPO_PUBLIC_API_URL is missing', async () => {
    const getApiBaseUrl = await loadGetApiBaseUrl({
      os: 'ios',
      envUrl: '',
      isDev: false,
    });

    expect(() => getApiBaseUrl()).toThrow(/Missing EXPO_PUBLIC_API_URL/);
  });

  it('uses the browser hostname on web when no explicit env URL exists', async () => {
    const getApiBaseUrl = await loadGetApiBaseUrl({
      os: 'web',
      envUrl: '',
      hostname: '192.168.1.10',
    });

    expect(getApiBaseUrl()).toBe('http://192.168.1.10:3000/api/v1');
  });

  it('uses Android emulator host when running on an emulator', async () => {
    const getApiBaseUrl = await loadGetApiBaseUrl({
      os: 'android',
      envUrl: '',
      isDevice: false,
      deviceName: 'Android SDK built for x86',
    });

    expect(getApiBaseUrl()).toBe('http://10.0.2.2:3000/api/v1');
  });
});