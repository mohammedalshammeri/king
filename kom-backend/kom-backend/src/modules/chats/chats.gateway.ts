import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('ChatsGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(@MessageBody() data: { roomId: string }, @ConnectedSocket() client: Socket) {
    const { roomId } = data;
    if (roomId) {
      client.join(roomId);
      this.logger.log(`Client ${client.id} joined room: ${roomId}`);
    }
  }

  @SubscribeMessage('leaveRoom')
  handleLeaveRoom(@MessageBody() data: { roomId: string }, @ConnectedSocket() client: Socket) {
    const { roomId } = data;
    if (roomId) {
      client.leave(roomId);
      this.logger.log(`Client ${client.id} left room: ${roomId}`);
    }
  }

  sendMessageToRoom(roomId: string, message: unknown) {
    if (this.server) {
      this.server.to(roomId).emit('newMessage', message);
    }
  }

  sendMessagesReadToRoom(roomId: string) {
    if (this.server) {
      this.server.to(roomId).emit('messagesRead');
    }
  }
}
