import { DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import {
  useFonts,
  Cairo_400Regular,
  Cairo_500Medium,
  Cairo_700Bold,
  Cairo_800ExtraBold,
} from '@expo-google-fonts/cairo';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  I18nManager,
  Animated,
  View,
  StyleSheet,
  ActivityIndicator,
  Platform,
  AppState,
  Dimensions,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import * as Updates from 'expo-updates';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppErrorBoundary } from '../components/AppErrorBoundary';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { LanguageProvider, useLanguage } from '../context/LanguageContext';
import { registerForPushNotificationsAsync, savePushTokenToServer, saveGuestPushToken } from '../lib/notifications';
import * as Notifications from 'expo-notifications';
import { getApiBaseUrl } from '../services/api-url';
import { io, Socket } from 'socket.io-client';
import { AppLanguage } from '../lib/i18n';
import 'react-native-reanimated';

if (Platform.OS === 'web') {
  require('../global.css');
}

const DIRECTION_RELOAD_KEY = 'app.direction.reload-target';

const syncAppDirection = async (language: AppLanguage) => {
  const shouldBeRTL = language === 'ar';

  if (Platform.OS === 'web') {
    return true;
  }

  I18nManager.allowRTL(true);
  I18nManager.forceRTL(shouldBeRTL);

  if (I18nManager.isRTL === shouldBeRTL) {
    await AsyncStorage.removeItem(DIRECTION_RELOAD_KEY);
    return true;
  }

  const nextTarget = shouldBeRTL ? 'rtl' : 'ltr';
  const reloadedTarget = await AsyncStorage.getItem(DIRECTION_RELOAD_KEY);

  if (reloadedTarget !== nextTarget) {
    await AsyncStorage.setItem(DIRECTION_RELOAD_KEY, nextTarget);
    try {
      await Updates.reloadAsync();
      return false;
    } catch {
      return true;
    }
  }

  return true;
};

SplashScreen.preventAutoHideAsync();

function RootLayoutContent({
  isVideoComplete,
  setIsVideoComplete,
  isSplashAnimationComplete,
  fadeAnim,
  scaleAnim,
  sloganFadeAnim,
}: {
  isVideoComplete: boolean;
  setIsVideoComplete: (v: boolean) => void;
  isSplashAnimationComplete: boolean;
  fadeAnim: Animated.Value;
  scaleAnim: Animated.Value;
  sloganFadeAnim: Animated.Value;
}) {
  const { isDark } = useTheme();
  const { ready: languageReady, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const [directionReady, setDirectionReady] = useState(Platform.OS === 'web');

  const contentBackground = isDark ? '#0f172a' : '#ffffff';

  useEffect(() => {
    if (!languageReady) return;

    let mounted = true;

    const applyDirection = async () => {
      const ready = await syncAppDirection(language);
      if (mounted) setDirectionReady(ready);
    };

    void applyDirection();

    return () => {
      mounted = false;
    };
  }, [languageReady, language]);

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    let mounted = true;

    const applyNavBar = async () => {
      if (!mounted) return;
      try {
        await NavigationBar.setPositionAsync('relative');
        await NavigationBar.setVisibilityAsync('visible');
        await NavigationBar.setBackgroundColorAsync(isDark ? '#0f172a' : '#ffffff');
        await NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark');
      } catch {}
    };

    applyNavBar();
    const sub = AppState.addEventListener('change', (s) => {
      if (s === 'active') applyNavBar();
    });

    return () => {
      mounted = false;
      sub.remove();
    };
  }, [isDark]);

  if (!languageReady || !directionReady) return null;

  return (
    <NavigationThemeProvider value={DefaultTheme}>
      <View style={{ flex: 1, backgroundColor: contentBackground }}>
        {/* SafeArea top padding */}
        <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: contentBackground }}>
          <Stack
            screenOptions={{
              headerShown: false,
              headerTitleAlign: 'center',
              contentStyle: { backgroundColor: contentBackground },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
        </View>

        {/* Video Intro Splash – centered logo-sized video */}
        {!isVideoComplete && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: Dimensions.get('screen').width,
              height: Dimensions.get('screen').height,
              backgroundColor: '#ffffff',
              zIndex: 10000,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Video
              source={require('../assets/images/White Modern Beauty Logo (1).mp4')}
              style={{
                width: 260,
                height: 260,
                borderRadius: 130,
                overflow: 'hidden',
              }}
              resizeMode={ResizeMode.CONTAIN}
              shouldPlay
              isLooping={false}
              useNativeControls={false}
              onReadyForDisplay={() => {
                SplashScreen.hideAsync().catch(() => {});
              }}
              onError={() => {
                // إذا فشل تحميل الفيديو، انتقل مباشرة للشاشة التالية
                setIsVideoComplete(true);
              }}
            />
          </View>
        )}

        {/* Image Splash Animation */}
        {isVideoComplete && !isSplashAnimationComplete && (
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: '#ffffff',
                opacity: fadeAnim,
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 9999,
              },
            ]}
          >
            <Animated.Image
              source={require('../assets/images/logo.png')}
              style={{
                width: 220,
                height: 220,
                resizeMode: 'contain',
                transform: [{ scale: scaleAnim }],
              }}
            />

            <Animated.Image
              source={require('../assets/images/slogan.png')}
              style={{
                width: 320,
                height: 100,
                marginTop: 30,
                resizeMode: 'contain',
                opacity: sloganFadeAnim,
              }}
            />

            <View style={{ marginTop: 16 }}>
              <ActivityIndicator size="small" color="#D4AF37" />
            </View>
          </Animated.View>
        )}
      </View>

      <StatusBar style={isDark ? 'light' : 'dark'} />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Cairo_400Regular,
    Cairo_500Medium,
    Cairo_700Bold,
    Cairo_800ExtraBold,
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const { checkAuth, isAuthLoading, isAuthenticated, user } = useAuthStore();
  const chatSocketRef = useRef<Socket | null>(null);

  const [isVideoComplete, setIsVideoComplete] = useState(false);
  const [isSplashAnimationComplete, setIsSplashAnimationComplete] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(2.2)).current;
  const sloganFadeAnim = useRef(new Animated.Value(0)).current;

  const queryClient = useRef(new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000,   // 5 min — don't refetch if data is fresh
        gcTime: 10 * 60 * 1000,     // 10 min cache retention
        retry: 1,
      },
    },
  })).current;

  useEffect(() => {
    (async () => {
      // Direction is now synchronized from the active app language inside RootLayoutContent.
    })();

    checkAuth();

    // Register push token for ALL users (guest + registered)
    registerForPushNotificationsAsync().then((token) => {
      if (!token) return;
      // Always save as guest first (no auth needed)
      saveGuestPushToken(token);
      // If user is logged in, also associate with their account
      const { isAuthenticated } = useAuthStore.getState();
      if (isAuthenticated) savePushTokenToServer(token);
    });

    // Listen for notifications received while app is open
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('📬 Notification received:', notification);
      // Notification will be displayed automatically by expo-notifications
    });

    // Listen for user tapping on notification
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Notification tapped:', response);
      // Handle navigation based on notification data
      const data = response.notification.request.content.data;
      if (typeof data?.threadId === 'string' && data.threadId) {
        router.push({
          pathname: '/chat/[id]',
          params: {
            id: data.threadId,
          },
        });
        return;
      }

      if (data?.screen) {
        router.push(data.screen as any);
      }
    });

    const videoTimer = setTimeout(() => {
      setIsVideoComplete(true);
    }, 4000);

    // ✅ OTA: فرض تحميل التحديث فوراً عند فتح التطبيق
    if (!__DEV__) {
      (async () => {
        try {
          const update = await Updates.checkForUpdateAsync();
          if (update.isAvailable) {
            await Updates.fetchUpdateAsync();
            await Updates.reloadAsync();
          }
        } catch (e) {
          console.log('OTA check error:', e);
        }
      })();
    }

    // Warm ping — keep backend alive, fire every 4 minutes
    const warmPing = () => {
      fetch('https://api.kotm.app/health').catch(() => {});
    };
    warmPing();
    const pingInterval = setInterval(warmPing, 4 * 60 * 1000);

    // Cleanup listeners
    return () => {
      notificationListener.remove();
      responseListener.remove();
      clearTimeout(videoTimer);
      clearInterval(pingInterval);
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        savePushTokenToServer(token);
      }
    });
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      chatSocketRef.current?.disconnect();
      chatSocketRef.current = null;
      return;
    }

    const socketUrl = getApiBaseUrl().replace(/\/api\/v1\/?$/, '');
    const socket = io(socketUrl, {
      transports: ['websocket'],
      reconnection: true,
    });

    chatSocketRef.current = socket;

    const refreshChats = () => {
      void useChatStore.getState().fetchChats();
    };

    socket.on('connect', () => {
      socket.emit('joinUserRoom', { userId: user.id });
      refreshChats();
    });

    socket.on('chat:refresh', refreshChats);

    return () => {
      socket.emit('leaveUserRoom', { userId: user.id });
      socket.off('chat:refresh', refreshChats);
      socket.disconnect();
      if (chatSocketRef.current === socket) {
        chatSocketRef.current = null;
      }
    };
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    if (fontsLoaded && !isAuthLoading && isVideoComplete) {
      // Native splash is already hidden by onReadyForDisplay; this is a fallback
      SplashScreen.hideAsync().catch(() => {});

      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(sloganFadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.delay(2500),
        Animated.timing(fadeAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start(() => setIsSplashAnimationComplete(true));
    }
  }, [fontsLoaded, isAuthLoading, isVideoComplete]);

  // ✅ لا ترسم التطبيق إلا بعد RTL + الخطوط + auth
  if (!fontsLoaded || isAuthLoading) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <LanguageProvider>
          <ThemeProvider>
            <AppErrorBoundary>
              <RootLayoutContent
                isVideoComplete={isVideoComplete}
                setIsVideoComplete={setIsVideoComplete}
                isSplashAnimationComplete={isSplashAnimationComplete}
                fadeAnim={fadeAnim}
                scaleAnim={scaleAnim}
                sloganFadeAnim={sloganFadeAnim}
              />
            </AppErrorBoundary>
          </ThemeProvider>
        </LanguageProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
