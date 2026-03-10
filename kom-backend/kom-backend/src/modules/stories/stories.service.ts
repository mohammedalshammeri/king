import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudinaryService } from '../media/cloudinary.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { CommentStatus, MediaType, Prisma, StoryStatus, UserRole, SubscriptionStatus, IndividualPurchaseStatus } from '@prisma/client';

type CurrentUserPayload = {
  id: string;
  role: UserRole;
};

@Injectable()
export class StoriesService {
  constructor(
    private prisma: PrismaService,
    private cloudinary: CloudinaryService,
    private notifications: NotificationsService,
  ) {}

  async remove(userId: string, id: string) {
    const story = await this.prisma.story.findUnique({ where: { id } });
    if (!story) throw new NotFoundException('Story not found');

    if (story.userId !== userId) {
      // Allow admins to delete as well? For now strict owner check unless role passed
      throw new ForbiddenException('You can only delete your own stories');
    }

    return this.prisma.story.delete({ where: { id } });
  }

  async create(user: CurrentUserPayload, file: Express.Multer.File, dto: CreateStoryDto) {
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';

    // ── Quota check (skip for admins) ────────────────────────────────────────
    if (!isAdmin) {
      let maxStories = 0; // 0 = no package → can't post stories

      if (user.role === UserRole.USER_SHOWROOM) {
        // Showroom merchants must have an active subscription
        const subscription = await this.prisma.subscription.findUnique({
          where: { userId: user.id },
          include: { package: true },
        });
        if (!subscription || subscription.status !== SubscriptionStatus.ACTIVE || subscription.endDate <= new Date()) {
          throw new ForbiddenException('يجب أن يكون لديك اشتراك نشط لنشر قصة. اشترك في إحدى الباقات أولاً.');
        }
        maxStories = subscription.package.maxStories;
      } else if (user.role === UserRole.USER_INDIVIDUAL) {
        // Individual users must have at least one active purchase bundle − use the highest maxStories
        const purchases = await this.prisma.individualPurchase.findMany({
          where: { userId: user.id, status: IndividualPurchaseStatus.ACTIVE },
          include: { package: true },
        });
        if (purchases.length === 0) {
          throw new ForbiddenException('يجب أن تمتلك باقة إعلانات نشطة لنشر قصة. اشترِ إحدى الباقات أولاً.');
        }
        // Use the max maxStories across all active packages
        maxStories = Math.max(...purchases.map((p) => p.package.maxStories));
      } else {
        throw new ForbiddenException('غير مسموح لك بنشر قصص.');
      }

      // Count current ACTIVE + PENDING stories for this user
      const currentCount = await this.prisma.story.count({
        where: {
          userId: user.id,
          status: { in: [StoryStatus.ACTIVE, StoryStatus.PENDING] },
        },
      });

      if (currentCount >= maxStories) {
        throw new BadRequestException(
          `لقد وصلت إلى الحد الأقصى للقصص (${maxStories}). انتظر حتى تنتهي قصصك الحالية أو قم بترقية باقتك.`,
        );
      }
    }

    const folder = `stories/${user.id}`;
    const resourceType = dto.mediaType === MediaType.VIDEO ? 'video' : 'image';

    // Upload to Cloudinary
    const result = await this.cloudinary.uploadBuffer(file.buffer, {
      folder,
      resourceType,
    });

    // Default expiration (will be reset on approval)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    return this.prisma.story.create({
      data: {
        userId: user.id,
        mediaUrl: result.secureUrl,
        mediaType: dto.mediaType,
        duration: dto.duration || (result.duration ? Math.round(result.duration) : 5),
        status: isAdmin ? StoryStatus.ACTIVE : StoryStatus.PENDING,
        postedAt: isAdmin ? new Date() : null,
        expiresAt,
      },
    });
  }

  async findAllActive(userId?: string) {
    const storyUserSelect = {
      id: true,
      role: true,
      email: true,
      individualProfile: {
        select: { fullName: true, avatarUrl: true },
      },
      showroomProfile: {
        select: { showroomName: true, logoUrl: true },
      },
    } satisfies Prisma.UserSelect;

    type StoryWithUser = Prisma.StoryGetPayload<{
      include: { user: { select: typeof storyUserSelect } };
    }>;

    const stories = await this.prisma.story.findMany({
      where: {
        status: StoryStatus.ACTIVE,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          select: storyUserSelect,
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    let likedStoryIds = new Set<string>();
    if (userId) {
      const likes = await this.prisma.storyLike.findMany({
        where: {
          userId,
          storyId: { in: stories.map((s) => s.id) },
        },
        select: { storyId: true },
      });
      likedStoryIds = new Set(likes.map((l) => l.storyId));
    }

    // Group by user
    type StoryGroup = {
      userId: string;
      userName: string;
      userAvatar: string | null;
      role: UserRole;
      stories: Array<StoryWithUser & { isLiked: boolean }>;
    };

    const grouped = (stories as StoryWithUser[]).reduce<Record<string, StoryGroup>>(
      (acc, story) => {
        const uId = story.userId;
        if (!acc[uId]) {
          let name = 'Unknown';
          let avatar: string | null = null;
          // Logic to determine name and avatar
          if (story.user.showroomProfile) {
            name = story.user.showroomProfile.showroomName;
            avatar = story.user.showroomProfile.logoUrl;
          } else if (story.user.individualProfile) {
            name = story.user.individualProfile.fullName;
            avatar = story.user.individualProfile.avatarUrl;
          } else {
            // Fallback for admins without profiles
            const emailName = story.user.email?.split('@')[0] || 'User';
            name = `Admin (${emailName})`;
            // Distinct Admin Avatar
            avatar = `https://ui-avatars.com/api/?name=${emailName}&background=000000&color=fff&size=200&font-size=0.5`;
          }

          acc[uId] = {
            userId: uId,
            userName: name,
            userAvatar: avatar,
            role: story.user.role, // Capture role
            stories: [],
          };
        }

        acc[uId].stories.push({
          ...story,
          isLiked: likedStoryIds.has(story.id),
        });
        return acc;
      },
      {},
    );

    // Sort: Admins first
    const result = Object.values(grouped).sort((a, b) => {
      const aIsAdmin = a.role === 'ADMIN' || a.role === 'SUPER_ADMIN';
      const bIsAdmin = b.role === 'ADMIN' || b.role === 'SUPER_ADMIN';
      if (aIsAdmin && !bIsAdmin) return -1;
      if (!aIsAdmin && bIsAdmin) return 1;
      return 0;
    });

    return result;
  }

  async toggleLike(userId: string, storyId: string) {
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) throw new NotFoundException('Story not found');

    const existing = await this.prisma.storyLike.findUnique({
      where: {
        storyId_userId: {
          storyId,
          userId,
        },
      },
    });

    if (existing) {
      // Unlike
      await this.prisma.$transaction([
        this.prisma.storyLike.delete({
          where: {
            storyId_userId: {
              storyId,
              userId,
            },
          },
        }),
        this.prisma.story.update({
          where: { id: storyId },
          data: { likesCount: { decrement: 1 } },
        }),
      ]);
      return { isLiked: false, likesCount: story.likesCount > 0 ? story.likesCount - 1 : 0 };
    } else {
      // Like
      await this.prisma.$transaction([
        this.prisma.storyLike.create({
          data: {
            storyId,
            userId,
          },
        }),
        this.prisma.story.update({
          where: { id: storyId },
          data: { likesCount: { increment: 1 } },
        }),
      ]);
      return { isLiked: true, likesCount: story.likesCount + 1 };
    }
  }

  async addComment(userId: string, storyId: string, text: string) {
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) throw new NotFoundException('Story not found');

    return this.prisma.$transaction(async (tx) => {
      const comment = await tx.storyComment.create({
        data: {
          storyId,
          userId,
          text,
        },
        include: {
          user: {
            select: {
              id: true,
              individualProfile: { select: { fullName: true, avatarUrl: true } },
              showroomProfile: { select: { showroomName: true, logoUrl: true } },
              role: true,
            },
          },
        },
      });

      await tx.story.update({
        where: { id: storyId },
        data: { commentsCount: { increment: 1 } },
      });

      return {
        id: comment.id,
        text: comment.text,
        createdAt: comment.createdAt,
        userId: comment.user.id,
        userName:
          comment.user.showroomProfile?.showroomName ||
          comment.user.individualProfile?.fullName ||
          'User',
        userAvatar:
          comment.user.showroomProfile?.logoUrl || comment.user.individualProfile?.avatarUrl,
      };
    });
  }

  async getComments(storyId: string) {
    const comments = await this.prisma.storyComment.findMany({
      where: { storyId, status: CommentStatus.APPROVED },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            individualProfile: { select: { fullName: true, avatarUrl: true } },
            showroomProfile: { select: { showroomName: true, logoUrl: true } },
            role: true,
          },
        },
      },
    });

    return comments.map((c) => ({
      id: c.id,
      text: c.text,
      createdAt: c.createdAt,
      userId: c.user.id,
      userName:
        c.user.showroomProfile?.showroomName || c.user.individualProfile?.fullName || 'User',
      userAvatar: c.user.showroomProfile?.logoUrl || c.user.individualProfile?.avatarUrl,
    }));
  }

  async findAllPending() {
    return this.prisma.story.findMany({
      where: { status: StoryStatus.PENDING },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            showroomProfile: true,
            individualProfile: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllActiveAdmin() {
    return this.prisma.story.findMany({
      where: { status: StoryStatus.ACTIVE },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            showroomProfile: true,
            individualProfile: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteStoryAdmin(id: string) {
    const story = await this.prisma.story.findUnique({ where: { id } });
    if (!story) throw new NotFoundException('Story not found');
    return this.prisma.story.delete({ where: { id } });
  }

  async findOneWithDetails(id: string) {
    const story = await this.prisma.story.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            individualProfile: { select: { fullName: true } },
            showroomProfile: { select: { showroomName: true } },
          },
        },
      },
    });

    if (!story) throw new NotFoundException('Story not found');
    return story;
  }

  async findOneCommentWithDetails(id: string) {
    const comment = await this.prisma.storyComment.findUnique({
      where: { id },
      include: {
        story: true,
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            individualProfile: { select: { fullName: true } },
            showroomProfile: { select: { showroomName: true } },
          },
        },
      },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    return comment;
  }

  async approve(id: string, adminId: string) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    const story = await this.prisma.story.findUnique({ where: { id } });
    if (!story) throw new NotFoundException('Story not found');

    const updated = await this.prisma.story.update({
      where: { id },
      data: {
        status: StoryStatus.ACTIVE,
        postedAt: new Date(),
        expiresAt,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'STORY_APPROVED',
        entityType: 'Story',
        entityId: id,
        before: { status: story.status },
        after: { status: updated.status },
      },
    });

    await this.notifications.notifyStoryApproved(story.userId, id);

    return updated;
  }

  async reject(id: string, adminId: string, reason?: string) {
    const story = await this.prisma.story.findUnique({ where: { id } });
    if (!story) throw new NotFoundException('Story not found');

    const updated = await this.prisma.story.update({
      where: { id },
      data: {
        status: StoryStatus.REJECTED,
        rejectionReason: reason,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'STORY_REJECTED',
        entityType: 'Story',
        entityId: id,
        before: { status: story.status },
        after: { status: updated.status, reason },
      },
    });

    await this.notifications.notifyStoryRejected(story.userId, id, reason);

    return updated;
  }

  async markAsViewed(id: string) {
    return this.prisma.story.update({
      where: { id },
      data: { viewsCount: { increment: 1 } },
    });
  }

  // Admin Comment Moderation
  async getPendingComments() {
    return this.prisma.storyComment.findMany({
      where: { status: CommentStatus.PENDING },
      include: {
        story: true,
        user: { select: { email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveComment(id: string, adminId: string) {
    const comment = await this.prisma.storyComment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException('Comment not found');

    const updated = await this.prisma.storyComment.update({
      where: { id },
      data: { status: CommentStatus.APPROVED },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'STORY_COMMENT_APPROVED',
        entityType: 'StoryComment',
        entityId: id,
        before: { status: comment.status },
        after: { status: updated.status },
      },
    });

    return updated;
  }

  async rejectComment(id: string, adminId: string) {
    const comment = await this.prisma.storyComment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException('Comment not found');

    const updated = await this.prisma.storyComment.update({
      where: { id },
      data: { status: CommentStatus.REJECTED },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: adminId,
        action: 'STORY_COMMENT_REJECTED',
        entityType: 'StoryComment',
        entityId: id,
        before: { status: comment.status },
        after: { status: updated.status },
      },
    });

    return updated;
  }

  async deleteCommentAdmin(id: string) {
    const comment = await this.prisma.storyComment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException('Comment not found');

    await this.prisma.$transaction([
      this.prisma.storyComment.delete({ where: { id } }),
      this.prisma.story.update({
        where: { id: comment.storyId },
        data: { commentsCount: { decrement: 1 } },
      }),
    ]);
    return { success: true };
  }
}
