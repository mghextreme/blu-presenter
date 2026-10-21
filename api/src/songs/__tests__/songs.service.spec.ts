import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { SongsService } from '../songs.service';
import { Song } from '../../entities';
import { SongTextFormatService } from '../text-format/song-text-format.service';
import { OrganizationsService } from '../../organizations/organizations.service';
import { UsersService } from '../../users/users.service';

const VALID_TEXT =
  '---\nschemaVersion: 1\nlanguage: en\n---\n\n# Amazing Grace\n## John Newton\n\n### [V1] Verse 1\n* F#            A#m\n- Amazing grace, how sweet the sound\n';

describe('SongsService.importText', () => {
  let service: SongsService;

  const mockSongsRepository = {
    insert: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SongsService,
        SongTextFormatService,
        { provide: getRepositoryToken(Song), useValue: mockSongsRepository },
        { provide: OrganizationsService, useValue: {} },
        { provide: UsersService, useValue: {} },
        { provide: REQUEST, useValue: { user: {} } },
      ],
    }).compile();

    service = await module.resolve<SongsService>(SongsService);
  });

  it('decodes the text and creates the song in the organization', async () => {
    mockSongsRepository.insert.mockResolvedValue({ raw: [{ id: 99 }] });
    mockSongsRepository.findOne.mockResolvedValue({
      id: 99,
      title: 'Amazing Grace',
      artist: 'John Newton',
      language: 'en',
    });

    const result = await service.importText(1, VALID_TEXT);

    expect(result.id).toBe(99);
    expect(mockSongsRepository.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        orgId: 1,
        title: 'Amazing Grace',
        artist: 'John Newton',
        language: 'en',
        blocks: [
          {
            name: 'Verse 1',
            acronym: 'V1',
            lines: [
              { type: 'chords', content: 'F#            A#m' },
              { type: 'lyrics', content: 'Amazing grace, how sweet the sound' },
            ],
          },
        ],
      }),
    );
  });

  it('omits the language when the text has none', async () => {
    mockSongsRepository.insert.mockResolvedValue({ raw: [{ id: 1 }] });
    mockSongsRepository.findOne.mockResolvedValue({ id: 1 });

    await service.importText(1, '---\nschemaVersion: 1\n---\n\n# T\n## A\n');

    expect(mockSongsRepository.insert).toHaveBeenCalledWith(
      expect.objectContaining({ language: undefined }),
    );
  });

  it('throws BadRequest with the decode error when the text is not in the format', async () => {
    await expect(
      service.importText(1, 'just lyrics\nand more lyrics'),
    ).rejects.toThrow(
      new BadRequestException(
        'Missing frontmatter: file must start with --- (line 1)',
      ),
    );
    expect(mockSongsRepository.insert).not.toHaveBeenCalled();
  });
});

describe('SongsService.advancedSearch', () => {
  let service: SongsService;

  const queryBuilder: Record<string, jest.Mock> = {};
  const mockUsersService = { findUserOrganizations: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    for (const method of [
      'addSelect',
      'where',
      'orderBy',
      'setParameter',
      'skip',
      'take',
    ]) {
      queryBuilder[method] = jest.fn().mockReturnValue(queryBuilder);
    }
    queryBuilder.getMany = jest.fn().mockResolvedValue([]);
    mockUsersService.findUserOrganizations.mockResolvedValue([
      { organization: { id: 1 }, role: 'owner' },
    ]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SongsService,
        SongTextFormatService,
        { provide: getRepositoryToken(Song), useValue: { createQueryBuilder: jest.fn(() => queryBuilder) } },
        { provide: OrganizationsService, useValue: {} },
        { provide: UsersService, useValue: mockUsersService },
        { provide: REQUEST, useValue: { user: { internal: { id: 42 } } } },
      ],
    }).compile();

    service = await module.resolve<SongsService>(SongsService);
  });

  it('combines prefix full-text with per-token trigram matching', async () => {
    await service.advancedSearch({
      query: 'Amzaing Grcae!',
      organizations: [1],
      queryLanguage: 'en',
    } as any);

    const whereObject = queryBuilder.where.mock.calls[0][0][0];
    const findOperator = whereObject.searchVector;
    const sql = findOperator.getSql();

    expect(sql).toContain(
      'searchVector @@ get_combined_tsquery_code(:query, :lang)',
    );
    expect(sql).toContain('OR searchText %> unaccent(lower(:tok0))');
    expect(sql).toContain('AND searchText %> unaccent(lower(:tok1))');
    expect(findOperator.objectLiteralParameters).toEqual({
      query: 'Amzaing Grcae!',
      lang: 'en',
      tok0: 'Amzaing',
      tok1: 'Grcae',
    });

    const rankSelect = queryBuilder.addSelect.mock.calls[0][0];
    expect(rankSelect).toContain('GREATEST(');
    expect(rankSelect).toContain(
      'ts_rank(searchVector, get_combined_tsquery_code(:query, :lang))',
    );
    expect(rankSelect).toContain(
      'similarity(searchText, unaccent(lower(:query))) * 0.1',
    );
    expect(queryBuilder.orderBy).toHaveBeenCalledWith('rank', 'DESC');
  });

  it('skips trigram conditions when no query token is long enough', async () => {
    await service.advancedSearch({
      query: 'a b c!',
      organizations: [1],
      queryLanguage: 'en',
    } as any);

    const sql = queryBuilder.where.mock.calls[0][0][0].searchVector.getSql();
    expect(sql).not.toContain('%>');
  });

  it('orders by title and skips ranking when there is no query', async () => {
    await service.advancedSearch({ organizations: [1] } as any);

    expect(queryBuilder.addSelect).not.toHaveBeenCalled();
    expect(queryBuilder.orderBy).toHaveBeenCalledWith('title', 'ASC');
  });
});
