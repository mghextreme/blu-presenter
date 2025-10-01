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
import { Theme } from 'src/entities';
import { CreateThemeDto, UpdateThemeDto, CopyThemeToOrganizationDto } from 'src/types';
import { ThemesService } from './themes.service';
import { OrganizationRole } from 'src/auth/organization-role.decorator';
import { Public } from 'src/supabase/public.decorator';

@Controller('themes')
export class ThemesController {
  constructor(
    private readonly themesService: ThemesService,
  ) {}

  @Get()
  @OrganizationRole('owner', 'admin', 'member')
  async findAll(@Headers('Organization') orgId: number): Promise<Theme[]> {
    return await this.themesService.findAll(orgId);
  }

  @Get(':id')
  @OrganizationRole('owner', 'admin', 'member', 'guest')
  async findOne(
    @Headers('Organization') orgId: number,
    @Param('id') id: number,
  ): Promise<Theme | null> {
    return await this.themesService.findOne(orgId, id);
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
    await this.themesService.copyToOrganization(copyThemeDto.themeId, copyThemeDto.organizationId);
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

  @Get('user/all')
  async findAllForUser(): Promise<Theme[]> {
    return await this.themesService.findAllForUserOrgs();
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
    @Query('theme') theme: number,
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
    return await this.themesService.findOneInOrgBySecret(orgId, themeId, secret);
  }
}
