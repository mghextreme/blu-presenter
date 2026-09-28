import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { Session } from 'src/entities';
import {
  CreateSessionDto,
  SearchSessionDto,
  UpdateSessionDto,
} from 'src/types';
import { SessionsServiceWithRequest } from './sessions.service';
import { OrganizationRole } from 'src/auth/organization-role.decorator';
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
  constructor(private readonly sessionsService: SessionsServiceWithRequest) {}

  @Post('search')
  async search(@Body() searchSessionDto: SearchSessionDto): Promise<Session[]> {
    return await this.sessionsService.search(searchSessionDto);
  }

  @Get('user/all')
  async findAllForUser(): Promise<Session[]> {
    return await this.sessionsService.findAllForUserOrgs();
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Session | null> {
    return await this.sessionsService.findOneInAnyOrg(id);
  }

  @Post()
  @OrganizationRole('owner', 'admin', 'member')
  async create(
    @Headers('Organization') orgId: number,
    @Body() createSessionDto: CreateSessionDto,
  ): Promise<Session> {
    return await this.sessionsService.create(orgId, createSessionDto);
  }

  @Put(':id')
  @OrganizationRole('owner', 'admin', 'member')
  async update(
    @Headers('Organization') orgId: number,
    @Param('id') id: number,
    @Body() updateSessionDto: UpdateSessionDto,
  ): Promise<Session> {
    return await this.sessionsService.update(orgId, id, updateSessionDto);
  }

  @Delete(':id')
  @OrganizationRole('owner', 'admin')
  async delete(
    @Headers('Organization') orgId: number,
    @Param('id') id: number,
  ): Promise<void> {
    return await this.sessionsService.delete(orgId, id);
  }

  @Public()
  @Get('org/:orgId/:sessionId')
  async findAllForSession(
    @Param('orgId') orgId: number,
    @Param('sessionId') sessionId: number,
    @Query('secret') secret: string,
  ): Promise<Session> {
    return await this.sessionsService.findOneBySecret(orgId, sessionId, secret);
  }
}
