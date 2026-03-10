import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PaginatedResponse } from '../../common/dto';
import { ChatMessagesQueryDto, SendMessageDto, StartChatDto } from './dto/chat.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, Prisma } from '@prisma/client';
import { ChatsGateway } from './chats.gateway';

type UserDisplay = {
  email?: string | null;
  individualProfile?: {
    fullName?: string | null;
    avatarUrl?: string | null;
  } | null;
  showroomProfile?: {
    showroomName?: string | null;
    logoUrl?: string | null;
  } | null;
};

@Injectable()
export class ChatsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly chatsGateway: ChatsGateway,
  ) {}

  private getDisplayName(user: UserDisplay | null | undefined): string {
    return (
      user?.individualProfile?.fullName ||
      user?.showroomProfile?.showroomName ||
      user?.email ||
      'مستخدم'
    );
  }

  private getAvatar(user: UserDisplay | null | undefined): string | undefined {
    return (user?.individualProfile?.avatarUrl ?? user?.showroomProfile?.logoUrl) ?? undefined;
  }

  private orderPair(a: string, b: string): [string, string] {
    return a < b ? [a, b] : [b, a];
  }

  async startChat(userId: string, dto: StartChatDto) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: dto.listingId },
      include: {
        media: { orderBy: { sortOrder: 'asc' }, take: 1 },
        owner: {
          select: {
            id: true,
            email: true,
            role: true,
            individualProfile: { select: { fullName: true, avatarUrl: true } },
            showroomProfile: { select: { showroomName: true, logoUrl: true } },
          },
        },
      },
    });

    if (!listing) {
      throw new NotFoundException('Listing not found');
    }

    const otherUserId = listing.ownerId;
    if (!otherUserId) {
      throw new BadRequestException('Listing owner not found');
    }

    if (otherUserId === userId) {
      throw new BadRequestException('Cannot start chat with yourself');
    }

    const [userAId, userBId] = this.orderPair(userId, otherUserId);

    const existing = await this.prisma.chatThread.findUnique({
      where: {
        listingId_userAId_userBId: {
          listingId: listing.id,
          userAId,
          userBId,
        },
      },
    });

    const thread = existing
      ? existing
      : await this.prisma.chatThread.create({
          data: {
            listingId: listing.id,
            userAId,
            userBId,
          },
        });

    const otherUser = listing.owner;

    return {
      id: thread.id,
      listingId: listing.id,
      listingTitle: listing.title,
      listingImage: listing.media?.[0]?.thumbnailUrl || listing.media?.[0]?.url,
      otherUserId: otherUser.id,
      otherUserName: this.getDisplayName(otherUser),
      otherUserAvatar: this.getAvatar(otherUser),
    };
  }

  async getMyChats(userId: string) {
    const threadInclude = {
      listing: {
        select: {
          id: true,
          title: true,
          media: { orderBy: { sortOrder: 'asc' }, take: 1 },
        },
      },
      userA: {
        select: {
          id: true,
          email: true,
          individualProfile: { select: { fullName: true, avatarUrl: true } },
          showroomProfile: { select: { showroomName: true, logoUrl: true } },
        },
      },
      userB: {
        select: {
          id: true,
          email: true,
          individualProfile: { select: { fullName: true, avatarUrl: true } },
          showroomProfile: { select: { showroomName: true, logoUrl: true } },
        },
      },
    } satisfies Prisma.ChatThreadInclude;

    type ThreadWithInclude = Prisma.ChatThreadGetPayload<{ include: typeof threadInclude }>;

    const threads = await this.prisma.chatThread.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      include: threadInclude,
      orderBy: { updatedAt: 'desc' },
    });

    const threadIds = threads.map((t: ThreadWithInclude) => t.id);
    const unreadCounts = threadIds.length
      ? await this.prisma.chatMessage.groupBy({
          by: ['threadId'],
          where: {
            threadId: { in: threadIds },
            senderId: { not: userId },
            isRead: false,
          },
          _count: { _all: true },
        })
      : [];

    const unreadMap = new Map<string, number>(unreadCounts.map((c) => [c.threadId, c._count._all]));

    return (threads as ThreadWithInclude[]).map((thread) => {
      const otherUser = thread.userA.id === userId ? thread.userB : thread.userA;
      return {
        id: thread.id,
        listingId: thread.listing.id,
        listingTitle: thread.listing.title,
        listingImage: thread.listing.media?.[0]?.thumbnailUrl || thread.listing.media?.[0]?.url,
        otherUserId: otherUser.id,
        otherUserName: this.getDisplayName(otherUser),
        otherUserAvatar: this.getAvatar(otherUser),
        lastMessage: thread.lastMessageText || undefined,
        lastMessageTime: thread.lastMessageAt || undefined,
        unreadCount: unreadMap.get(thread.id) || 0,
        isOnline: false,
      };
    });
  }

  async getMessages(userId: string, threadId: string, query: ChatMessagesQueryDto) {
    const { page = 1, limit = 30 } = query;
    const skip = (page - 1) * limit;

    const thread = await this.prisma.chatThread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      throw new NotFoundException('Chat not found');
    }

    if (thread.userAId !== userId && thread.userBId !== userId) {
      throw new BadRequestException('Not a participant in this chat');
    }

    const [messages, total] = await Promise.all([
      this.prisma.chatMessage.findMany({
        where: { threadId },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.chatMessage.count({ where: { threadId } }),
    ]);

    await this.prisma.chatMessage.updateMany({
      where: {
        threadId,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    });

    // Notify the room that messages have been read
    this.chatsGateway.sendMessagesReadToRoom(threadId);

    return new PaginatedResponse(messages, total, page, limit);
  }

  async markMessagesAsRead(userId: string, threadId: string) {
    const thread = await this.prisma.chatThread.findUnique({
      where: { id: threadId },
    });

    if (!thread) {
      throw new NotFoundException('Chat not found');
    }

    if (thread.userAId !== userId && thread.userBId !== userId) {
      throw new BadRequestException('Not a participant in this chat');
    }

    await this.prisma.chatMessage.updateMany({
      where: {
        threadId,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    });

    this.chatsGateway.sendMessagesReadToRoom(threadId);

    return { success: true };
  }

  async sendMessage(userId: string, threadId: string, dto: SendMessageDto) {
    const thread = await this.prisma.chatThread.findUnique({
      where: { id: threadId },
      include: {
        listing: { select: { id: true, title: true } },
      },
    });

    if (!thread) {
      throw new NotFoundException('Chat not found');
    }

    if (thread.userAId !== userId && thread.userBId !== userId) {
      throw new BadRequestException('Not a participant in this chat');
    }

    const message = await this.prisma.chatMessage.create({
      data: {
        threadId,
        senderId: userId,
        text: dto.text.trim(),
      },
    });

    await this.prisma.chatThread.update({
      where: { id: threadId },
      data: {
        lastMessageText: message.text,
        lastMessageAt: message.createdAt,
        lastMessageSenderId: userId,
      },
    });

    // Emit real-time event
    this.chatsGateway.sendMessageToRoom(threadId, message);

    const otherUserId = thread.userAId === userId ? thread.userBId : thread.userAId;
    const sender = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        individualProfile: { select: { fullName: true } },
        showroomProfile: { select: { showroomName: true } },
      },
    });

    const senderName = this.getDisplayName(sender);
    const listingTitle = thread.listing?.title || 'إعلان';

    await this.notificationsService.createNotification(
      otherUserId,
      NotificationType.SYSTEM,
      'رسالة جديدة',
      `رسالة جديدة من ${senderName} بخصوص ${listingTitle}`,
      {
        threadId: thread.id,
        listingId: thread.listing?.id,
      },
      true,
    );

    return message;
  }
}
