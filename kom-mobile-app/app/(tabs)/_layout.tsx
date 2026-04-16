import { Tabs, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useAppTranslation, useLanguage } from '../../context/LanguageContext';
import { Colors } from '../../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

export default function TabLayout() {
  const { user } = useAuthStore();
  const { unreadConversationsCount, fetchChats } = useChatStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { t } = useAppTranslation();
  const { isRTL } = useLanguage();

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
  }, [user, fetchChats]);

  const handleTabPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const mainTabs = [
    {
      name: 'index' as const,
      title: t('tabs.home'),
      icon: ({ color, focused }: { color: string; focused: boolean }) => (
        <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
      ),
      listeners: {
        tabPress: handleTabPress,
      },
    },
    {
      name: 'feed' as const,
      title: t('tabs.video'),
      icon: ({ color, focused }: { color: string; focused: boolean }) => (
        <Ionicons name={focused ? 'videocam' : 'videocam-outline'} size={24} color={color} />
      ),
      listeners: {
        tabPress: handleTabPress,
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
      name: 'chat' as const,
      title: t('chat.title'),
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
      name: 'profile/index' as const,
      title: t('tabs.profile'),
      icon: ({ color, focused }: { color: string; focused: boolean }) => (
        <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
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
          textAlign: isRTL ? 'right' : 'left',
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
          title: t('tabs.myListings'),
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
          title: t('settings.editProfile'),
        }}
      />
      <Tabs.Screen
        name="profile/payments"
        options={{
          href: null,
          title: t('tabs.payments'),
        }}
      />
      <Tabs.Screen
        name="profile/subscriptions"
        options={{
          href: null,
          title: t('tabs.subscriptions'),
        }}
      />
      <Tabs.Screen
        name="profile/individual-packages"
        options={{
          href: null,
          title: t('tabs.packages'),
        }}
      />
      <Tabs.Screen
        name="profile/payment-proof"
        options={{
          href: null,
          title: t('tabs.paymentProof'),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          href: null,
          title: t('favorites.title'),
        }}
      />
      <Tabs.Screen
        name="complaints"
        options={{
          href: null,
          title: t('complaints.title'),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
          title: t('settings.title'),
        }}
      />
      <Tabs.Screen
        name="listing/[id]"
        options={{
          href: null,
          title: t('listing.detailsTitle'),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          href: null,
          title: t('tabs.search'),
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
