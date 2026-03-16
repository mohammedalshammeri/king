import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '@/services/api';
import { useTheme } from '@/context/ThemeContext';
import { useAuthStore } from '@/store/authStore';
import { rtlStyles } from '@/lib/rtl';
import { PageHeader } from '@/components/ui/page-header';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  data?: {
    listingId?: string;
    chatId?: string;
    storyId?: string;
  };
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { isAuthenticated } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const theme = {
    background: isDark ? '#121212' : '#F5F5F5',
    card: isDark ? '#1E1E1E' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#000000',
    textSecondary: isDark ? '#AAAAAA' : '#666666',
    border: isDark ? '#333333' : '#E0E0E0',
    primary: '#D4AF37',
    unread: isDark ? '#2A2A2A' : '#FFF9E6',
  };

  const fetchNotifications = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await api.get('/notifications');
      const payload = response.data?.data ?? response.data ?? [];
      const list = Array.isArray(payload)
        ? payload
        : payload?.notifications ?? payload?.items ?? [];
      setNotifications(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        fetchNotifications();
      } else {
        setLoading(false);
      }
    }, [isAuthenticated])
  );

  const onRefresh = () => {
    if (isAuthenticated) {
      setRefreshing(true);
      fetchNotifications();
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    if (notification.data?.listingId) {
      router.push(`/listing/${notification.data.listingId}`);
    } else if (notification.data?.chatId) {
      router.push(`/chat/${notification.data.chatId}`);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'LISTING_APPROVED':
      case 'STORY_APPROVED':
        return 'checkmark-circle';
      case 'LISTING_REJECTED':
      case 'STORY_REJECTED':
        return 'close-circle';
      case 'NEW_MESSAGE':
        return 'chatbubble';
      default:
        return 'notifications';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'LISTING_APPROVED':
      case 'STORY_APPROVED':
        return '#4CAF50';
      case 'LISTING_REJECTED':
      case 'STORY_REJECTED':
        return '#F44336';
      case 'NEW_MESSAGE':
        return '#2196F3';
      default:
        return theme.primary;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return date.toLocaleDateString('ar-SA');
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        {
          backgroundColor: item.isRead ? theme.card : theme.unread,
        },
      ]}
      onPress={() => handleNotificationPress(item)}
    >
      {!item.isRead && <View style={styles.unreadBar} />}

      <View
        style={[
          styles.iconContainer,
          { backgroundColor: getIconColor(item.type) + '18' },
        ]}
      >
        <Ionicons
          name={getIcon(item.type)}
          size={26}
          color={getIconColor(item.type)}
        />
      </View>
      <View style={styles.contentContainer}>
        <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>
        <Text style={[styles.message, { color: theme.textSecondary }]}>
          {item.message}
        </Text>
        <Text style={[styles.time, { color: theme.textSecondary }]}>
          {formatDate(item.createdAt)}
        </Text>
      </View>
      {!item.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.centered, rtlStyles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={[styles.container, rtlStyles.container, { backgroundColor: theme.background }]}>
      <PageHeader
        title="الإشعارات"
        backgroundColor={theme.card}
        borderColor={theme.border}
        textColor={theme.text}
      />

      {!isAuthenticated ? (
        <View style={[styles.centered, rtlStyles.container]}>
          <Ionicons name="lock-closed-outline" size={64} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>تسجيل الدخول مطلوب</Text>
          <TouchableOpacity 
            style={[styles.loginButton, { backgroundColor: theme.primary }]} 
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.loginButtonText}>تسجيل الدخول</Text>
          </TouchableOpacity>
        </View>
      ) : notifications.length === 0 ? (
        <View style={[styles.centered, rtlStyles.container]}>
          <Ionicons name="notifications-off-outline" size={64} color={theme.textSecondary} />
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            لا توجد إشعارات
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  listContent: {
    padding: 16,
    paddingBottom: 120,
  },
  // ─── Notification Card ───────────────────────────────────────
  notificationItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
    shadowColor: '#1A2050',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
    overflow: 'hidden',
  },
  unreadBar: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    backgroundColor: '#D4AF37',
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 14,
    flexShrink: 0,
  },
  contentContainer: {
    flex: 1,
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 3,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  message: {
    fontSize: 13,
    marginBottom: 6,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 20,
  },
  time: {
    fontSize: 11,
    textAlign: 'right',
    writingDirection: 'rtl',
    fontWeight: '500',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#D4AF37',
    flexShrink: 0,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  loginButton: {
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 28,
    marginTop: 20,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: '#0A0B14',
    fontWeight: '800',
    fontSize: 16,
  },
  placeholder: {
    width: 40,
  },
  backButton: {
    padding: 8,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
});
