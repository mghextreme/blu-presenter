import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  FindOperator,
  FindOptionsWhere,
  In,
  IsNull,
  ObjectLiteral,
  Or,
  Raw,
  Repository,
} from 'typeorm';
import {
  SearchSongDto,
  CreateSongDto,
  OrganizationMembership,
  UpdateSongDto,
} from 'src/types';
import { Song, User } from 'src/entities';
import { OrganizationsService } from 'src/organizations/organizations.service';
import { UsersService } from 'src/users/users.service';
import { SongWithRoleViewModel } from 'src/models/song-with-role.view-model';
import {
  membershipOrgIds,
  withOrganizationRole,
} from 'src/utils/organization-membership';
import { generateRandomSecret } from 'src/utils/secret';
import {
  SongExportData,
  SongTextFormatError,
  SongTextFormatService,
} from './text-format/song-text-format.service';

@Injectable()
export class SongsService {
  constructor(
    @InjectRepository(Song) private readonly songsRepository: Repository<Song>,
    private readonly organizationsService: OrganizationsService,
    private readonly usersService: UsersService,
    private readonly songTextFormat: SongTextFormatService,
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

  async findOneInAnyOrgOrBySecret(
    id: number,
    secret: string | undefined,
    user: User | undefined,
  ): Promise<SongWithRoleViewModel | null> {
    let whereClause: FindOptionsWhere<Song> | FindOptionsWhere<Song>[];

    let userOrgs: OrganizationMembership[] = [];

    if (user) {
      userOrgs = await this.usersService.findUserOrganizations(user.id);
      const inUserOrgsOrPublic: FindOptionsWhere<Song> = {
        id,
        orgId: Or(In(membershipOrgIds(userOrgs)), IsNull()),
      };
      whereClause = secret
        ? [inUserOrgsOrPublic, { id, secret }]
        : inUserOrgsOrPublic;
    } else {
      whereClause = { id, secret: secret ?? IsNull() };
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
      relations: {
        organization: true,
      },
    });

    if (!song) {
      return null;
    }

    return withOrganizationRole(song, userOrgs) as SongWithRoleViewModel;
  }

  async advancedSearch(
    searchDto: SearchSongDto,
    user: User,
  ): Promise<SongWithRoleViewModel[]> {
    const userOrgs = await this.usersService.findUserOrganizations(user.id);
    const userOrgIds = membershipOrgIds(userOrgs);

    let orgIdCondition: { orgId: FindOperator<number> };
    if (searchDto.organizations && searchDto.organizations.length > 0) {
      if (
        !searchDto.organizations.every((id: number) => userOrgIds.includes(id))
      ) {
        throw new ForbiddenException(
          "You selected an organization which you don't have permissions to access.",
        );
      }

      orgIdCondition = { orgId: In(searchDto.organizations) };
    } else {
      orgIdCondition = { orgId: In(userOrgIds) };
    }

    if (searchDto.searchPublicArchive) {
      orgIdCondition.orgId = Or(orgIdCondition.orgId, IsNull());
    }

    const languageCondition =
      searchDto.languages && searchDto.languages.length > 0
        ? { language: In(searchDto.languages) }
        : {};

    let songsQuery = this.songsRepository.createQueryBuilder('s');
    let whereQuery: ObjectLiteral = {
      ...orgIdCondition,
      ...languageCondition,
    };

    const queryLang = !!searchDto.queryLanguage
      ? searchDto.queryLanguage
      : searchDto.languages?.length === 1
        ? searchDto.languages[0]
        : 'en';
    if (searchDto.query) {
      // Each query token (>= 3 chars) must be word-similar to title/artist,
      // so misspelled words still match via the trigram index.
      const tokens = searchDto.query
        .split(/[^a-z0-9]+/i)
        .filter((token) => token.length >= 3);
      const rawParams: Record<string, string> = {
        query: searchDto.query,
        lang: queryLang,
      };
      const trigramCondition = tokens
        .map((token, i) => {
          rawParams[`tok${i}`] = token;
          return `searchText %> unaccent(lower(:tok${i}))`;
        })
        .join(' AND ');

      whereQuery.searchVector = Raw(
        () =>
          `(
            searchVector @@ get_combined_tsquery_code(:query, :lang)
            ${trigramCondition ? `OR ${trigramCondition}` : ''}
          )`,
        rawParams,
      );

      songsQuery = songsQuery.addSelect(
        `GREATEST(
          ts_rank(searchVector, get_combined_tsquery_code(:query, :lang)),
          similarity(searchText, unaccent(lower(:query))) * 0.1
        )`,
        'rank',
      );
    }

    if (searchDto.includeBlocks === true) {
      songsQuery = songsQuery.addSelect('s.blocks');
    }

    songsQuery = songsQuery.where([whereQuery]);

    if (searchDto.query) {
      songsQuery = songsQuery.orderBy('rank', 'DESC');
    } else {
      songsQuery = songsQuery.orderBy('title', 'ASC');
    }

    songsQuery = songsQuery
      .setParameter('query', searchDto.query)
      .setParameter('lang', queryLang);

    const pageSize = searchDto.itemsPerPage ?? 20;
    const page = searchDto.page ?? 1;
    const songs = await songsQuery
      .skip(pageSize * (page - 1))
      .take(pageSize)
      .getMany();

    return songs.map(
      (song) => withOrganizationRole(song, userOrgs) as SongWithRoleViewModel,
    );
  }

  async create(
    orgId: number,
    createSongDto: CreateSongDto,
  ): Promise<Song | null> {
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

  async importText(orgId: number, text: string): Promise<Song | null> {
    let data: SongExportData;
    try {
      data = this.songTextFormat.decode(text);
    } catch (error) {
      if (error instanceof SongTextFormatError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }

    return await this.create(orgId, {
      title: data.title,
      artist: data.artist ?? undefined,
      language: data.language ?? undefined,
      blocks: data.blocks,
      references: data.references,
    });
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
    // An omitted artist or language keeps its stored value.
    if (updateSongDto.artist !== undefined) {
      song.artist = updateSongDto.artist;
    }
    if (updateSongDto.language !== undefined) {
      song.language = updateSongDto.language;
    }
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

  async copyToOrganization(
    orgId: number,
    songId: number,
    organizationId: number,
    userId: number,
  ): Promise<void> {
    const song = await this.findOne(orgId, songId);
    if (!song) {
      throw new NotFoundException('Song not found');
    }

    const userRole = await this.organizationsService.userRole(
      organizationId,
      userId,
    );

    if (!userRole || !['owner', 'admin', 'member'].includes(userRole)) {
      throw new NotFoundException(
        'User does not have permission to copy songs to this organization',
      );
    }

    await this.create(organizationId, {
      title: song.title,
      artist: song.artist ?? undefined,
      language: song.language ?? undefined,
      blocks: song.blocks,
      references: song.references,
    });
  }
}
