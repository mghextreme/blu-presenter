import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { User } from 'src/entities';
import { UsersService } from './users.service';
import { UpdateProfileDto } from 'src/types';
import { OrganizationUserViewModel } from 'src/models';
import { AccessToken, CurrentUser } from 'src/auth/request-context.decorator';

@Controller('users')
@ApiTags('users')
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  getProfile(@CurrentUser() user: User): Partial<User> {
    return user;
  }

  @Put('profile')
  async updateProfile(
    @CurrentUser() user: User,
    @AccessToken() accessToken: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<Partial<User>> {
    return await this.usersService.update(
      user.id,
      updateProfileDto,
      accessToken,
    );
  }

  @Get('organizations')
  async getUserOrganizations(
    @CurrentUser() user: User,
  ): Promise<OrganizationUserViewModel[]> {
    const orgUsers = await this.usersService.findUserOrganizations(user.id);
    return orgUsers.map((item) => ({
      id: item.organization.id,
      name: item.organization.name,
      role: item.role,
      disabledFeatures: item.organization.disabledFeatures,
    }));
  }
}
