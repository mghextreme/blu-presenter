import {
  Body,
  Controller,
  Get,
  Inject,
  Injectable,
  Put,
  Scope,
} from '@nestjs/common';
import { Organization, User } from 'src/entities';
import { UsersService } from './users.service';
import { REQUEST } from '@nestjs/core';
import { Request as ExpRequest } from 'express';
import { UpdateProfileDto } from 'src/types';

@Controller('users')
@Injectable({ scope: Scope.REQUEST })
export class UsersController {
  constructor(
    private usersService: UsersService,
    @Inject(REQUEST) private readonly request: ExpRequest,
  ) {}

  @Get('profile')
  async getProfile(): Promise<Partial<User>> {
    return this.request.user['internal'];
  }

  @Put('profile')
  async updateProfile(
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<Partial<User>> {
    const user = this.request.user['internal'];
    return await this.usersService.update(user.id, updateProfileDto);
  }

  @Get('organizations')
  async getOrganizations(): Promise<Partial<Organization>[]> {
    const user = this.request.user['internal'];
    return await this.usersService.findOrganizations(user.id);
  }
}
