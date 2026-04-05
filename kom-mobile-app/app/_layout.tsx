import { DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import {
  useFonts,
  Cairo_400Regular,
  Cairo_500Medium,
  Cairo_700Bold,
  Cairo_800ExtraBold,
} from '@expo-google-fonts/cairo';
import { Stack } from 'expo-router';
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
  Text,
  TextInput,
  Dimensions,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import * as Updates from 'expo-updates';
import { StatusBar } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../store/authStore';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { registerForPushNotificationsAsync, savePushTokenToServer, saveGuestPushToken } from '../lib/notifications';
import * as Notifications from 'expo-notifications';
import 'react-native-reanimated';

if (Platform.OS === 'web') {
  require('../global.css');
}

/* =======================
   ✅ RTL – ROOT FIX (synchronous at module level)
   ======================= */
// يجب أن يُنفَّذ هذا قبل أي رسم
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const enforceRTL = async () => {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(true);

  if (Platform.OS === 'web') return;

  // إذا RTL مو شغال، أعد تحميل التطبيق مرة واحدة
  if (!I18nManager.isRTL) {
    const RELOAD_KEY = 'rtl_reload_v10';
    const alreadyReloaded = await AsyncStorage.getItem(RELOAD_KEY);
    if (alreadyReloaded === '1') return; // منع حلقة لا نهائية
    await AsyncStorage.setItem(RELOAD_KEY, '1');
    try {
      await Updates.reloadAsync();
    } catch {}
  } else {
    // RTL شغال، امسح علامة إعادة التحميل
    await AsyncStorage.removeItem('rtl_reload_v10');
  }
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
  const insets = useSafeAreaInsets();

  const contentBackground = isDark ? '#0f172a' : '#ffffff';

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
  const [rtlReady, setRtlReady] = useState(Platform.OS === 'web'); // web ما يحتاج reload
  const [fontsLoaded] = useFonts({
    Cairo_400Regular,
    Cairo_500Medium,
    Cairo_700Bold,
    Cairo_800ExtraBold,
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const { checkAuth, isAuthLoading } = useAuthStore();

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
      try {
        await enforceRTL();
      } finally {
        setRtlReady(true);
      }
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
      if (data?.screen) {
        // Navigate to specific screen based on notification data
        // Example: router.push(data.screen);
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

  // ✅ اجبار النصوص والحقول RTL عالميًا — تطبيق عربي فقط
  useEffect(() => {
    if (!rtlReady) return;

    // @ts-ignore
    Text.defaultProps = Text.defaultProps || {};
    // @ts-ignore
    Text.defaultProps.style = [{ writingDirection: 'rtl', textAlign: 'right' }, Text.defaultProps.style];

    // @ts-ignore
    TextInput.defaultProps = TextInput.defaultProps || {};
    // @ts-ignore
    TextInput.defaultProps.style = [{ writingDirection: 'rtl', textAlign: 'right' }, TextInput.defaultProps.style];
  }, [rtlReady]);

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
  if (!fontsLoaded || isAuthLoading || !rtlReady) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ThemeProvider>
          <RootLayoutContent
            isVideoComplete={isVideoComplete}
            setIsVideoComplete={setIsVideoComplete}
            isSplashAnimationComplete={isSplashAnimationComplete}
            fadeAnim={fadeAnim}
            scaleAnim={scaleAnim}
            sloganFadeAnim={sloganFadeAnim}
          />
        </ThemeProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
