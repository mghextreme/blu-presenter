import { ForbiddenException, Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOperator, ILike, In, IsNull, Or, Repository } from 'typeorm';
import { AdvancedSearchDto, CreateSongDto, OrganizationRoleOptions, UpdateSongDto } from 'src/types';
import { OrganizationUser, Song } from 'src/entities';
import { OrganizationsService } from 'src/organizations/organizations.service';
import { UsersService } from 'src/users/users.service';
import { REQUEST } from '@nestjs/core';
import { Request as ExpRequest } from 'express';
import { SongWithRoleViewModel } from 'src/models/song-with-role.view-model';

@Injectable({ scope: Scope.REQUEST })
export class SongsService {
  constructor(
    @InjectRepository(Song) private readonly songsRepository: Repository<Song>,
    @Inject(OrganizationsService) private readonly organizationsService: OrganizationsService,
    @Inject(UsersService) private readonly usersService: UsersService,
    @Inject(REQUEST) private readonly request: ExpRequest,
  ) {}

  async findOne(orgId: number, id: number): Promise<Song | null> {
    return this.songsRepository.findOne({
      select: {
        id: true,
        title: true,
        artist: true,
        language: true,
        blocks: true,
      },
      where: {
        id,
        orgId,
      },
    });
  }

  async findOneInAnyOrg(id: number): Promise<SongWithRoleViewModel | null> {
    const user = this.request.user['internal'];
    const userOrgs = await this.usersService.findUserOrganizations(user.id);
    const userOrgIds = userOrgs.map((org) => org.organization.id);

    const song = await this.songsRepository.findOne({
      select: {
        id: true,
        orgId: true,
        title: true,
        artist: true,
        language: true,
        blocks: true,
        references: true,
      },
      where: {
        id,
        orgId: Or(In(userOrgIds), IsNull()),
      },
    });

    if (!song) {
      return null;
    }

    const orgUser = userOrgs.find((org) => org.organization.id == song.orgId);
    return {
      ...song,
      organization: orgUser ? {
        ...orgUser.organization,
        role: orgUser.role as OrganizationRoleOptions,
        } : null,
    } as SongWithRoleViewModel;
  }

  async findAll(orgId: number): Promise<Song[]> {
    return this.songsRepository.find({
      select: {
        id: true,
        title: true,
        artist: true,
        language: true,
        blocks: true,
      },
      where: {
        orgId,
      },
      order: {
        title: 'asc',
        artist: 'asc',
      },
    });
  }

  async advancedSearch(advancedSearchDto: AdvancedSearchDto): Promise<SongWithRoleViewModel[]> {
    const user = this.request.user['internal'];
    const userOrgs = await this.usersService.findUserOrganizations(user.id);
    const userOrgIds = userOrgs.map((org) => org.organization.id);

    let orgIdCondition: { orgId: FindOperator<number>};
    if (advancedSearchDto.organizations && advancedSearchDto.organizations.length > 0) {
      if (!advancedSearchDto.organizations.every((id: number) => userOrgIds.includes(id))) {
        throw new ForbiddenException('You selected an organization which you don\'t have permissions to access.');
      }

      orgIdCondition = { orgId: In(advancedSearchDto.organizations) };
    } else {
      orgIdCondition = { orgId: In(userOrgIds) };
    }

    if (advancedSearchDto.searchPublicArchive) {
      orgIdCondition.orgId = Or(orgIdCondition.orgId, IsNull());
    }

    const languageCondition = advancedSearchDto.languages && advancedSearchDto.languages.length > 0
      ? {language: In(advancedSearchDto.languages)}
      : {};

    const whereQuery = [
      {
        ...orgIdCondition,
        ...languageCondition,
        title: ILike(`%${advancedSearchDto.query}%`),
      },
      {
        ...orgIdCondition,
        ...languageCondition,
        artist: ILike(`%${advancedSearchDto.query}%`),
      },
    ];

    const songs = await this.songsRepository.find({
      where: whereQuery,
      select: {
        id: true,
        orgId: true,
        title: true,
        artist: true,
        blocks: true,
      },
      order: {
        orgId: {
          nulls: 'last',
        },
      },
      take: 100,
    });

    const userOrgsMap: {[key: number]: Partial<OrganizationUser>} = {};
    for (const org of userOrgs) {
      userOrgsMap[org.organization.id] = org;
    }

    return songs.map((song) => {
      const orgUser = userOrgsMap[song.orgId];
      return {
        ...song,
        organization: orgUser ? {
          ...orgUser.organization,
          role: orgUser.role as OrganizationRoleOptions,
         } : null,
      } as SongWithRoleViewModel;
    });
  }

  async create(orgId: number, createSongDto: CreateSongDto): Promise<Song> {
    const result = await this.songsRepository.insert({
      title: createSongDto.title,
      artist: createSongDto.artist,
      language: createSongDto.language,
      blocks: createSongDto.blocks,
      references: createSongDto.references ?? [],
      orgId,
    });
    const songId = result.raw[0].id;

    return this.findOne(orgId, songId);
  }

  async update(
    orgId: number,
    id: number,
    updateSongDto: UpdateSongDto,
  ): Promise<Song> {
    const song = await this.songsRepository.findOneBy({ id, orgId });
    if (!song) {
      throw new NotFoundException();
    }

    song.title = updateSongDto.title;
    song.artist = updateSongDto.artist;
    song.language = updateSongDto.language;
    song.blocks = updateSongDto.blocks;
    song.references = updateSongDto.references ?? [];

    const result = await this.songsRepository.save(song);
    return result as Song;
  }

  async delete(orgId: number, id: number): Promise<void> {
    const song = await this.songsRepository.findOneBy({ id, orgId });
    if (!song) {
      throw new NotFoundException();
    }

    await this.songsRepository.delete(id);
  }

  async copyToOrganization(songId: number, organizationId: number): Promise<void> {
    const orgId = this.request.user['organization'];
    const song = await this.findOne(orgId, songId)
    if (!song) {
      throw new NotFoundException('Song not found');
    }

    const userId = this.request.user['internal']?.id;
    const userRole = await this.organizationsService.userRole(organizationId, userId);

    if (!userRole || !['owner', 'admin', 'member'].includes(userRole)) {
      throw new NotFoundException('User does not have permission to copy songs to this organization');
    }

    this.create(
      organizationId,
      {
        title: song.title,
        artist: song.artist,
        language: song.language,
        blocks: song.blocks,
        references: song.references,
      }
    );
  }
}
