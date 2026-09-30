import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { SongsController } from '../songs.controller';
import { SongsService } from '../songs.service';
import { SongTextFormatService } from '../text-format/song-text-format.service';

describe('SongsController export', () => {
  let app: INestApplication;
  const findOneInAnyOrgOrBySecret = jest.fn();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SongsController],
      providers: [
        { provide: SongsService, useValue: { findOneInAnyOrgOrBySecret } },
        SongTextFormatService,
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns the markdown export with download headers', async () => {
    findOneInAnyOrgOrBySecret.mockResolvedValue({
      id: 7,
      title: 'Ámazing Gráce',
      artist: 'John Newton',
      language: 'en',
      blocks: [],
      references: [],
      organization: null,
    });

    const response = await request(app.getHttpServer())
      .get('/songs/7/export?secret=topsecret')
      .expect(200);

    expect(response.headers['content-type']).toContain('text/markdown');
    expect(response.headers['content-disposition']).toContain('attachment');
    expect(response.headers['content-disposition']).toContain(
      'john-newton-amazing-grace.md',
    );
    expect(response.text).toBe(
      '---\nschemaVersion: 1\nlanguage: en\n---\n\n# Ámazing Gráce\n## John Newton\n',
    );
    expect(findOneInAnyOrgOrBySecret).toHaveBeenCalledWith('7', 'topsecret');
  });

  it('falls back to a song-id filename when the title has no latin characters', async () => {
    findOneInAnyOrgOrBySecret.mockResolvedValue({
      id: 42,
      title: '못',
      artist: '못',
      language: null,
      blocks: [],
      references: [],
      organization: null,
    });

    const response = await request(app.getHttpServer())
      .get('/songs/42/export')
      .expect(200);
    expect(response.headers['content-disposition']).toContain('song-42.md');
  });

  it('returns 404 when the song is not accessible', async () => {
    findOneInAnyOrgOrBySecret.mockResolvedValue(null);
    await request(app.getHttpServer()).get('/songs/999/export').expect(404);
  });
});
