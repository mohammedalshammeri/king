import { Tabs, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform, View, StyleSheet, I18nManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { Colors } from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

export default function TabLayout() {
  const { user } = useAuthStore();
  const { unreadConversationsCount, fetchChats } = useChatStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  // App is Arabic-first: force RTL UI even if Expo Go iOS doesn't flip I18nManager.isRTL.
  const IS_RTL = I18nManager.isRTL;

  const tabBarBackground = '#0E1830'; // Always deep navy (brand identity)
  const activeTint = '#FFFFFF';       // White when selected
  const inactiveTint = '#D4AF37';     // Gold when inactive

  // Fix for Android Footer Overlap: Calculate bottom safely
  const bottomMargin = Platform.select({
    ios: 24,
    android: 24 + (insets.bottom > 0 ? insets.bottom : 0),
  });

  useEffect(() => {
    if (user) {
      fetchChats();
    }
  }, [user]);

  const handleTabPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const mainTabs = [
    {
      name: 'profile/index' as const,
      title: 'الملف',
      icon: ({ color, focused }: { color: string; focused: boolean }) => (
        <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
      ),
      listeners: {
        tabPress: handleTabPress,
      },
    },
    {
      name: 'chat' as const,
      title: 'المحادثات',
      icon: ({ color, focused }: { color: string; focused: boolean }) => (
        <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={24} color={color} />
      ),
      options: {
        tabBarBadge: unreadConversationsCount > 0 ? unreadConversationsCount : undefined,
        tabBarBadgeStyle: {
          backgroundColor: Colors.error,
          color: '#fff',
          fontSize: 10,
        },
      },
      listeners: {
        tabPress: (e: any) => {
          handleTabPress();
          if (!user) {
            e.preventDefault();
            router.push('/(auth)/login');
          }
        },
      },
    },
    {
      name: 'add' as const,
      title: '',
      icon: () => (
        <View style={styles.addButtonWrapper}>
          <LinearGradient colors={['#D4AF37', '#997D2D']} style={styles.addButtonGradient}>
            <Ionicons name={user ? 'add' : 'search'} size={user ? 32 : 26} color="#ffffff" />
          </LinearGradient>
        </View>
      ),
      options: {
        tabBarLabel: () => null,
      },
      listeners: {
        tabPress: (e: any) => {
          handleTabPress();
          if (!user) {
            e.preventDefault();
            router.push('/search');
          }
        },
      },
    },
    {
      name: 'feed' as const,
      title: 'فيديو',
      icon: ({ color, focused }: { color: string; focused: boolean }) => (
        <Ionicons name={focused ? 'videocam' : 'videocam-outline'} size={24} color={color} />
      ),
      listeners: {
        tabPress: handleTabPress,
      },
    },
    {
      name: 'index' as const,
      title: 'الرئيسية',
      icon: ({ color, focused }: { color: string; focused: boolean }) => (
        <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
      ),
      listeners: {
        tabPress: handleTabPress,
      },
    },
  ];

  // ✅ hide tab bar on these routes
  const hiddenTabBarRoutes = new Set([
    'feed',
    'listing/[id]',
    'profile/index',
    'profile/edit',
    'profile/subscriptions',
    'profile/individual-packages',
    'profile/payments',
    'profile/payment-proof',
    'my-listings',
    'favorites',
    'complaints',
    'settings',
  ]);

  const baseTabBarStyle = {
    position: 'absolute' as const,
    bottom: bottomMargin,
    left: 20,
    right: 20,
    borderRadius: 28,
    height: 66,
    backgroundColor: tabBarBackground,
    borderTopWidth: 0,
    elevation: 16,
    shadowColor: isDark ? '#000' : '#1A2050',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDark ? 0.4 : 0.18,
    shadowRadius: 20,
    paddingBottom: 0,
    justifyContent: 'center' as const,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.25)',
  };

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        headerTitleAlign: 'center',
        tabBarHideOnKeyboard: true,

        tabBarStyle: [
          baseTabBarStyle,
          hiddenTabBarRoutes.has(route.name) ? { display: 'none' } : null,
        ],
        tabBarItemStyle: {
          height: 64,
          paddingTop: 8,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: activeTint,
        tabBarInactiveTintColor: inactiveTint,
        tabBarLabelStyle: {
          fontFamily: Platform.select({ ios: 'Cairo_700Bold', android: 'Cairo_700Bold' }), // Bold Font
          fontSize: 10,
          fontWeight: '600',
          marginBottom: 4,
        },
      })}
    >
      {mainTabs.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            ...(tab.options ?? {}),
            tabBarIcon: tab.icon as any,
          }}
          listeners={tab.listeners as any}
        />
      ))}

      <Tabs.Screen
        name="my-listings"
        options={{
          title: 'إعلاناتي',
          href: null,
          tabBarIcon: ({ color }) => <Ionicons name="list-outline" size={24} color={color} />,
        }}
        listeners={{
          tabPress: (e) => {
            handleTabPress();
            if (!user) {
              e.preventDefault();
              router.push('/(auth)/login');
            }
          },
        }}
      />
      <Tabs.Screen
        name="profile/edit"
        options={{
          href: null,
          title: 'تعديل  الملف الشخصي',
        }}
      />
      <Tabs.Screen
        name="profile/payments"
        options={{
          href: null,
          title: 'مدفوعاتي',
        }}
      />
      <Tabs.Screen
        name="profile/subscriptions"
        options={{
          href: null,
          title: 'اشتراكاتي',
        }}
      />
      <Tabs.Screen
        name="profile/individual-packages"
        options={{
          href: null,
          title: 'باقاتي',
        }}
      />
      <Tabs.Screen
        name="profile/payment-proof"
        options={{
          href: null,
          title: 'إثبات الدفع',
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          href: null,
          title: 'المفضلة',
        }}
      />
      <Tabs.Screen
        name="complaints"
        options={{
          href: null,
          title: 'الشكاوى',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
          title: 'الإعدادات',
        }}
      />
      <Tabs.Screen
        name="listing/[id]"
        options={{
          href: null,
          title: 'تفاصيل الإعلان',
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          href: null,
          title: 'بحث',
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  addButtonWrapper: {
    top: -22,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 14,
  },
  addButtonGradient: {
    width: 66,
    height: 66,
    borderRadius: 33,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
});