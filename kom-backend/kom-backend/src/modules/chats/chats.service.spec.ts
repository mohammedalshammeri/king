import { NotificationType } from '@prisma/client';
import { ChatsService } from './chats.service';

describe('ChatsService', () => {
  const createService = () => {
    const prisma = {
      chatThread: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      chatMessage: {
        create: jest.fn(),
        updateMany: jest.fn(),
      },
      user: {
        findUnique: jest.fn(),
      },
    } as any;

    const notificationsService = {
      createNotification: jest.fn(),
    } as any;

    const chatsGateway = {
      sendMessageToRoom: jest.fn(),
      sendMessagesReadToRoom: jest.fn(),
      sendChatRefreshToUser: jest.fn(),
    } as any;

    const service = new ChatsService(prisma, notificationsService, chatsGateway);
    return { service, prisma, notificationsService, chatsGateway };
  };

  it('sends a message, emits socket events, and creates a notification', async () => {
    const { service, prisma, notificationsService, chatsGateway } = createService();

    prisma.chatThread.findUnique.mockResolvedValue({
      id: 'thread-1',
      userAId: 'user-1',
      userBId: 'user-2',
      listing: { id: 'listing-1', title: 'Toyota' },
    });
    prisma.chatMessage.create.mockResolvedValue({
      id: 'msg-1',
      text: 'مرحبا',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    prisma.user.findUnique.mockResolvedValue({
      email: 'sender@example.com',
      individualProfile: { fullName: 'محمد' },
      showroomProfile: null,
    });

    const result = await service.sendMessage('user-1', 'thread-1', { text: '  مرحبا  ' });

    expect(prisma.chatMessage.create).toHaveBeenCalledWith({
      data: {
        threadId: 'thread-1',
        senderId: 'user-1',
        text: 'مرحبا',
      },
    });
    expect(chatsGateway.sendMessageToRoom).toHaveBeenCalledWith('thread-1', result);
    expect(chatsGateway.sendChatRefreshToUser).toHaveBeenCalledTimes(2);
    expect(notificationsService.createNotification).toHaveBeenCalledWith(
      'user-2',
      NotificationType.SYSTEM,
      'رسالة جديدة',
      'رسالة جديدة من محمد بخصوص Toyota',
      {
        threadId: 'thread-1',
        listingId: 'listing-1',
      },
      true,
    );
  });
});