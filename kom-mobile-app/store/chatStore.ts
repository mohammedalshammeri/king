import { create } from 'zustand';
import api from '../services/api';

const CHAT_FETCH_DEBOUNCE_MS = 1000;
let inFlightFetchChats: Promise<void> | null = null;
let lastSuccessfulFetchAt = 0;

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
    if (inFlightFetchChats) {
      return inFlightFetchChats;
    }

    if (Date.now() - lastSuccessfulFetchAt < CHAT_FETCH_DEBOUNCE_MS && get().chats.length > 0) {
      return;
    }

    set({ isLoading: true });
    inFlightFetchChats = (async () => {
      const response = await api.get('/chats');
      const data = response.data?.data || response.data;
      const chats = Array.isArray(data) ? data : [];
      
      const totalUnreadCount = chats.reduce((sum: number, chat: Chat) => sum + chat.unreadCount, 0);
      const unreadConversationsCount = chats.filter((chat: Chat) => chat.unreadCount > 0).length;

      set({ chats, totalUnreadCount, unreadConversationsCount });
      lastSuccessfulFetchAt = Date.now();
    })();

    try {
      await inFlightFetchChats;
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    } finally {
      inFlightFetchChats = null;
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
