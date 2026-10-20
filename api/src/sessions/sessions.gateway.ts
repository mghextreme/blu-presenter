import { Injectable, UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { SkipThrottle } from '@nestjs/throttler';
import { Server } from 'socket.io';
import { SessionsService } from './sessions.service';
import { AuthenticatedSocket } from 'src/types';
import { OrganizationsBaseService } from 'src/organizations/organizations.service';
import { OptionalWebsocketGuard } from 'src/supabase/supabase.guard';

interface JoinSessionDto {
  orgId: number;
  sessionId: number;
  secret: string;
  token?: string;
}

interface LeaveSessionDto {
  sessionId: number;
}

@SkipThrottle()
@Injectable()
@WebSocketGateway({
  path: '/socket/sessions',
})
export class SessionsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly sessionsService: SessionsService,
    private readonly organizationsBaseService: OrganizationsBaseService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    client.emit('connected', {
      message: 'Successfully connected',
      socketId: client.id,
    });
  }

  @UseGuards(OptionalWebsocketGuard)
  @SubscribeMessage('joinSession')
  async handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: JoinSessionDto,
  ) {
    if (!data.orgId) {
      client.emit('error', {
        code: 'missing.orgId',
        message: 'Organization id is required',
      });
      return;
    }

    if (!data.sessionId) {
      client.emit('error', {
        code: 'missing.sessionId',
        message: 'Session id is required',
      });
      return;
    }

    if (
      !(await this.organizationsBaseService.isFeatureEnabledInOrg(
        data.orgId,
        'sessions',
      ))
    ) {
      client.emit('error', {
        code: 'session.disabled',
        message: 'Sessions are disabled for this organization',
      });
      return;
    }

    try {
      const session = await this.sessionsService.findOneBySecret(
        data.orgId,
        data.sessionId,
        data.secret,
      );
      if (!session) {
        client.emit('error', {
          code: 'session.notFound',
          message: 'Session not found',
        });
        return;
      }

      // Leave any other session rooms before joining the new one
      const newRoom = `session:${data.sessionId}`;
      for (const room of client.rooms) {
        if (room.startsWith('session:') && room !== newRoom) {
          await client.leave(room);
        }
      }

      await client.join(newRoom);

      client.emit('joinedSession', {
        id: data.sessionId,
        message: `Successfully joined session ${data.sessionId}`,
        schedule: session.schedule,
        scheduleItem: session.scheduleItem,
        selection: session.selection,
      });
    } catch (error) {
      client.emit('error', {
        code: 'join.failed',
        message: 'Failed to join session',
      });
    }
  }

  @UseGuards(OptionalWebsocketGuard)
  @SubscribeMessage('leaveSession')
  async handleLeaveRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: LeaveSessionDto,
  ) {
    try {
      await client.leave(`session:${data.sessionId}`);

      // Clear cached sessionId so the WebsocketGuard
      // re-verifies on the next joinSession for a different session.
      // Keep userId and orgId — they are user-level, not session-level.
      if (client.sessionId === data.sessionId) {
        client.sessionId = undefined;
      }

      client.emit('leftSession', { id: data.sessionId });
    } catch (error) {
      client.emit('error', {
        code: 'leave.failed',
        message: 'Failed to leave session',
      });
    }
  }

  /**
   * Fan out a broadcast event to every client in a session room.
   * Called by BroadcastService after a successful REST persist — the
   * gateway itself no longer accepts broadcast writes over the socket.
   */
  broadcastToSession(sessionId: number, event: string, payload: unknown): void {
    if (!this.server) return;
    this.server.to(`session:${sessionId}`).emit(event, payload);
  }
}
