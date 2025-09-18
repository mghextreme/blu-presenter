import { ForbiddenException, Inject, Injectable, NotFoundException, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOperator, FindOptionsWhere, ILike, In, IsNull, Or, Raw, Repository } from 'typeorm';
import { AdvancedSearchDto, CreateSongDto, OrganizationRoleOptions, UpdateSongDto } from 'src/types';
import { OrganizationUser, Song } from 'src/entities';
import { OrganizationsService } from 'src/organizations/organizations.service';
import { UsersService } from 'src/users/users.service';
import { REQUEST } from '@nestjs/core';
import { Request as ExpRequest } from 'express';
import { SongWithRoleViewModel } from 'src/models/song-with-role.view-model';
import { generateRandomSecret } from 'src/utils/secret';

@Injectable({ scope: Scope.REQUEST })
export class SongsService {
  constructor(
    @InjectRepository(Song) private readonly songsRepository: Repository<Song>,
    @Inject(OrganizationsService) private readonly organizationsService: OrganizationsService,
    @Inject(UsersService) private readonly usersService: UsersService,
    @Inject(REQUEST) private readonly request: ExpRequest,
  ) {}

  private async findOne(orgId: number, id: number): Promise<Song | null> {
    return this.songsRepository.findOne({
      select: {
        id: true,
        title: true,
        artist: true,
        language: true,
        blocks: true,
        references: true,
        secret: true,
        organization: {
          id: true,
          name: true,
        },
      },
      where: {
        id,
        orgId,
      },
    });
  }

  async findOneInAnyOrgOrBySecret(id: number, secret?: string): Promise<SongWithRoleViewModel | null> {
    let whereClause: FindOptionsWhere<Song> | FindOptionsWhere<Song>[] = { id };

    let userOrgs: Partial<OrganizationUser>[] = [];
    let userOrgIds: number[] = [];

    if (this.request.user !== undefined) {
      const user = this.request.user['internal'];
      userOrgs = await this.usersService.findUserOrganizations(user.id);
      userOrgIds = userOrgs.map((org) => org.organization.id);

      whereClause.orgId = Or(In(userOrgIds), IsNull());

      if (secret) {
        whereClause = [whereClause, { id, secret }];
      }
    } else {
      whereClause.secret = secret ?? null;
    }

    const song = await this.songsRepository.findOne({
      select: {
        id: true,
        orgId: true,
        title: true,
        artist: true,
        language: true,
        blocks: true,
        references: true,
        secret: true,
        organization: {
          id: true,
          name: true,
        },
      },
      where: whereClause,
    });

    if (!song) {
      return null;
    }

    const orgUser = userOrgs.find((org) => org.organization.id == song.orgId);
    return {
      ...song,
      references: song.references,
      organization: orgUser ? {
        ...orgUser.organization,
        role: orgUser.role as OrganizationRoleOptions,
      } : {
        ...song.organization,
        role: undefined,
      },
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
        secret: true,
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

    const queryLang = !!advancedSearchDto.queryLanguage ? advancedSearchDto.queryLanguage : ((advancedSearchDto.languages?.length ?? 0) === 1 ? advancedSearchDto.languages[0] : 'en');
    const whereQuery = [
      {
        ...orgIdCondition,
        ...languageCondition,
        searchVector: Raw(() => `searchVector @@ get_combined_tsquery_code(:query, :lang)`, {
          query: advancedSearchDto.query,
          lang: queryLang,
        }),
      },
    ];

    let songsQuery = this.songsRepository
      .createQueryBuilder('s')
      .addSelect('ts_rank(searchVector, get_combined_tsquery_code(:query, :lang))', 'rank');

    if (advancedSearchDto.includeBlocks === true) {
      songsQuery = songsQuery.addSelect('s.blocks');
    }

    songsQuery = songsQuery
      .where(whereQuery)
      .orderBy('rank', 'DESC')
      .setParameter('query', advancedSearchDto.query)
      .setParameter('lang', queryLang);

    const songs = await songsQuery
      .take(100)
      .getMany();

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
         } : {
          ...song.organization,
          role: undefined,
         },
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
      secret: generateRandomSecret(10),
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
