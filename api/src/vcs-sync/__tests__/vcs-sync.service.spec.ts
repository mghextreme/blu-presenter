import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { DataSource, EntityManager } from 'typeorm';
import { Song, SongVcsFile, VcsSource } from '../../entities';
import { SongTextFormatService } from '../../songs/text-format/song-text-format.service';
import { PathFilterService } from '../path-filter.service';
import { VCS_CLIENT } from '../vcs-client.provider';
import { VcsSyncService } from '../vcs-sync.service';

const VALID_TEXT =
  '---\nschemaVersion: 1\nlanguage: en\n---\n\n# Amazing Grace\n## John Newton\n\n### [V1] Verse 1\n- Amazing grace\n';

function makeSource(overrides: Partial<VcsSource> = {}): VcsSource {
  return {
    id: 1,
    name: 'public-archive',
    repo: 'owner/songs',
    branch: 'main',
    basePath: '',
    orgId: null,
    includePatterns: ['**/*.md'],
    excludePatterns: [],
    allowedActions: ['add', 'update', 'remove'],
    enabled: true,
    lastSyncedCommitSha: null,
    lastSyncedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as VcsSource;
}

describe('VcsSyncService', () => {
  let service: VcsSyncService;

  const mockClient = {
    resolveHead: jest.fn(),
    getTree: jest.fn(),
    getBlob: jest.fn(),
  };
  const mockSongsRepository = { find: jest.fn() };
  const mockLinksRepository = { find: jest.fn(), findOne: jest.fn() };
  const mockManagerSongsRepo = { find: jest.fn() };
  const mockManagerLinksRepo = { find: jest.fn(), findOne: jest.fn() };
  const mockManager = {
    query: jest.fn(),
    find: jest.fn(),
    getRepository: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };
  const mockDataSource = { transaction: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockManager.getRepository.mockImplementation((entity: { name?: string }) =>
      entity === Song ? mockManagerSongsRepo : mockManagerLinksRepo,
    );
    mockManager.insert.mockResolvedValue({ raw: [{ id: 42 }] });
    mockManager.update.mockResolvedValue({});
    mockManager.delete.mockResolvedValue({});
    mockManager.query.mockResolvedValue([]);
    mockManager.find.mockImplementation((entity: unknown) =>
      entity === Song
        ? mockManagerSongsRepo.find()
        : mockManagerLinksRepo.find(),
    );
    mockDataSource.transaction.mockImplementation(
      async (callback: (manager: EntityManager) => unknown) =>
        callback(mockManager as never),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VcsSyncService,
        PathFilterService,
        SongTextFormatService,
        { provide: getRepositoryToken(Song), useValue: mockSongsRepository },
        {
          provide: getRepositoryToken(SongVcsFile),
          useValue: mockLinksRepository,
        },
        { provide: VCS_CLIENT, useValue: mockClient },
        { provide: DataSource, useValue: mockDataSource },
      ],
    }).compile();

    service = await module.resolve<VcsSyncService>(VcsSyncService);
  });

  function stubRepoState(
    head: {
      commitSha: string;
      treeSha: string;
    },
    tree: { path: string; sha: string; type: string }[],
    links: Partial<SongVcsFile>[],
  ) {
    mockClient.resolveHead.mockResolvedValue(head);
    mockClient.getTree.mockResolvedValue(tree);
    mockClient.getBlob.mockResolvedValue(Buffer.from(VALID_TEXT, 'utf-8'));
    mockLinksRepository.find.mockResolvedValue(links);
    mockLinksRepository.findOne.mockResolvedValue(links[0] ?? null);
    mockManagerLinksRepo.find.mockResolvedValue(links);
    mockManagerLinksRepo.findOne.mockResolvedValue(links[0] ?? null);
    mockSongsRepository.find.mockResolvedValue([]);
    mockManagerSongsRepo.find.mockResolvedValue([]);
  }

  describe('syncSource (dry run)', () => {
    it('plans adds without fetching content or writing anything', async () => {
      stubRepoState(
        { commitSha: 'c1', treeSha: 't1' },
        [{ path: 'en/new.md', sha: 'b1', type: 'blob' }],
        [],
      );

      const report = await service.syncSource(makeSource(), { apply: false });

      expect(report.dryRun).toBe(true);
      expect(report.commitSha).toBe('c1');
      expect(report.entries[0]).toMatchObject({
        action: 'add',
        path: 'en/new.md',
        status: 'planned',
      });
      expect(mockClient.getBlob).not.toHaveBeenCalled();
      expect(mockDataSource.transaction).not.toHaveBeenCalled();
    });
  });

  describe('syncSource (apply)', () => {
    it('adds public archive songs without a secret', async () => {
      stubRepoState(
        { commitSha: 'c1', treeSha: 't1' },
        [{ path: 'en/new.md', sha: 'b1', type: 'blob' }],
        [],
      );

      const report = await service.syncSource(makeSource(), { apply: true });

      expect(report.dryRun).toBe(false);
      expect(report.entries[0]).toMatchObject({
        action: 'add',
        status: 'applied',
        songId: 42,
      });

      const songInsert = mockManager.insert.mock.calls.find(
        ([entity]) => entity === Song,
      );
      expect(songInsert[1]).toMatchObject({
        title: 'Amazing Grace',
        artist: 'John Newton',
        language: 'en',
        orgId: null,
        secret: null,
      });

      const linkInsert = mockManager.insert.mock.calls.find(
        ([entity]) => entity === SongVcsFile,
      );
      expect(linkInsert[1]).toMatchObject({
        songId: 42,
        sourceId: 1,
        path: 'en/new.md',
        blobSha: 'b1',
        contentHash: expect.any(String),
      });

      expect(mockManager.query).toHaveBeenCalledWith(
        'SELECT pg_advisory_xact_lock($1)',
        [410000001],
      );
      expect(mockManager.update).toHaveBeenCalledWith(
        VcsSource,
        1,
        expect.objectContaining({ lastSyncedCommitSha: 'c1' }),
      );
      const runInsert = mockManager.insert.mock.calls.find(
        ([entity]) => (entity as { name?: string }).name === 'VcsSyncRun',
      );
      expect(runInsert).toBeDefined();
    });

    it('adds organization songs with a generated secret', async () => {
      stubRepoState(
        { commitSha: 'c1', treeSha: 't1' },
        [{ path: 'en/new.md', sha: 'b1', type: 'blob' }],
        [],
      );

      await service.syncSource(makeSource({ orgId: 7 }), { apply: true });

      const songInsert = mockManager.insert.mock.calls.find(
        ([entity]) => entity === Song,
      );
      expect(songInsert[1]).toMatchObject({
        orgId: 7,
        secret: expect.stringMatching(/^[A-Za-z0-9]{10}$/),
      });
    });

    it('flags updates that overwrite local changes', async () => {
      const song = {
        id: 7,
        title: 'Amazing Grace',
        artist: 'John Newton',
        language: 'en',
        blocks: [],
        references: [],
      };
      stubRepoState(
        { commitSha: 'c1', treeSha: 't1' },
        [{ path: 'en/song.md', sha: 'b2', type: 'blob' }],
        [
          {
            path: 'en/song.md',
            songId: 7,
            blobSha: 'b1',
            contentHash: 'outdated-hash',
          },
        ],
      );
      mockManagerLinksRepo.find.mockResolvedValue([
        {
          path: 'en/song.md',
          songId: 7,
          blobSha: 'b1',
          contentHash: 'outdated-hash',
        },
      ]);
      mockManagerSongsRepo.find.mockResolvedValue([song]);
      mockSongsRepository.find.mockResolvedValue([song]);

      const report = await service.syncSource(makeSource(), { apply: true });

      expect(report.entries[0]).toMatchObject({
        action: 'update',
        status: 'applied',
        overwritesLocalChanges: true,
      });
      expect(mockManager.update).toHaveBeenCalledWith(
        Song,
        7,
        expect.objectContaining({ title: 'Amazing Grace' }),
      );
    });

    it('does not flag updates when the database content matches the last sync', async () => {
      const song = {
        id: 7,
        title: 'Amazing Grace',
        artist: 'John Newton',
        language: 'en',
        blocks: [],
        references: [],
      };
      const format = new SongTextFormatService();
      const expectedHash = createHash('sha256')
        .update(
          format.encode({
            title: song.title,
            artist: song.artist,
            language: song.language,
            blocks: song.blocks,
            references: song.references,
          }),
        )
        .digest('hex');
      const link = {
        path: 'en/song.md',
        songId: 7,
        blobSha: 'b1',
        contentHash: expectedHash,
      };
      stubRepoState(
        { commitSha: 'c1', treeSha: 't1' },
        [{ path: 'en/song.md', sha: 'b2', type: 'blob' }],
        [link],
      );
      mockManagerLinksRepo.find.mockResolvedValue([link]);
      mockManagerSongsRepo.find.mockResolvedValue([song]);
      mockSongsRepository.find.mockResolvedValue([song]);

      const report = await service.syncSource(makeSource(), { apply: true });

      expect(report.entries[0].action).toBe('update');
      expect(report.entries[0].overwritesLocalChanges).toBe(false);
    });

    it('reports parse failures without inserting anything', async () => {
      stubRepoState(
        { commitSha: 'c1', treeSha: 't1' },
        [{ path: 'en/broken.md', sha: 'b1', type: 'blob' }],
        [],
      );
      mockClient.getBlob.mockResolvedValue(
        Buffer.from('this is not markdown', 'utf-8'),
      );

      const report = await service.syncSource(makeSource(), { apply: true });

      expect(report.entries[0]).toMatchObject({
        action: 'add',
        status: 'failed',
        message: expect.any(String),
      });
      expect(
        mockManager.insert.mock.calls.find(([entity]) => entity === Song),
      ).toBeUndefined();
      const runInsert = mockManager.insert.mock.calls.find(
        ([entity]) => (entity as { name?: string }).name === 'VcsSyncRun',
      );
      expect(runInsert[1]).toMatchObject({ failed: 1, status: 'failed' });
    });

    it('leaves the song in place when removal is not permitted', async () => {
      stubRepoState(
        { commitSha: 'c1', treeSha: 't1' },
        [],
        [{ path: 'en/gone.md', songId: 9, blobSha: 'b1', contentHash: null }],
      );
      mockManagerLinksRepo.find.mockResolvedValue([
        { path: 'en/gone.md', songId: 9, blobSha: 'b1', contentHash: null },
      ]);

      const report = await service.syncSource(
        makeSource({ allowedActions: ['add', 'update'] }),
        { apply: true },
      );

      expect(report.entries[0]).toMatchObject({
        action: 'remove',
        status: 'skipped',
        message: expect.stringContaining('remove not permitted'),
      });
      expect(mockManager.delete).not.toHaveBeenCalled();
    });

    it('renames the link instead of removing and re-adding the song', async () => {
      stubRepoState(
        { commitSha: 'c1', treeSha: 't1' },
        [{ path: 'en/new-name.md', sha: 'b1', type: 'blob' }],
        [
          {
            path: 'en/old-name.md',
            songId: 5,
            blobSha: 'b1',
            contentHash: 'x',
          },
        ],
      );
      mockManagerLinksRepo.find.mockResolvedValue([
        { path: 'en/old-name.md', songId: 5, blobSha: 'b1', contentHash: 'x' },
      ]);

      const report = await service.syncSource(makeSource(), { apply: true });

      expect(report.entries[0]).toMatchObject({
        action: 'rename',
        path: 'en/new-name.md',
        previousPath: 'en/old-name.md',
        status: 'applied',
        songId: 5,
      });
      expect(mockManager.delete).not.toHaveBeenCalled();
      expect(
        mockManager.insert.mock.calls.find(([entity]) => entity === Song),
      ).toBeUndefined();
      expect(mockClient.getBlob).not.toHaveBeenCalled();
    });

    it('aborts the transaction in strict mode on the first failure', async () => {
      stubRepoState(
        { commitSha: 'c1', treeSha: 't1' },
        [{ path: 'en/broken.md', sha: 'b1', type: 'blob' }],
        [],
      );
      mockClient.getBlob.mockResolvedValue(
        Buffer.from('this is not markdown', 'utf-8'),
      );

      await expect(
        service.syncSource(makeSource(), { apply: true, strict: true }),
      ).rejects.toThrow(/Aborted/);
    });
  });

  describe('syncSingleFile', () => {
    it('skips an unchanged file and reports why', async () => {
      stubRepoState(
        { commitSha: 'c1', treeSha: 't1' },
        [{ path: 'en/song.md', sha: 'b1', type: 'blob' }],
        [{ path: 'en/song.md', songId: 7, blobSha: 'b1', contentHash: 'x' }],
      );

      const report = await service.syncSingleFile(makeSource(), 'en/song.md', {
        apply: false,
      });

      expect(report.entries[0]).toMatchObject({
        action: 'skip',
        status: 'skipped',
        message: expect.stringContaining('unchanged'),
      });
    });

    it('force re-applies an unchanged file', async () => {
      const link = {
        path: 'en/song.md',
        songId: 7,
        blobSha: 'b1',
        contentHash: null,
      };
      stubRepoState(
        { commitSha: 'c1', treeSha: 't1' },
        [{ path: 'en/song.md', sha: 'b1', type: 'blob' }],
        [link],
      );
      mockManagerLinksRepo.find.mockResolvedValue([link]);

      const report = await service.syncSingleFile(makeSource(), 'en/song.md', {
        apply: true,
        force: true,
      });

      expect(report.entries[0]).toMatchObject({
        action: 'update',
        status: 'applied',
      });
      expect(mockManager.update).toHaveBeenCalledWith(
        Song,
        7,
        expect.objectContaining({ title: 'Amazing Grace' }),
      );
      expect(
        mockManager.update.mock.calls.find(([entity]) => entity === VcsSource),
      ).toBeUndefined();
    });

    it('accepts repo-relative paths outside the basePath and maps them', async () => {
      const source = makeSource({ basePath: 'songs' });
      stubRepoState(
        { commitSha: 'c1', treeSha: 't1' },
        [{ path: 'songs/en/song.md', sha: 'b1', type: 'blob' }],
        [],
      );

      const report = await service.syncSingleFile(source, 'songs/en/song.md', {
        apply: false,
      });

      expect(report.entries[0]).toMatchObject({
        action: 'add',
        path: 'en/song.md',
      });
    });

    it('fails with a clear error when the file is not in the tree', async () => {
      stubRepoState({ commitSha: 'c1', treeSha: 't1' }, [], []);

      await expect(
        service.syncSingleFile(makeSource(), 'en/missing.md', { apply: false }),
      ).rejects.toThrow(/File not found/);
    });
  });
});
