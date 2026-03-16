import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ImageBackground, Keyboard } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';
import { useAuthStore } from '@/store/authStore';
import api from '@/services/api';
import { getApiBaseUrl } from '@/services/api-url';
import { useTheme } from '../../context/ThemeContext';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
  isRead: boolean;
}


export default function ChatDetailScreen() {
  const params = useLocalSearchParams<{
    id: string;
    listingId: string;
    otherUserId: string;
    otherUserName: string;
  }>();
  const chatId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { user } = useAuthStore();
  const flatListRef = useRef<FlatList>(null);
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  const theme = {
    background: isDark ? '#0f172a' : '#ECE5DD',
    card: isDark ? '#111827' : '#FFFFFF',
    text: isDark ? '#f8fafc' : '#1E293B',
    textMuted: isDark ? '#94a3b8' : '#64748B',
    border: isDark ? '#1f2937' : '#E2E8F0',
    surface: isDark ? '#1f2937' : '#F1F5F9',
    primary: Colors.primary,
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const fullApiUrl = getApiBaseUrl();
    const socketUrl = fullApiUrl.replace(/\/api\/v1\/?$/, '');

    // Initialize socket connection
    socketRef.current = io(socketUrl, {
      transports: ['websocket'],
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Socket connected');
      if (chatId) {
        socket.emit('joinRoom', { roomId: chatId });
      }
    });

    socket.on('newMessage', async (newMessage: Message) => {
      // Skip own messages — already added via optimistic UI
      if (newMessage.senderId === user?.id) return;

      setMessages((prev) => {
        if (prev.some((msg) => msg.id === newMessage.id)) {
          return prev;
        }
        return [...prev, newMessage];
      });
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      // Mark as read
      try {
        await api.post(`/chats/${chatId}/read`);
      } catch (error) {
        console.warn('Failed to mark message as read', error);
      }
    });

    socket.on('messagesRead', () => {
      setMessages((prev) =>
        prev.map((msg) => ({ ...msg, isRead: true }))
      );
    });

    return () => {
      if (chatId) {
        socket.emit('leaveRoom', { roomId: chatId });
      }
      socket.disconnect();
    };
  }, [chatId, user?.id]);

  useEffect(() => {
    // Scroll to bottom on mount
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: false });
    }, 100);
  }, []);

  const fetchMessages = async () => {
    if (!chatId) return;
    setIsLoading(true);
    try {
      const response = await api.get(`/chats/${chatId}/messages`, { params: { page: 1, limit: 50 } });
      const data = response.data?.data || response.data;
      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      console.warn('Failed to fetch messages', error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchMessages();
    }, [chatId])
  );

  const sendMessage = async () => {
    if (!inputText.trim() || isSending) return;
    if (!chatId) return;

    const tempText = inputText.trim();
    setInputText('');

    const tempId = `temp_${Date.now()}`;
    const optimisticMsg: Message = {
      id: tempId,
      senderId: user?.id || '',
      text: tempText,
      createdAt: new Date().toISOString(),
      isRead: false,
    };
    setMessages(prev => [...prev, optimisticMsg]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);

    setIsSending(true);
    try {
      const response = await api.post(`/chats/${chatId}/messages`, { text: tempText });
      const message = response.data?.data || response.data;
      if (message?.id) {
        setMessages(prev => prev.map(m => m.id === tempId ? message : m));
      }
    } catch (error) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setInputText(tempText);
      console.warn('Failed to send message', error);
    } finally {
      setIsSending(false);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ar-BH', { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.senderId === user?.id;

    return (
      <View
        style={[
          styles.messageContainer,
          isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isMyMessage
              ? styles.myMessageBubble
              : [styles.theirMessageBubble, { backgroundColor: theme.card, borderColor: theme.border }],
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isMyMessage ? styles.myMessageText : [styles.theirMessageText, { color: theme.text }],
            ]}
          >
            {item.text}
          </Text>
          <View style={styles.messageFooter}>
            <Text
              style={[
                styles.messageTime,
                isMyMessage ? styles.myMessageTime : [styles.theirMessageTime, { color: theme.textMuted }],
              ]}
            >
              {formatMessageTime(item.createdAt)}
            </Text>
            {isMyMessage && (
              <Ionicons
                name={item.isRead ? 'checkmark-done' : 'checkmark'}
                size={14}
                color={item.isRead ? '#3B82F6' : '#9CA3AF'}
                style={styles.checkmark}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['left', 'right', 'bottom']}>
      <LinearGradient
        colors={['#0E1830', '#162444']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.header, { paddingTop: insets.top + 12 }]}
      >
        <View style={{ width: 44 }} />
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{params.otherUserName}</Text>
          <Text style={styles.headerStatus}>متصل الآن</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <View style={styles.backCircle}>
            <Ionicons name="arrow-forward" size={18} color="#D4AF37" />
          </View>
        </TouchableOpacity>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ImageBackground
          source={{ uri: 'https://i.pinimg.com/736x/8c/98/99/8c98994518b575bfd8c943e91d8e04b4.jpg' }}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesContainer}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubbles-outline" size={48} color={theme.textMuted} />
                <Text style={[styles.emptyTitle, { color: theme.text }]}>{isLoading ? 'جاري التحميل...' : 'لا توجد رسائل'}</Text>
                <Text style={[styles.emptyText, { color: theme.textMuted }]}>ابدأ المحادثة بإرسال رسالة</Text>
              </View>
            }
          />
        </ImageBackground>

        <View style={[
          styles.inputContainer,
          {
            backgroundColor: theme.card,
            borderTopColor: theme.border,
            paddingBottom: Math.max(insets.bottom, 16)
          }
        ]}>
          <TextInput
            style={[styles.input, { backgroundColor: isDark ? '#1f2937' : '#FFFFFF', color: theme.text, borderColor: theme.border }]}
            placeholder="اكتب رسالتك..."
            value={inputText}
            onChangeText={setInputText}
            textAlign="right"
            multiline
            maxLength={500}
            placeholderTextColor={theme.textMuted}
          />
          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={20} color="#FFFFFF" style={{ transform: [{ scaleX: -1 }] }} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  backButton: {
    padding: 0,
    width: 44,
    alignItems: 'flex-end',
  },
  backCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(212,175,55,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    alignItems: 'center',
  },
  headerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#D4AF37',
    textAlign: 'center',
  },
  headerStatus: {
    fontSize: 12,
    color: '#34D399',
    marginTop: 2,
    textAlign: 'center',
  },
  headerAction: {
    padding: 4,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
    backgroundColor: 'rgba(255,255,255,0.8)', // readability on pattern
    padding: 20,
    borderRadius: 12,
    alignSelf: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 6,
    textAlign: 'center',
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '75%',
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
  },
  theirMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 16,
    padding: 12,
    paddingBottom: 6,
  },
  myMessageBubble: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  theirMessageBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 4,
  },
  myMessageText: {
    color: '#FFFFFF',
    textAlign: 'right',
  },
  theirMessageText: {
    color: '#1E293B',
    textAlign: 'right',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.75)',
  },
  theirMessageTime: {
    color: '#9CA3AF',
  },
  checkmark: {
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-end',
    padding: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  attachButton: {
    padding: 8,
    marginLeft: 4,
  },
  input: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 14, // Increased padding to force OS to lift the view higher
    fontSize: 15,
    maxHeight: 120, // Increased max height slightly
    minHeight: 48, // Increased min height
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
});
