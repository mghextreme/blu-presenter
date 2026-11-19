import {
  isAutoReference,
  mergeScheduleReferences,
  presentScheduleReferences,
} from '../schedule-references';

describe('schedule references', () => {
  const storedAuto = {
    url: 'https://open.spotify.com/playlist/pl1',
    name: 'Sunday',
    source: 'spotify-auto' as const,
    syncedBy: 42,
    syncedByName: 'Matias',
    tracksHash: 'hash-1',
    syncedAt: '2026-11-01T00:00:00Z',
  };

  describe('isAutoReference', () => {
    it('only accepts objects with a string source', () => {
      expect(isAutoReference(storedAuto)).toBe(true);
      expect(isAutoReference({ url: 'https://a.example' })).toBe(false);
      expect(isAutoReference(null)).toBe(false);
      expect(isAutoReference('spotify-auto')).toBe(false);
    });
  });

  describe('mergeScheduleReferences', () => {
    it('keeps the stored metadata of auto references, ignoring client values', () => {
      const result = mergeScheduleReferences(
        [
          { url: 'https://a.example', name: 'A' },
          {
            url: 'https://open.spotify.com/playlist/someone-elses',
            source: 'spotify-auto',
          },
        ],
        [storedAuto],
      );

      expect(result).toEqual([
        { url: 'https://a.example', name: 'A' },
        storedAuto,
      ]);
    });

    it('drops auto references that are not stored (cannot be forged)', () => {
      const result = mergeScheduleReferences(
        [
          {
            url: 'https://open.spotify.com/playlist/x',
            source: 'spotify-auto',
          },
        ],
        [],
      );
      expect(result).toEqual([]);
    });

    it('keeps stored auto references the client omitted', () => {
      const result = mergeScheduleReferences(
        [{ url: 'https://a.example' }],
        [storedAuto],
      );
      expect(result).toEqual([{ url: 'https://a.example' }, storedAuto]);
    });

    it('never persists the per-response syncedByMe flag', () => {
      const result = mergeScheduleReferences(
        [{ url: storedAuto.url, source: 'spotify-auto' }],
        [{ ...storedAuto, syncedByMe: true }],
      );
      expect(result[0]).not.toHaveProperty('syncedByMe');
    });
  });

  describe('presentScheduleReferences', () => {
    it('replaces the owner id with syncedByMe', () => {
      const [mine] = presentScheduleReferences([storedAuto], 42);
      expect(mine).toMatchObject({ syncedByMe: true, syncedByName: 'Matias' });
      expect(mine).not.toHaveProperty('syncedBy');

      const [theirs] = presentScheduleReferences([storedAuto], 7);
      expect(theirs).toMatchObject({ syncedByMe: false });
    });

    it('hides the owner from anonymous viewers', () => {
      const [reference] = presentScheduleReferences([storedAuto], undefined);
      expect(reference).not.toHaveProperty('syncedBy');
      expect(reference).not.toHaveProperty('syncedByName');
      expect(reference).toMatchObject({ syncedByMe: false });
    });

    it('drops malformed entries instead of crashing', () => {
      expect(
        presentScheduleReferences(
          [null, 'x', 3, { name: 'no url' }, { url: 'https://a.example' }],
          42,
        ),
      ).toEqual([{ url: 'https://a.example' }]);
    });
  });
});
