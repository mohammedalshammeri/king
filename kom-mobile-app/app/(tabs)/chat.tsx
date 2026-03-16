import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Colors } from '../../constants/Colors';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { useTheme } from '../../context/ThemeContext';
import { useCallback } from 'react';
import { rtlStyles } from '@/lib/rtl';
import { PageHeader } from '@/components/ui/page-header';

// Using Chat interface from store logic implicitly via the hook data

export default function ChatScreen() {
  const { isAuthenticated } = useAuthStore();
  const { isDark } = useTheme();
  const { chats, fetchChats, isLoading } = useChatStore();

  const theme = {
    background: isDark ? '#0f172a' : Colors.background,
    card: isDark ? '#111827' : '#FFFFFF',
    text: isDark ? '#f8fafc' : '#1E293B',
    textMuted: isDark ? '#94a3b8' : '#64748B',
    border: isDark ? '#1f2937' : '#E2E8F0',
    surface: isDark ? '#0b1220' : '#F1F5F9',
    primary: Colors.primary,
  };

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        fetchChats();
      }
    }, [isAuthenticated])
  );

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('ar-BH', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'أمس';
    } else {
      return date.toLocaleDateString('ar-BH', { day: 'numeric', month: 'short' });
    }
  };

  const renderChatCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles.chatCard, { backgroundColor: theme.card }]}
      onPress={() => router.push({
        pathname: '/chat/[id]',
        params: {
          id: item.id,
          listingId: item.listingId,
          otherUserId: item.otherUserId,
          otherUserName: item.otherUserName,
        },
      })}
    >
      {/* Gold accent stripe on right side */}
      {item.unreadCount > 0 && <View style={styles.cardAccent} />}

      <View style={styles.avatarContainer}>
        <View style={[styles.avatarRing, item.unreadCount > 0 && styles.avatarRingUnread]}>
          {item.otherUserAvatar ? (
            <Image
              source={{ uri: item.otherUserAvatar }}
              style={styles.avatar}
              contentFit="cover"
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={26} color={theme.textMuted} />
            </View>
          )}
        </View>
        {item.isOnline && <View style={styles.onlineIndicator} />}
      </View>

      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <Text style={[styles.userName, { color: theme.text }]}>{item.otherUserName}</Text>
          {item.lastMessageTime && (
            <Text style={[styles.time]}>{formatTime(item.lastMessageTime)}</Text>
          )}
        </View>

        <Text style={[styles.listingTitle]} numberOfLines={1}>
          {item.listingTitle}
        </Text>

        <View style={styles.lastMessageRow}>
          <Text
            style={[
              styles.lastMessage,
              { color: theme.textMuted },
              item.unreadCount > 0 && [styles.lastMessageUnread, { color: theme.text }],
            ]}
            numberOfLines={1}
          >
            {item.lastMessage || 'لا توجد رسائل'}
          </Text>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
      </View>

      {item.listingImage && (
        <Image
          source={{ uri: item.listingImage }}
          style={styles.listingThumbnail}
          contentFit="cover"
        />
      )}
    </TouchableOpacity>
  );

  if (!isAuthenticated) {
    return (
      <SafeAreaView edges={['left', 'right', 'bottom']} style={[styles.container, rtlStyles.container, { backgroundColor: theme.background }]}>
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color={theme.textMuted} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>تسجيل الدخول مطلوب</Text>
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>
            يجب تسجيل الدخول لرؤية المحادثات
          </Text>
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.loginButtonText}>تسجيل الدخول</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={[styles.container, { backgroundColor: theme.background }]}>
      <PageHeader
        title="المحادثات"
        showBack={true}
        variant="gradient"
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : chats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color={theme.textMuted} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>لا توجد محادثات</Text>
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>
            ابدأ محادثة من خلال التواصل مع البائعين في الإعلانات
          </Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          renderItem={renderChatCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, rtlStyles.container, { paddingBottom: 120 }]}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 22,
  },
  loginButton: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 36,
    paddingVertical: 15,
    borderRadius: 28,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingBottom: 120,
  },
  // ─── Chat Card ────────────────────────────────────────
  chatCard: {
    flexDirection: 'row-reverse',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#1A2050',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
    overflow: 'hidden',
  },
  cardAccent: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
    backgroundColor: '#D4AF37',
  },
  avatarContainer: {
    position: 'relative',
    marginLeft: 14,
  },
  avatarRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: '#E4EAF4',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarRingUnread: {
    borderColor: '#D4AF37',
    borderWidth: 2.5,
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 29,
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EEF2FA',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  chatContent: {
    flex: 1,
    alignItems: 'flex-end',
  },
  chatHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    width: '100%',
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  time: {
    fontSize: 11,
    color: '#9BA3B2',
    fontWeight: '500',
  },
  listingTitle: {
    fontSize: 12,
    color: '#D4AF37',
    marginBottom: 5,
    textAlign: 'right',
    writingDirection: 'rtl',
    fontWeight: '600',
  },
  lastMessageRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    width: '100%',
  },
  lastMessage: {
    flex: 1,
    fontSize: 13,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 18,
  },
  lastMessageUnread: {
    fontWeight: '700',
  },
  unreadBadge: {
    backgroundColor: '#D4AF37',
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 7,
    marginRight: 8,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  listingThumbnail: {
    width: 56,
    height: 56,
    borderRadius: 10,
    marginRight: 14,
    borderWidth: 1,
    borderColor: '#E4EAF4',
  },
});
