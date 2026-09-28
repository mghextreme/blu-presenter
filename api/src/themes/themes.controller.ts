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
import { Theme } from 'src/entities';
import {
  CreateThemeDto,
  SearchThemeDto,
  UpdateThemeDto,
  CopyThemeToOrganizationDto,
} from 'src/types';
import { ThemeWithRoleViewModel } from 'src/models/theme-with-role.view-model';
import { ThemesService } from './themes.service';
import { OrganizationRole } from 'src/auth/organization-role.decorator';
import { Public } from 'src/supabase/public.decorator';

@Controller('themes')
@ApiTags('themes')
@ApiBearerAuth('JWT-auth')
@ApiHeader({
  name: 'Organization',
  description: 'Organization ID',
  required: false,
})
export class ThemesController {
  constructor(private readonly themesService: ThemesService) {}

  @Post('search')
  async search(
    @Body() searchThemeDto: SearchThemeDto,
  ): Promise<ThemeWithRoleViewModel[]> {
    return await this.themesService.search(searchThemeDto);
  }

  @Get('user/all')
  async findAllForUser(): Promise<Theme[]> {
    return await this.themesService.findAllForUserOrgs();
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<ThemeWithRoleViewModel> {
    return await this.themesService.findOneInAnyOrg(id);
  }

  @Post()
  @OrganizationRole('owner', 'admin', 'member')
  async create(
    @Headers('Organization') orgId: number,
    @Body() createThemeDto: CreateThemeDto,
  ): Promise<Theme> {
    return await this.themesService.create(orgId, createThemeDto);
  }

  @Post('copyToOrganization')
  @OrganizationRole('owner', 'admin', 'member', 'guest')
  async copyToOrganization(
    @Body() copyThemeDto: CopyThemeToOrganizationDto,
  ): Promise<void> {
    await this.themesService.copyToOrganization(
      copyThemeDto.themeId,
      copyThemeDto.organizationId,
    );
  }

  @Put(':id')
  @OrganizationRole('owner', 'admin', 'member')
  async update(
    @Headers('Organization') orgId: number,
    @Param('id') id: number,
    @Body() updateThemeDto: UpdateThemeDto,
  ): Promise<Theme> {
    return await this.themesService.update(orgId, id, updateThemeDto);
  }

  @Delete(':id')
  @OrganizationRole('owner', 'admin')
  async delete(
    @Headers('Organization') orgId: number,
    @Param('id') id: number,
  ): Promise<void> {
    return await this.themesService.delete(orgId, id);
  }

  @Public()
  @Get('organization/:orgId')
  async findAllInOrg(
    @Param('orgId') orgId: number,
    @Query('secret') secret: string,
  ): Promise<Theme[]> {
    return await this.themesService.findAllInOrgBySecret(orgId, secret);
  }

  @Public()
  @Get('session/:orgId/:sessionId')
  async findAllForSession(
    @Param('orgId') orgId: number,
    @Param('sessionId') sessionId: number,
    @Query('secret') secret: string,
    @Query('theme') theme?: number,
  ): Promise<Theme[]> {
    return await this.themesService.findAllForSession(
      orgId,
      sessionId,
      secret,
      theme,
    );
  }

  @Public()
  @Get('organization/:orgId/:themeId')
  async findOneInOrg(
    @Param('orgId') orgId: number,
    @Param('themeId') themeId: number,
    @Query('secret') secret: string,
  ): Promise<Theme> {
    return await this.themesService.findOneInOrgBySecret(
      orgId,
      themeId,
      secret,
    );
  }
}
