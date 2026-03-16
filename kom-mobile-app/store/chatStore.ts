import { create } from 'zustand';
import api from '../services/api';

interface Chat {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImage?: string;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  isOnline: boolean;
}

interface ChatState {
  chats: Chat[];
  totalUnreadCount: number;
  unreadConversationsCount: number;
  isLoading: boolean;
  fetchChats: () => Promise<void>;
  updateTotalUnreadCount: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  totalUnreadCount: 0,
  unreadConversationsCount: 0,
  isLoading: false,

  fetchChats: async () => {
    set({ isLoading: true });
    try {
      const response = await api.get('/chats');
      const data = response.data?.data || response.data;
      const chats = Array.isArray(data) ? data : [];
      
      const totalUnreadCount = chats.reduce((sum: number, chat: Chat) => sum + chat.unreadCount, 0);
      const unreadConversationsCount = chats.filter((chat: Chat) => chat.unreadCount > 0).length;

      set({ chats, totalUnreadCount, unreadConversationsCount });
    } catch (error) {
      console.error('Failed to fetch chats:', error);
      set({ chats: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  updateTotalUnreadCount: () => {
    const { chats } = get();
    const totalUnreadCount = chats.reduce((sum, chat) => sum + chat.unreadCount, 0);
    const unreadConversationsCount = chats.filter((chat: Chat) => chat.unreadCount > 0).length;
    set({ totalUnreadCount, unreadConversationsCount });
  }
}));
