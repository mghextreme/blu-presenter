import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { Session, User } from 'src/entities';
import {
  CreateSessionDto,
  SearchSessionDto,
  UpdateSessionDto,
} from 'src/types';
import { SessionsService, SessionWithRole } from './sessions.service';
import { OrganizationRole } from 'src/auth/organization-role.decorator';
import { CurrentUser, OrgId } from 'src/auth/request-context.decorator';
import { Public } from 'src/supabase/public.decorator';

@Controller('sessions')
@ApiTags('sessions')
@ApiBearerAuth('JWT-auth')
@ApiHeader({
  name: 'Organization',
  description: 'Organization ID',
  required: false,
})
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Post('search')
  async search(
    @CurrentUser() user: User,
    @Body() searchSessionDto: SearchSessionDto,
  ): Promise<SessionWithRole[]> {
    return await this.sessionsService.search(searchSessionDto, user);
  }

  @Get('user/all')
  async findAllForUser(@CurrentUser() user: User): Promise<SessionWithRole[]> {
    return await this.sessionsService.findAllForUserOrgs(user);
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: User,
    @Param('id') id: number,
  ): Promise<SessionWithRole> {
    return await this.sessionsService.findOneInAnyOrg(id, user);
  }

  @Post()
  @OrganizationRole('owner', 'admin', 'member')
  async create(
    @OrgId() orgId: number,
    @Body() createSessionDto: CreateSessionDto,
  ): Promise<Session | null> {
    return await this.sessionsService.create(orgId, createSessionDto);
  }

  @Put(':id')
  @OrganizationRole('owner', 'admin', 'member')
  async update(
    @OrgId() orgId: number,
    @Param('id') id: number,
    @Body() updateSessionDto: UpdateSessionDto,
  ): Promise<Session> {
    return await this.sessionsService.update(orgId, id, updateSessionDto);
  }

  @Delete(':id')
  @OrganizationRole('owner', 'admin')
  async delete(@OrgId() orgId: number, @Param('id') id: number): Promise<void> {
    return await this.sessionsService.delete(orgId, id);
  }

  @Public()
  @Get('org/:orgId/:sessionId')
  async findAllForSession(
    @Param('orgId') orgId: number,
    @Param('sessionId') sessionId: number,
    @Query('secret') secret: string,
  ): Promise<Session | null> {
    return await this.sessionsService.findOneBySecret(orgId, sessionId, secret);
  }
}
