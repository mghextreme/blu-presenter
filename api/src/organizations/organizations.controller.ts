import {
  Body,
  Controller,
  Get,
  Inject,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { Organization } from 'src/entities';
import { CreateOrganizationDto, UpdateOrganizationDto } from 'src/types';
import { OrganizationsService } from './organizations.service';
import { OrganizationRole } from '../auth/organization-role.decorator';
import { REQUEST } from '@nestjs/core';
import { Request as ExpRequest } from 'express';

@Controller('organizations')
export class OrganizationsController {
  constructor(
    private organizationsService: OrganizationsService,
    @Inject(REQUEST) private readonly request: ExpRequest,
  ) {}

  @Get(':id')
  @OrganizationRole('owner', 'admin', 'member')
  async findOne(@Param('id') id: number): Promise<Organization> {
    return await this.organizationsService.findOne(id);
  }

  @Post()
  async create(
    @Body() createOrganizationDto: CreateOrganizationDto,
  ): Promise<Organization> {
    const user = this.request.user['internal'];
    return await this.organizationsService.create(
      createOrganizationDto,
      user.id,
    );
  }

  @Put(':id')
  @OrganizationRole('owner', 'admin')
  async update(
    @Param('id') id: number,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ): Promise<Organization> {
    return await this.organizationsService.update(id, updateOrganizationDto);
  }
}
