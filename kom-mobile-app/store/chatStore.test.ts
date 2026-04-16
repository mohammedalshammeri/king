import { beforeEach, describe, expect, it, vi } from 'vitest';

const getMock = vi.fn();

vi.mock('../services/api', () => ({
  default: {
    get: getMock,
  },
}));

async function loadStore() {
  vi.resetModules();
  const module = await import('./chatStore');
  return module.useChatStore;
}

describe('useChatStore', () => {
  beforeEach(() => {
    getMock.mockReset();
  });

  it('fetches chats and calculates unread counters', async () => {
    getMock.mockResolvedValue({
      data: {
        data: [
          {
            id: 'chat-1',
            listingId: 'listing-1',
            listingTitle: 'BMW',
            otherUserId: 'user-2',
            otherUserName: 'أحمد',
            unreadCount: 2,
            isOnline: false,
          },
          {
            id: 'chat-2',
            listingId: 'listing-2',
            listingTitle: 'Toyota',
            otherUserId: 'user-3',
            otherUserName: 'سالم',
            unreadCount: 1,
            isOnline: false,
          },
        ],
      },
    });

    const useChatStore = await loadStore();

    await useChatStore.getState().fetchChats();

    const state = useChatStore.getState();
    expect(state.chats).toHaveLength(2);
    expect(state.totalUnreadCount).toBe(3);
    expect(state.unreadConversationsCount).toBe(2);
    expect(state.isLoading).toBe(false);
  });

  it('keeps existing chats when fetch fails', async () => {
    const useChatStore = await loadStore();

    useChatStore.setState({
      chats: [
        {
          id: 'chat-1',
          listingId: 'listing-1',
          listingTitle: 'BMW',
          otherUserId: 'user-2',
          otherUserName: 'أحمد',
          unreadCount: 4,
          isOnline: false,
        },
      ],
      totalUnreadCount: 4,
      unreadConversationsCount: 1,
    });

    getMock.mockRejectedValue(new Error('network'));
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await useChatStore.getState().fetchChats();

    const state = useChatStore.getState();
    expect(state.chats).toHaveLength(1);
    expect(state.totalUnreadCount).toBe(4);
    expect(state.unreadConversationsCount).toBe(1);
    expect(errorSpy).toHaveBeenCalled();
  });
});