import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { StoriesService } from './stories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser, Roles } from '../../common/decorators';
import { UserRole } from '@prisma/client';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CreateStoryDto } from './dto/create-story.dto';

type CurrentUserPayload = {
  id: string;
  role: UserRole;
};

@ApiTags('Stories')
@Controller('stories')
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @Get('feed')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get active stories feed' })
  async getFeed(@CurrentUser() user?: CurrentUserPayload | null) {
    return this.storiesService.findAllActive(user?.id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  async create(
    @CurrentUser() user: CurrentUserPayload,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 }), // 50MB
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() dto: CreateStoryDto,
  ) {
    return this.storiesService.create(user, file, dto);
  }

  @Post(':id/view')
  @UseGuards(JwtAuthGuard)
  async view(@Param('id') id: string) {
    return this.storiesService.markAsViewed(id);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  async toggleLike(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.storiesService.toggleLike(user.id, id);
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  async addComment(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body('text') text: string,
  ) {
    return this.storiesService.addComment(user.id, id, text);
  }

  @Get(':id/comments')
  async getComments(@Param('id') id: string) {
    return this.storiesService.getComments(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  async remove(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.storiesService.remove(user.id, id);
  }
}

@ApiTags('Admin Stories')
@Controller('admin/stories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN)
@ApiBearerAuth('JWT-auth')
export class AdminStoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @Get('active')
  async getActive() {
    return this.storiesService.findAllActiveAdmin();
  }

  @Get('pending')
  async getPending() {
    return this.storiesService.findAllPending();
  }

  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.storiesService.findOneWithDetails(id);
  }

  @Patch(':id/approve')
  async approve(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.storiesService.approve(id, user.id);
  }

  @Patch(':id/reject')
  async reject(
    @CurrentUser() user: CurrentUserPayload,
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.storiesService.reject(id, user.id, reason);
  }

  @Delete(':id')
  async deleteStory(@Param('id') id: string) {
    return this.storiesService.deleteStoryAdmin(id);
  }

  // Comment Moderation
  @Get('comments/pending')
  async getPendingComments() {
    return this.storiesService.getPendingComments();
  }

  @Get('comments/:id')
  async getCommentById(@Param('id') id: string) {
    return this.storiesService.findOneCommentWithDetails(id);
  }

  @Patch('comments/:id/approve')
  async approveComment(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.storiesService.approveComment(id, user.id);
  }

  @Patch('comments/:id/reject')
  async rejectComment(@CurrentUser() user: CurrentUserPayload, @Param('id') id: string) {
    return this.storiesService.rejectComment(id, user.id);
  }

  @Delete('comments/:id')
  async deleteComment(@Param('id') id: string) {
    return this.storiesService.deleteCommentAdmin(id);
  }
}
