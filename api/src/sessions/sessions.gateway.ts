import { Injectable, UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { SessionsService } from './sessions.service';
import { AuthenticatedSocket, ISelection } from 'src/types';
import { OptionalWebsocketGuard, WebsocketGuard } from 'src/supabase/supabase.guard';
import { sanitizeSchedule, sanitizeScheduleItem, sanitizeSelection } from 'src/utils/sanitizer';

interface JoinSessionDto {
  orgId: number;
  sessionId: number;
  secret: string;
  token?: string;
}

interface LeaveSessionDto {
  sessionId: number;
}

interface SetScheduleDto {
  sessionId: number;
  schedule: any[];
}

interface SetScheduleItemDto {
  sessionId: number;
  scheduleItem: any;
}

interface SetSelectionDto {
  sessionId: number;
  selection: ISelection;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  path: '/socket/sessions',
})
export class SessionsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly sessionsService: SessionsService,
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
      client.emit('error', { code: 'missing.orgId', message: 'Organization id is required' });
      return;
    }

    if (!data.sessionId) {
      client.emit('error', { code: 'missing.sessionId', message: 'Session id is required' });
      return;
    }

    try {
      const session = await this.sessionsService.findOneBySecret(data.orgId, data.sessionId, data.secret);
      if (!session) {
        client.emit('error', { code: 'session.notFound', message: 'Session not found' });
        return;
      }

      await client.join(`session:${data.sessionId}`);

      client.emit('joinedSession', {
        id: data.sessionId,
        message: `Successfully joined session ${data.sessionId}`,
        schedule: session.schedule,
        scheduleItem: session.scheduleItem,
        selection: session.selection,
      });

    } catch (error) {
      client.emit('error', { code: 'join.failed', message: 'Failed to join session' });
    }
  }

  @SubscribeMessage('leaveSession')
  async handleLeaveRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: LeaveSessionDto,
  ) {
    try {
      await client.leave(`session:${data.sessionId}`);

      client.emit('leftSession', { id: data.sessionId });

    } catch (error) {
      client.emit('error', { code: 'leave.failed', message: 'Failed to leave session' });
    }
  }

  @UseGuards(WebsocketGuard)
  @SubscribeMessage('setSchedule')
  async handleSchedule(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: SetScheduleDto,
  ) {
    try {
      if (!client.userId || !client.orgId || !client.sessionId || client.sessionId != data.sessionId) {
        client.emit('error', { code: 'unauthorized', message: 'Unauthorized' });
        return;
      }

      let schedule = [];
      if (data.schedule && data.schedule.length > 0) {
        schedule = sanitizeSchedule(data.schedule);
      }

      const sessionRoom = `session:${data.sessionId}`;
      if (!client.rooms.has(sessionRoom)) {
        client.emit('error', { code: 'notInSession', message: 'You must join the session before setting the schedule' });
        return;
      }

      this.server.to(sessionRoom).emit('schedule', schedule);
      await this.sessionsService.setSchedule(client.orgId, data.sessionId, schedule);

    } catch (error) {
      client.emit('error', { code: 'data.failed', message: 'Failed to set schedule' });
    }
  }

  @UseGuards(WebsocketGuard)
  @SubscribeMessage('setScheduleItem')
  async handleScheduleItem(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: SetScheduleItemDto,
  ) {
    try {
      if (!client.userId || !client.orgId || !client.sessionId || client.sessionId != data.sessionId) {
        client.emit('error', { code: 'unauthorized', message: 'Unauthorized' });
        return;
      }

      const sessionRoom = `session:${data.sessionId}`;
      if (!client.rooms.has(sessionRoom)) {
        client.emit('error', { code: 'notInSession', message: 'You must join the session before setting the schedule item' });
        return;
      }

      const scheduleItem = sanitizeScheduleItem(data.scheduleItem);
      this.server.to(sessionRoom).emit('scheduleItem', scheduleItem);
      await this.sessionsService.setScheduleItem(client.orgId, data.sessionId, scheduleItem);

    } catch (error) {
      client.emit('error', { code: 'data.failed', message: 'Failed to set schedule item' });
    }
  }

  @UseGuards(WebsocketGuard)
  @SubscribeMessage('setSelection')
  async handleSelection(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: SetSelectionDto,
  ) {
    try {
      if (!client.userId || !client.orgId || !client.sessionId || client.sessionId != data.sessionId) {
        client.emit('error', { code: 'unauthorized', message: 'Unauthorized' });
        return;
      }

      const sessionRoom = `session:${data.sessionId}`;
      if (!client.rooms.has(sessionRoom)) {
        client.emit('error', { code: 'notInSession', message: 'You must join the session before setting the selection' });
        return;
      }

      const selection = sanitizeSelection(data.selection);
      this.server.to(sessionRoom).emit('selection', selection);
      await this.sessionsService.setSelection(client.orgId, data.sessionId, selection);

    } catch (error) {
      client.emit('error', { code: 'data.failed', message: 'Failed to set selection' });
    }
  }
}
