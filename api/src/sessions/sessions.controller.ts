import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { Session } from 'src/entities';
import { CreateSessionDto, UpdateSessionDto } from 'src/types';
import { SessionsServiceWithRequest } from './sessions.service';
import { OrganizationRole } from 'src/auth/organization-role.decorator';

@Controller('sessions')
export class SessionsController {
  constructor(
    private readonly sessionsService: SessionsServiceWithRequest,
  ) {}

  @Get()
  @OrganizationRole('owner', 'admin', 'member')
  async findAll(@Headers('Organization') orgId: number): Promise<Session[]> {
    return await this.sessionsService.findAll(orgId);
  }

  @Get(':id')
  @OrganizationRole('owner', 'admin', 'member', 'guest')
  async findOne(
    @Headers('Organization') orgId: number,
    @Param('id') id: number,
  ): Promise<Session | null> {
    return await this.sessionsService.findOne(orgId, id);
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

  @Get('user/all')
  async findAllForUser(): Promise<Session[]> {
    return await this.sessionsService.findAllForUserOrgs();
  }
}
