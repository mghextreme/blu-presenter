import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { CreateSongDto } from '../create-song.dto';
import { UpdateSongDto } from '../update-song.dto';

describe('song reference validation', () => {
  const pipe = new ValidationPipe({ whitelist: true, transform: true });
  const base = { title: 'Song', blocks: [] };

  const validate = (metatype: any, value: object) =>
    pipe.transform(value, { type: 'body', metatype });

  it.each([CreateSongDto, UpdateSongDto])(
    '%p accepts http(s) reference URLs',
    async (metatype) => {
      const result = await validate(metatype, {
        ...base,
        id: 1,
        references: [
          { url: 'https://open.spotify.com/track/x', name: 'Spotify' },
          { url: 'http://example.com' },
        ],
      });
      expect(result.references).toHaveLength(2);
    },
  );

  it.each([
    'javascript:alert(1)',
    'JAVASCRIPT:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'example.com',
  ])('rejects the reference URL %p', async (url) => {
    for (const metatype of [CreateSongDto, UpdateSongDto]) {
      await expect(
        validate(metatype, { ...base, id: 1, references: [{ url }] }),
      ).rejects.toThrow(BadRequestException);
    }
  });
});
