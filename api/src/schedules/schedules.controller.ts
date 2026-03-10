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
import { Schedule } from 'src/entities';
import { CreateScheduleDto, UpdateScheduleDto } from 'src/types';
import { SchedulesService } from './schedules.service';
import { OrganizationRole } from 'src/auth/organization-role.decorator';
import { Public } from 'src/supabase/public.decorator';

@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  @OrganizationRole('owner', 'admin', 'member', 'guest')
  async findAll(@Headers('Organization') orgId: number): Promise<Schedule[]> {
    return await this.schedulesService.findAll(orgId);
  }

  @Public()
  @Get(':id')
  async findOne(
    @Param('id') id: number,
    @Query('secret') secret?: string,
  ): Promise<Schedule | null> {
    return await this.schedulesService.findOneInAnyOrgOrBySecret(id, secret);
  }

  @Post()
  @OrganizationRole('owner', 'admin', 'member')
  async create(
    @Headers('Organization') orgId: number,
    @Body() createScheduleDto: CreateScheduleDto,
  ): Promise<Schedule> {
    return await this.schedulesService.create(orgId, createScheduleDto);
  }

  @Put(':id')
  @OrganizationRole('owner', 'admin', 'member')
  async update(
    @Headers('Organization') orgId: number,
    @Param('id') id: number,
    @Body() updateScheduleDto: UpdateScheduleDto,
  ): Promise<Schedule> {
    return await this.schedulesService.update(orgId, id, updateScheduleDto);
  }

  @Delete(':id')
  @OrganizationRole('owner', 'admin', 'member')
  async delete(
    @Headers('Organization') orgId: number,
    @Param('id') id: number,
  ): Promise<void> {
    return await this.schedulesService.delete(orgId, id);
  }
}
