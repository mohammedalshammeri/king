import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, Public } from '../../common/decorators';
import { UpdateProfileDto, UpdateShowroomPhoneDto } from './dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile' })
  async getMyProfile(@CurrentUser('id') userId: string) {
    return this.usersService.getUserProfile(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  async updateMyProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/avatar')
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Avatar uploaded' })
  async uploadAvatar(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: { buffer: Buffer; mimetype?: string; size?: number },
  ) {
    return this.usersService.uploadAvatar(userId, file);
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/phones')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Add showroom contact phone (Showroom only)' })
  @ApiResponse({ status: 201, description: 'Phone added' })
  async addShowroomPhone(@CurrentUser('id') userId: string, @Body() dto: UpdateShowroomPhoneDto) {
    return this.usersService.addShowroomPhone(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me/phones/:phoneId')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Remove showroom contact phone (Showroom only)' })
  @ApiResponse({ status: 200, description: 'Phone removed' })
  async removeShowroomPhone(@CurrentUser('id') userId: string, @Param('phoneId') phoneId: string) {
    return this.usersService.removeShowroomPhone(userId, phoneId);
  }

  @Public()
  @Get(':userId/public')
  @ApiOperation({ summary: 'Get user public profile' })
  @ApiResponse({ status: 200, description: 'Public profile' })
  async getUserPublicProfile(@Param('userId') userId: string) {
    return this.usersService.getUserPublicProfile(userId);
  }
}
