import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Image, StyleSheet } from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/authStore';
import api from '@/services/api';
import { useTheme } from '@/context/ThemeContext';
import { PageHeader } from '@/components/ui/page-header';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout, refreshUser, isAuthenticated } = useAuthStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const { isDark, themeMode, setThemeMode } = useTheme();

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
      'حذف الحساب',
      'هل أنت متأكد من رغبتك في حذف حسابك؟ سيتم تعطيل الحساب الآن ويمكن استرجاعه خلال 30 يوماً قبل الحذف النهائي.',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'تأكيد الحذف',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete('/users/me');
              await logout();
              router.replace('/(auth)/login');
            } catch (error: any) {
              Alert.alert('خطأ', 'فشل حذف الحساب. حاول مرة أخرى.');
            }
          },
        },
      ]
    );
  };

  const handleLogout = async () => {
    Alert.alert('تسجيل الخروج', 'هل أنت متأكد من رغبتك في تسجيل الخروج؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'خروج',
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
      style={[styles.menuItem, isLast && styles.menuItemLast]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <View style={styles.leftChevronContainer}>
        <Ionicons name="chevron-back" size={20} color={theme.muted} />
      </View>

      <View style={styles.menuLabelContainer}>
        <Ionicons name={icon} size={24} color={theme.subText} style={styles.menuIcon} />
        <Text style={[styles.menuText, styles.rtlText, { color: theme.text }]}>{title}</Text>
        {rightElement ? rightElement : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={[styles.container, { backgroundColor: theme.background }]}> 
      <Stack.Screen options={{ headerShown: false }} />

      <PageHeader
        title="الإعدادات"
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
          <Text style={[styles.name, styles.rtlText, { color: theme.text }]}>{displayName || 'مستخدم'}</Text>
          <Text style={[styles.email, styles.rtlText, { color: theme.subText }]}>{user?.email}</Text>

          <TouchableOpacity
            style={[styles.editButton, { borderColor: theme.border, backgroundColor: theme.surface }]}
            onPress={() => router.push('/profile/edit')}
          >
            <Text style={[styles.editButtonText, styles.rtlText, { color: theme.primary }]}>تعديل الملف الشخصي</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: theme.surface }]}
        >
          <MenuItem
            icon="notifications-outline"
            title="الإشعارات"
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
          <View style={[styles.menuItem, styles.rtlRow, { flexDirection: 'row-reverse', borderBottomWidth: 0 }]}>
            <Ionicons name="moon-outline" size={24} color={theme.subText} style={styles.menuIcon} />
            <Text style={[styles.menuText, styles.rtlText, { color: theme.text }]}>مظهر التطبيق</Text>
          </View>
          <View style={{ flexDirection: 'row-reverse', justifyContent: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 8 }}>
            {([
              { mode: 'light' as const, label: 'نهاري', icon: 'sunny-outline' },
              { mode: 'auto' as const, label: 'تلقائي', icon: 'phone-portrait-outline' },
              { mode: 'dark' as const, label: 'ليلي', icon: 'moon-outline' },
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

        <View style={[styles.section, { backgroundColor: theme.surface }]}
        >
          <MenuItem
            icon="mail-outline"
            title="تواصل معنا"
            onPress={() => router.push('/contact')}
          />
          <MenuItem
            icon="document-text-outline"
            title="سياسة الخصوصية"
            onPress={() => router.push('/privacy')}
          />
          <MenuItem
            icon="reader-outline"
            title="الشروط والأحكام"
            onPress={() => router.push('/terms')}
            isLast
          />
        </View>

        <View style={styles.logoutContainer}>
          <TouchableOpacity style={[styles.logoutButton, styles.rtlRow]} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={theme.danger} style={styles.menuIcon} />
            <Text style={[styles.logoutText, styles.rtlText, { color: theme.danger }]}>تسجيل الخروج</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.logoutButton, styles.rtlRow, { marginTop: 8, backgroundColor: theme.danger + '12', borderRadius: 12, borderWidth: 1, borderColor: theme.danger + '30' }]}
            onPress={handleDeleteAccount}
          >
            <Ionicons name="trash-outline" size={20} color={theme.danger} style={styles.menuIcon} />
            <Text style={[styles.logoutText, styles.rtlText, { color: theme.danger }]}>حذف الحساب</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, styles.rtlText, { color: theme.subText }]}>الإصدار 1.0.0</Text>
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
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 16,
    paddingRight: 0, // Stick to the edge\n    paddingVertical: 12,
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
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 8,
  },
  notificationRight: {
    flexDirection: 'row',
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    paddingLeft: 48,
    paddingRight: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    position: 'relative',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuIcon: {
    marginLeft: 12,
    marginRight: 0,
  },
  leftChevronContainer: {
    position: 'absolute',
    left: 8,
    top: '50%',
    transform: [{ translateY: -10 }],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuText: {
    fontSize: 16,
    color: '#334155',
    textAlign: 'right',
    marginRight: 8,
  },
  rtlRow: {
    flexDirection: 'row-reverse',
  },
  rtlText: {
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  logoutContainer: {
    marginTop: 8,
  },
  logoutButton: {
    flexDirection: 'row',
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
