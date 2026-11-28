import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { CreateSongDto } from '../create-song.dto';
import { UpdateSongDto } from '../update-song.dto';
import { CreateScheduleDto } from '../create-schedule.dto';
import { UpdateScheduleDto } from '../update-schedule.dto';
import { EditMemberDto } from '../edit-member.dto';
import { InviteMemberDto } from '../invite-member.dto';
import {
  SetScheduleBroadcastDto,
  SetSelectionBroadcastDto,
} from '../broadcast.dto';

// Mirrors the global pipe registered in main.ts.
const pipe = new ValidationPipe({ whitelist: true, transform: true });
const validate = (metatype: any, value: object) =>
  pipe.transform(value, { type: 'body', metatype });

describe('song blocks', () => {
  const block = {
    id: 0,
    name: 'Verse 1',
    acronym: 'V1',
    lines: [
      { type: 'chords', content: 'G  D' },
      { type: 'lyrics', content: 'Amazing grace' },
    ],
  };

  it.each([CreateSongDto, UpdateSongDto])(
    '%p keeps every block field the editor sends',
    async (metatype) => {
      const result = await validate(metatype, {
        id: 1,
        title: 'Song',
        blocks: [block, { lines: [] }],
      });
      expect(JSON.parse(JSON.stringify(result.blocks))).toEqual([
        block,
        { lines: [] },
      ]);
    },
  );

  it.each([
    ['a block without lines', [{ name: 'V' }]],
    ['an unknown line type', [{ lines: [{ type: 'bass', content: 'x' }] }]],
    ['a line without content', [{ lines: [{ type: 'lyrics' }] }]],
    ['a non-object block', ['verse']],
  ])('rejects %s', async (_label, blocks) => {
    for (const metatype of [CreateSongDto, UpdateSongDto]) {
      await expect(
        validate(metatype, { id: 1, title: 'Song', blocks }),
      ).rejects.toThrow(BadRequestException);
    }
  });
});

describe('schedule items', () => {
  const items = [
    { type: 'song', id: 5, secret: 's', title: 'T', artist: null },
    { type: 'text', title: 'Welcome', subtitle: 'Sunday' },
    { type: 'comment', title: 'Pray' },
  ];

  it.each([CreateScheduleDto, UpdateScheduleDto])(
    '%p keeps every item field the editor sends',
    async (metatype) => {
      const result = await validate(metatype, { title: 'Sunday', items });
      expect(JSON.parse(JSON.stringify(result.items))).toEqual(items);
    },
  );

  it.each([
    ['a song without id', [{ type: 'song', title: 'T' }]],
    ['an unknown type', [{ type: 'video', title: 'T' }]],
    ['a null item', [null]],
  ])('rejects %s', async (_label, invalidItems) => {
    for (const metatype of [CreateScheduleDto, UpdateScheduleDto]) {
      await expect(
        validate(metatype, { title: 'Sunday', items: invalidItems }),
      ).rejects.toThrow(BadRequestException);
    }
  });
});

describe('member roles', () => {
  it.each([EditMemberDto, InviteMemberDto])(
    '%p accepts a known role',
    async (metatype) => {
      const result = await validate(metatype, {
        email: 'a@example.com',
        role: 'member',
      });
      expect(result.role).toBe('member');
    },
  );

  it.each([EditMemberDto, InviteMemberDto])(
    '%p rejects an unknown role',
    async (metatype) => {
      await expect(
        validate(metatype, { email: 'a@example.com', role: 'superuser' }),
      ).rejects.toThrow(BadRequestException);
    },
  );
});

describe('broadcast payloads', () => {
  it('rejects schedule entries that are not objects', async () => {
    await expect(
      validate(SetScheduleBroadcastDto, { schedule: [null] }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects a selection with non-integer positions', async () => {
    await expect(
      validate(SetSelectionBroadcastDto, { selection: { slide: 'one' } }),
    ).rejects.toThrow(BadRequestException);
  });

  it('accepts a partial selection', async () => {
    const result = await validate(SetSelectionBroadcastDto, {
      selection: { slide: 1, part: 0 },
    });
    expect({ ...result.selection }).toEqual({ slide: 1, part: 0 });
  });
});
