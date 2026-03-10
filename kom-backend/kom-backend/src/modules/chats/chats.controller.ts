import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators';
import { ChatsService } from './chats.service';
import { ChatMessagesQueryDto, SendMessageDto, StartChatDto } from './dto/chat.dto';

@ApiTags('Chats')
@Controller('chats')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Post('start')
  @ApiOperation({ summary: 'Start or get chat thread for listing' })
  @ApiResponse({ status: 201, description: 'Chat thread created or returned' })
  async startChat(@CurrentUser('id') userId: string, @Body() dto: StartChatDto) {
    return this.chatsService.startChat(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get my chat threads' })
  @ApiResponse({ status: 200, description: 'List of chats' })
  async getMyChats(@CurrentUser('id') userId: string) {
    return this.chatsService.getMyChats(userId);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get chat messages' })
  @ApiResponse({ status: 200, description: 'Chat messages' })
  async getMessages(
    @CurrentUser('id') userId: string,
    @Param('id') threadId: string,
    @Query() query: ChatMessagesQueryDto,
  ) {
    return this.chatsService.getMessages(userId, threadId, query);
  }

  @Post(':id/read')
  @ApiOperation({ summary: 'Mark messages as read' })
  @ApiResponse({ status: 200, description: 'Messages marked as read' })
  async markMessagesAsRead(@CurrentUser('id') userId: string, @Param('id') threadId: string) {
    return this.chatsService.markMessagesAsRead(userId, threadId);
  }

  @Post(':id/messages')
  @ApiOperation({ summary: 'Send a chat message' })
  @ApiResponse({ status: 201, description: 'Message sent' })
  async sendMessage(
    @CurrentUser('id') userId: string,
    @Param('id') threadId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatsService.sendMessage(userId, threadId, dto);
  }
}
