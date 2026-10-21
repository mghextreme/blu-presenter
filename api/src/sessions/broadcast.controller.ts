import {
  Body,
  Controller,
  Headers,
  Param,
  ParseIntPipe,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import {
  SetScheduleBroadcastDto,
  SetScheduleItemBroadcastDto,
  SetSelectionBroadcastDto,
} from 'src/types';
import { OrganizationRole } from 'src/auth/organization-role.decorator';
import { BroadcastService } from './broadcast.service';

/**
 * REST write path for live broadcast state (controller → listeners).
 *
 * Authentication is handled by the global SupabaseGuard (JWT in the
 * Authorization header, auto-refreshed by the frontend on 401) plus the
 * Organization header for the role check — the same model as
 * SessionsController. Fan-out to WebSocket listeners happens in
 * BroadcastService after a successful persist.
 */
@ApiTags('sessions')
@ApiBearerAuth('JWT-auth')
@ApiHeader({
  name: 'Organization',
  description: 'Organization ID',
  required: true,
})
@SkipThrottle() // Interactive, latency-sensitive endpoint: a presenter can emit several  updates per second while advancing slides.
@Controller('sessions/:sessionId/broadcast')
export class BroadcastController {
  constructor(private readonly broadcastService: BroadcastService) {}

  @Put('schedule')
  @OrganizationRole('owner', 'admin', 'member')
  async setSchedule(
    @Headers('Organization') orgId: number,
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Body() setScheduleDto: SetScheduleBroadcastDto,
  ): Promise<void> {
    await this.broadcastService.setSchedule(
      orgId,
      sessionId,
      setScheduleDto.schedule,
    );
  }

  @Put('schedule-item')
  @OrganizationRole('owner', 'admin', 'member')
  async setScheduleItem(
    @Headers('Organization') orgId: number,
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Body() setScheduleItemDto: SetScheduleItemBroadcastDto,
  ): Promise<void> {
    await this.broadcastService.setScheduleItem(
      orgId,
      sessionId,
      setScheduleItemDto.scheduleItem,
    );
  }

  @Put('selection')
  @OrganizationRole('owner', 'admin', 'member')
  async setSelection(
    @Headers('Organization') orgId: number,
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @Body() setSelectionDto: SetSelectionBroadcastDto,
  ): Promise<void> {
    await this.broadcastService.setSelection(
      orgId,
      sessionId,
      setSelectionDto.selection,
    );
  }
}
