import React, { useCallback, useEffect, useState } from 'react';
import AdsBanner from '@/components/ads/AdsBanner';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../../store/authStore';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../context/ThemeContext';
import { useAppTranslation, useLanguage } from '../../../context/LanguageContext';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../../../services/api';

// ─────────────────────────────────────────
// Menu config
// ─────────────────────────────────────────
function getMenuItems(role: string | undefined, t: (key: string) => string) {
  const baseMenu = [
    { icon: 'person', label: t('settings.editProfile'), route: '/profile/edit', bg: '#EFF6FF', color: '#3B82F6' },
    { icon: 'list', label: t('tabs.myListings'), route: '/(tabs)/my-listings', bg: '#FEF9E7', color: '#D4AF37' },
    { icon: 'heart', label: t('favorites.title'), route: '/favorites', bg: '#FEF2F2', color: '#EF4444' },
    { icon: 'alert-circle', label: t('complaints.title'), route: '/complaints', bg: '#FFFBEB', color: '#F59E0B' },
    { icon: 'settings', label: t('settings.title'), route: '/settings', bg: '#F3F4F6', color: '#6B7280' },
  ];

  const items = [...baseMenu];
  if (role === 'USER_SHOWROOM') {
    items.splice(2, 0,
      { icon: 'ribbon', label: t('profile.subscriptions'), route: '/profile/subscriptions', bg: '#EFF6FF', color: '#0A0F1E' },
      { icon: 'cash', label: t('profile.payments'), route: '/profile/payments', bg: '#F0FDF4', color: '#16A34A' },
    );
  } else if (role === 'USER_INDIVIDUAL') {
    items.splice(2, 0,
      { icon: 'pricetag', label: t('profile.packages'), route: '/profile/individual-packages', bg: '#FFFBEB', color: '#D4AF37' },
      { icon: 'cash', label: t('profile.payments'), route: '/profile/payments', bg: '#F0FDF4', color: '#16A34A' },
    );
  }
  return items;
}

// ─────────────────────────────────────────
// Component
// ─────────────────────────────────────────
export default function ProfileScreen() {
  const router = useRouter();
  const { user, isAuthenticated, logout, refreshUser } = useAuthStore();
  const { isDark } = useTheme();
  const { t } = useAppTranslation();
  const { language, setLanguage, isRTL } = useLanguage();

  const menuItems = getMenuItems(user?.role, t);
  const [luckEntry, setLuckEntry] = useState<{ myCode: string | null; isWinner: boolean } | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      api.get('/luck/my-code')
        .then((res) => {
          const d = res.data?.data ?? res.data;
          if (d?.myCode) setLuckEntry({ myCode: d.myCode, isWinner: d.isWinner ?? false });
        })
        .catch(() => {});
    }
  }, [isAuthenticated]);

  const bg          = isDark ? '#0B0F1E'                    : '#F2F5FC';
  const cardBg      = isDark ? '#111827'                    : '#FFFFFF';
  const textColor   = isDark ? '#F8FAFC'                    : '#0A0B14';
  const mutedColor  = isDark ? '#64748B'                    : '#94A3B8';
  const borderColor = isDark ? 'rgba(255,255,255,0.06)'     : 'rgba(0,0,0,0.06)';

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) refreshUser();
    }, [isAuthenticated, refreshUser]),
  );

  // Hide bottom tab bar on this screen while focused
  const navigation = useNavigation();
  useFocusEffect(
    useCallback(() => {
      const parents: any[] = [];
      let p = (navigation as any).getParent?.();
      while (p && parents.length < 4) {
        parents.push(p);
        p = p.getParent?.();
      }

      parents.forEach(parent => {
        try {
          parent?.setOptions?.({ tabBarStyle: { display: 'none' } });
        } catch (e) {
          // ignore
        }
      });

      return () => {
        parents.forEach(parent => {
          try {
            parent?.setOptions?.({ tabBarStyle: undefined });
          } catch (e) {
            // ignore
          }
        });
      };
    }, [navigation]),
  );

  const displayName =
    user?.individualProfile?.fullName ||
    user?.showroomProfile?.showroomName ||
    user?.email || t('profile.defaultUser');

  const displayImage =
    user?.individualProfile?.avatarUrl ||
    user?.showroomProfile?.logoUrl;

  const avatarLetter = (displayName?.trim()?.charAt(0) || 'U').toUpperCase();

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/(tabs)');
    } catch (e) {
      console.error(e);
    }
  };

  // ── Guest ────────────────────────────
  if (!isAuthenticated) {
    return (
      <SafeAreaView style={[s.container, { backgroundColor: '#0E1830' }]} edges={['left', 'right', 'bottom']}>
        <StatusBar style="light" />
        <LinearGradient colors={['#0E1830', '#162444']} style={s.guestHeader} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={s.deco1} />
          <View style={s.deco2} />
          <TouchableOpacity style={s.backBtn} activeOpacity={0.8} onPress={() => router.replace('/(tabs)')}>
            <Ionicons name={isRTL ? 'arrow-forward' : 'arrow-back'} size={20} color="#D4AF37" />
          </TouchableOpacity>
          <Image source={require('../../../assets/images/logo.png')} style={s.guestLogo} contentFit="contain" />
        </LinearGradient>

        <View style={[s.guestBody, { backgroundColor: bg }]}>
          <Text style={[s.guestTitle, { color: textColor }]}>{t('profile.guestTitle')}</Text>
          <Text style={[s.guestSub, { color: mutedColor }]}>{t('profile.guestSubtitle')}</Text>

          <View style={[s.guestLanguageCard, { backgroundColor: cardBg, borderColor, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {([
              { value: 'ar' as const, label: t('common.arabic') },
              { value: 'en' as const, label: t('common.english') },
            ]).map(({ value, label }) => {
              const isActive = language === value;

              return (
                <TouchableOpacity
                  key={value}
                  style={[
                    s.guestLanguageButton,
                    {
                      backgroundColor: isActive ? 'rgba(212,175,55,0.14)' : 'transparent',
                      borderColor: isActive ? '#D4AF37' : borderColor,
                    },
                  ]}
                  activeOpacity={0.85}
                  onPress={() => setLanguage(value)}
                >
                  <Text style={[s.guestLanguageText, { color: isActive ? '#B78D12' : textColor }]}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={s.goldBtn} activeOpacity={0.85} onPress={() => router.push('/(auth)/login')}>
            <LinearGradient colors={['#E8C84A', '#D4AF37', '#A8860E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.goldBtnGrad}>
              <Text style={s.goldBtnText}>{t('auth.login')}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={[s.outlineBtn, { borderColor: '#D4AF37' }]} activeOpacity={0.8} onPress={() => router.push('/(auth)/register')}>
            <Text style={[s.outlineBtnText, { color: '#D4AF37' }]}>{t('profile.createAccount')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Authenticated ────────────────────
  return (
    <SafeAreaView style={[s.container, { backgroundColor: '#0E1830' }]} edges={['left', 'right', 'bottom']}>
      <StatusBar style="light" />
      <ScrollView style={{ backgroundColor: bg }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 48 }}>

        {/* Hero gradient header */}
        <LinearGradient colors={['#0E1830', '#162444']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.heroGrad}>
          <View style={s.deco1} />
          <View style={s.deco2} />

          <TouchableOpacity
            accessibilityLabel={t('profile.backLabel')}
            style={s.backBtn}
            activeOpacity={0.8}
            onPress={() => router.replace('/(tabs)')}
          >
            <Ionicons name={isRTL ? 'chevron-forward' : 'chevron-back'} size={20} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Avatar */}
          <View style={s.avatarRing}>
            {displayImage ? (
              <Image source={{ uri: displayImage }} style={s.avatarImg} contentFit="cover" />
            ) : (
              <LinearGradient colors={['#1A2B50', '#243660']} style={s.avatarFallback}>
                <Text style={s.avatarLetter}>{avatarLetter}</Text>
              </LinearGradient>
            )}
          </View>

          <Text style={s.heroName}>{displayName}</Text>
          <Text style={s.heroEmail}>{user?.email}</Text>

          {/* Stats */}
          <View style={s.statsRow}>
            <View style={s.statBox}><Text style={s.statNum}>0</Text><Text style={s.statLabel}>{t('tabs.myListings')}</Text></View>
            <View style={[s.statDivider, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
            <View style={s.statBox}><Text style={s.statNum}>0</Text><Text style={s.statLabel}>{t('favorites.title')}</Text></View>
            <View style={[s.statDivider, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />
            <View style={s.statBox}><Text style={s.statNum}>0</Text><Text style={s.statLabel}>{t('profile.statsMessages')}</Text></View>
          </View>
        </LinearGradient>

        {/* Luck Code Card */}
        {luckEntry?.myCode && (
          <LinearGradient
            colors={luckEntry.isWinner ? ['#D4AF37', '#C9A227'] : ['#0E1830', '#162444']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={s.luckCard}
          >
            <View style={s.luckLeft}>
              <Text style={s.luckEmoji}>{luckEntry.isWinner ? '🎉' : '🎁'}</Text>
            </View>
            <View style={[s.luckRight, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <Text style={[s.luckTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                {luckEntry.isWinner ? t('profile.luckWinnerTitle') : t('profile.luckCodeTitle')}
              </Text>
              <Text style={[s.luckCode, { textAlign: isRTL ? 'right' : 'left' }]}>{luckEntry.myCode}</Text>
              {luckEntry.isWinner && (
                <Text style={[s.luckWinnerNote, { textAlign: isRTL ? 'right' : 'left' }]}>{t('profile.luckWinnerNote')}</Text>
              )}
            </View>
          </LinearGradient>
        )}

        {/* Menu card */}
        <View style={[s.menuCard, { backgroundColor: cardBg, borderColor }]}>
          {menuItems.map((item, idx) => (
            <TouchableOpacity
              key={item.route}
              style={[
                s.menuRow,
                { direction: isRTL ? 'rtl' : 'ltr' },
                idx < menuItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: borderColor },
              ]}
              activeOpacity={0.75}
              onPress={() =>
                router.push(
                  item.route === '/favorites'
                    ? ({ pathname: '/favorites', params: { source: 'profile' } } as any)
                    : (item.route as any)
                )
              }
            >
              <View style={[s.menuLabelRow, { direction: isRTL ? 'rtl' : 'ltr' }]}>
                <View style={[s.iconPill, { backgroundColor: item.bg }]}>
                  <Ionicons name={item.icon as any} size={18} color={item.color} />
                </View>
                <Text style={[s.menuText, { color: textColor, textAlign: isRTL ? 'right' : 'left' }]}>{item.label}</Text>
              </View>
              <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={18} color={mutedColor} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={[s.logoutBtn, { flexDirection: 'row', backgroundColor: isDark ? '#2D1515' : '#FEF2F2', borderColor: isDark ? '#5C2222' : '#FECACA' }]}
          activeOpacity={0.8}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={[s.logoutText, { textAlign: isRTL ? 'right' : 'left' }]}>{t('settings.logout')}</Text>
        </TouchableOpacity>

        <AdsBanner />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────
// Styles
// ─────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1 },

  // decorative blobs
  deco1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(212,175,55,0.07)', top: -60, right: -60 },
  deco2: { position: 'absolute', width: 140, height: 140, borderRadius: 70,  backgroundColor: 'rgba(212,175,55,0.05)', bottom: -30, left: -40 },

  // hero
  heroGrad: { alignItems: 'center', paddingTop: 48, paddingBottom: 32, paddingHorizontal: 24, overflow: 'hidden', position: 'relative' },
  avatarRing: {
    width: 104, height: 104, borderRadius: 52, borderWidth: 3, borderColor: '#D4AF37', overflow: 'hidden', marginBottom: 16,
    ...Platform.select({ default: { shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 8 } }),
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarFallback: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { fontSize: 40, fontWeight: '900', color: '#D4AF37' },
  heroName: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', width: '100%', marginBottom: 4, textAlign: 'center' },
  heroEmail: { fontSize: 13, color: 'rgba(255,255,255,0.55)', width: '100%', marginBottom: 24, textAlign: 'center' },

  // stats
  statsRow: {
    flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 18,
    paddingVertical: 14, paddingHorizontal: 20, width: '100%', justifyContent: 'space-around',
    alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  statBox: { alignItems: 'center', flex: 1 },
  statNum: { fontSize: 22, fontWeight: '900', color: '#D4AF37', marginBottom: 2 },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.55)', textAlign: 'center' },
  statDivider: { width: 1, height: 36 },

  // luck card
  luckCard: {
    marginHorizontal: 16, marginTop: 20, borderRadius: 22, overflow: 'hidden',
    flexDirection: 'row', alignItems: 'center', padding: 20, gap: 14,
    ...Platform.select({ default: { shadowColor: '#D4AF37', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 } }),
  },
  luckLeft: { alignItems: 'center', justifyContent: 'center' },
  luckEmoji: { fontSize: 38 },
  luckRight: { flex: 1, alignItems: 'flex-end' },
  luckTitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 6 },
  luckCode: { fontSize: 30, fontWeight: '900', color: '#D4AF37', letterSpacing: 4 },
  luckWinnerNote: { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 6 },

  // menu card
  menuCard: {
    marginHorizontal: 16, marginTop: 20, borderRadius: 22, overflow: 'hidden', borderWidth: 1,
    ...Platform.select({ default: { shadowColor: '#1A2050', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 18, elevation: 6 } }),
  },
  menuRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 16 },
  menuLabelRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconPill: { width: 42, height: 42, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  menuText: { fontSize: 15, fontWeight: '600', flex: 1 },

  // logout
  logoutBtn: {
    marginHorizontal: 16, marginTop: 14, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', paddingVertical: 16, borderRadius: 18, gap: 8, borderWidth: 1,
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: '#EF4444' },

  // guest
  guestHeader: { alignItems: 'center', paddingTop: 72, paddingBottom: 52, overflow: 'hidden', position: 'relative', width: '100%' },
  guestLogo: { width: 130, height: 50, zIndex: 2 },
  backBtn: {
    position: 'absolute',
    top: 12,
    start: 12,
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 6,
    backgroundColor: 'rgba(255,255,255,0.12)'
  },
  guestBody: { flex: 1, alignItems: 'center', padding: 32, paddingTop: 36 },
  guestTitle: { fontSize: 24, fontWeight: '800', width: '100%', marginBottom: 10, textAlign: 'center' },
  guestSub: { fontSize: 15, width: '100%', marginBottom: 22, lineHeight: 22, textAlign: 'center' },
  guestLanguageCard: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    padding: 6,
    gap: 8,
    marginBottom: 18,
  },
  guestLanguageButton: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestLanguageText: {
    fontSize: 14,
    fontWeight: '700',
  },
  goldBtn: {
    width: '100%', borderRadius: 28, overflow: 'hidden', marginBottom: 14,
    ...Platform.select({ default: { shadowColor: '#C9A227', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 14, elevation: 8 } }),
  },
  goldBtnGrad: { paddingVertical: 17, alignItems: 'center' },
  goldBtnText: { color: '#0A0B14', fontSize: 16, fontWeight: '800' },
  outlineBtn: { width: '100%', paddingVertical: 16, borderRadius: 28, borderWidth: 1.5, alignItems: 'center' },
  outlineBtnText: { fontSize: 15, fontWeight: '700' },
});

