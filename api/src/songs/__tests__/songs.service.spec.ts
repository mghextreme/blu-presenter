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
