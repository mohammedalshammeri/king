import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image, StyleSheet } from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import api from '@/services/api';
import { useAppTranslation, useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { PageHeader } from '@/components/ui/page-header';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout, refreshUser, isAuthenticated } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const { isDark, themeMode, setThemeMode } = useTheme();
  const { language, setLanguage, isRTL } = useLanguage();
  const { t } = useAppTranslation();

  const theme = {
    background: isDark ? '#0f172a' : '#fff',
    surface: isDark ? '#1f2937' : '#f8fafc',
    border: isDark ? '#334155' : '#e2e8f0',
    text: isDark ? '#e5e7eb' : '#0f172a',
    subText: isDark ? '#cbd5e1' : '#64748b',
    muted: isDark ? '#94a3b8' : '#cbd5e1',
    primary: '#D4AF37',
    danger: '#ef4444',
  };

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        refreshUser();
        api
          .get('/notifications/unread-count')
          .then((res) => {
            setUnreadCount(res.data?.unreadCount ?? res.data?.data?.unreadCount ?? 0);
          })
          .catch(() => {
            setUnreadCount(0);
          });
      }
    }, [isAuthenticated, refreshUser])
  );

  const isShowroom = user?.role === 'USER_SHOWROOM';
  const displayName = isShowroom
    ? user?.showroomProfile?.showroomName
    : user?.individualProfile?.fullName;
  const displayImage = isShowroom
    ? user?.showroomProfile?.logoUrl
    : user?.individualProfile?.avatarUrl;
  const avatarLetter = (displayName?.trim()?.charAt(0) || user?.email?.charAt(0) || 'U').toUpperCase();

  const handleDeleteAccount = () => {
    Alert.alert(
      t('settings.deleteTitle'),
      t('settings.deleteMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.deleteConfirm'),
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete('/users/me');
              await logout();
              router.replace('/(auth)/login');
            } catch (error: any) {
              Alert.alert(t('common.error'), t('settings.deleteFailed'));
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert(t('settings.logoutTitle'), t('settings.logoutMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('settings.logoutConfirm'),
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const MenuItem = ({ icon, title, onPress, rightElement, isLast = false }: any) => (
    <TouchableOpacity
      style={[styles.menuItem, { flexDirection: 'row' }, isLast && styles.menuItemLast]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <View style={[styles.leftChevronContainer, isRTL ? styles.leftChevronContainerRtl : styles.leftChevronContainerLtr]}>
        <Ionicons name={isRTL ? 'chevron-back' : 'chevron-forward'} size={20} color={theme.muted} />
      </View>

      <View style={[styles.menuLabelContainer, { flexDirection: 'row' }]}>
        <Ionicons name={icon} size={24} color={theme.subText} style={styles.menuIcon} />
        <Text style={[styles.menuText, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text>
        {rightElement ? rightElement : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={[styles.container, { backgroundColor: theme.background }]}> 
      <Stack.Screen options={{ headerShown: false }} />

      <PageHeader
        title={t('settings.title')}
        backgroundColor={theme.surface}
        borderColor={theme.border}
        textColor={theme.primary}
        onBack={() => router.replace('/profile')}
      />

      <ScrollView contentContainerStyle={[styles.content]}>
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: theme.surface, borderColor: theme.border }]}
          >
            {displayImage ? (
              <Image source={{ uri: displayImage }} style={styles.avatarImage} />
            ) : (
              <Text style={[styles.avatarText, { color: theme.primary }]}>{avatarLetter}</Text>
            )}
          </View>
          <Text style={[styles.name, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>{displayName || t('profile.defaultUser')}</Text>
          <Text style={[styles.email, { color: theme.subText, textAlign: isRTL ? 'right' : 'left' }]}>{user?.email}</Text>

          <TouchableOpacity
            style={[styles.editButton, { borderColor: theme.border, backgroundColor: theme.surface }]}
            onPress={() => router.push('/profile/edit')}
          >
            <Text style={[styles.editButtonText, { color: theme.primary, textAlign: isRTL ? 'right' : 'left' }]}>{t('settings.editProfile')}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface }]}
        >
          <MenuItem
            icon="notifications-outline"
            title={t('settings.notifications')}
            onPress={() => router.push('/notifications')}
            rightElement={
              <View style={styles.notificationRight}>
                {unreadCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                  </View>
                )}
              </View>
            }
            isLast
          />
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <View style={[styles.menuItem, { flexDirection: 'row', borderBottomWidth: 0 }]}> 
            <Ionicons name="moon-outline" size={24} color={theme.subText} style={styles.menuIcon} />
            <Text style={[styles.menuText, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>{t('settings.appearance')}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 8 }}>
            {([
              { mode: 'light' as const, label: t('settings.themeLight'), icon: 'sunny-outline' },
              { mode: 'auto' as const, label: t('settings.themeAuto'), icon: 'phone-portrait-outline' },
              { mode: 'dark' as const, label: t('settings.themeDark'), icon: 'moon-outline' },
            ]).map(({ mode, label, icon }) => {
              const isActive = themeMode === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  onPress={() => setThemeMode(mode)}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 10,
                    borderRadius: 10,
                    borderWidth: 1.5,
                    borderColor: isActive ? theme.primary : theme.border,
                    backgroundColor: isActive ? theme.primary + '18' : 'transparent',
                    gap: 4,
                  }}
                >
                  <Ionicons name={icon as any} size={20} color={isActive ? theme.primary : theme.subText} />
                  <Text style={{ fontSize: 12, fontWeight: isActive ? '700' : '400', color: isActive ? theme.primary : theme.subText }}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface }]}>
          <View style={[styles.menuItem, { flexDirection: 'row', borderBottomWidth: 0 }]}> 
            <Ionicons name="language-outline" size={24} color={theme.subText} style={styles.menuIcon} />
            <Text style={[styles.menuText, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>{t('settings.languageSection')}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 8 }}>
            {([
              { value: 'ar' as const, label: t('common.arabic') },
              { value: 'en' as const, label: t('common.english') },
            ]).map(({ value, label }) => {
              const isActive = language === value;
              return (
                <TouchableOpacity
                  key={value}
                  onPress={() => setLanguage(value)}
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 12,
                    borderRadius: 10,
                    borderWidth: 1.5,
                    borderColor: isActive ? theme.primary : theme.border,
                    backgroundColor: isActive ? theme.primary + '18' : 'transparent',
                  }}
                >
                  <Text style={{ fontSize: 13, fontWeight: isActive ? '700' : '500', color: isActive ? theme.primary : theme.subText }}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface }]}
        >
          <MenuItem
            icon="mail-outline"
            title={t('settings.contact')}
            onPress={() => router.push('/contact')}
          />
          <MenuItem
            icon="document-text-outline"
            title={t('settings.privacy')}
            onPress={() => router.push('/privacy')}
          />
          <MenuItem
            icon="reader-outline"
            title={t('settings.terms')}
            onPress={() => router.push('/terms')}
            isLast
          />
        </View>

        <View style={styles.logoutContainer}>
          <TouchableOpacity style={[styles.logoutButton, { flexDirection: 'row' }]} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={theme.danger} style={styles.menuIcon} />
            <Text style={[styles.logoutText, { color: theme.danger, textAlign: isRTL ? 'right' : 'left' }]}>{t('settings.logout')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.logoutButton, { flexDirection: 'row', marginTop: 8, backgroundColor: theme.danger + '12', borderRadius: 12, borderWidth: 1, borderColor: theme.danger + '30' }]}
            onPress={handleDeleteAccount}
          >
            <Ionicons name="trash-outline" size={20} color={theme.danger} style={styles.menuIcon} />
            <Text style={[styles.logoutText, { color: theme.danger, textAlign: isRTL ? 'right' : 'left' }]}>{t('settings.deleteAccount')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: theme.subText, textAlign: isRTL ? 'right' : 'left' }]}>{t('settings.version', { version: '1.0.0' })}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingStart: 16,
    paddingEnd: 0, // Stick to the edge\n    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  content: {
    padding: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 96,
    height: 96,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#D4AF37',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginTop: 12,
  },
  email: {
    fontSize: 14,
    color: '#64748b',
  },
  editButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#fff',
  },
  editButtonText: {
    color: '#D4AF37',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 8,
  },
  menuLabelContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingEnd: 8,
  },
  notificationRight: {
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    paddingStart: 16,
    paddingEnd: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    position: 'relative',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    marginStart: 0,
    marginEnd: 12,
  },
  leftChevronContainer: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -10 }],
    alignItems: 'center',
    gap: 8,
  },
  leftChevronContainerRtl: { left: 8 },
  leftChevronContainerLtr: { right: 8 },
  menuText: {
    fontSize: 16,
    color: '#334155',
    marginEnd: 8,
  },
  logoutContainer: {
    marginTop: 8,
  },
  logoutButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fef2f2',
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 16,
    color: '#ef4444',
    fontWeight: 'bold',
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  versionText: {
    fontSize: 12,
    color: '#94a3b8',
  },
});
