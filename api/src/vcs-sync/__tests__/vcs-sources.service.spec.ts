import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { VcsSource } from '../../entities';
import { PathFilterService } from '../path-filter.service';
import { VcsSourcesService } from '../vcs-sources.service';
import { VcsSyncError } from '../vcs-sync.errors';

describe('VcsSourcesService', () => {
  let service: VcsSourcesService;

  const mockSourcesRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn((input: Partial<VcsSource>) => input),
    save: jest.fn(async (source: Partial<VcsSource>) => source),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VcsSourcesService,
        PathFilterService,
        {
          provide: getRepositoryToken(VcsSource),
          useValue: mockSourcesRepository,
        },
      ],
    }).compile();

    service = await module.resolve<VcsSourcesService>(VcsSourcesService);
  });

  describe('create', () => {
    it('requires a name and a repo', async () => {
      await expect(service.create({ orgId: null })).rejects.toThrow(
        VcsSyncError,
      );
      await expect(
        service.create({ name: 'x', repo: 'not-a-repo', orgId: null }),
      ).rejects.toThrow(/owner\/name/);
      await expect(
        service.create({ name: 'x', repo: 'owner/songs' }),
      ).rejects.toThrow(/Target is required/);
    });

    it('normalizes the basePath and applies defaults', async () => {
      const source = await service.create({
        name: 'public-archive',
        repo: 'owner/songs',
        orgId: null,
        basePath: '/songs/',
      });

      expect(source).toMatchObject({
        name: 'public-archive',
        repo: 'owner/songs',
        basePath: 'songs',
        orgId: null,
        branch: 'main',
        includePatterns: ['**/*.md'],
        excludePatterns: [],
        allowedActions: ['add', 'update', 'remove'],
        enabled: true,
      });
    });

    it('rejects gitignore-style negation patterns', async () => {
      await expect(
        service.create({
          name: 'public-archive',
          repo: 'owner/songs',
          orgId: null,
          excludePatterns: ['!drafts/published/**'],
        }),
      ).rejects.toThrow(/negation/);
    });

    it('rejects unknown actions', async () => {
      await expect(
        service.create({
          name: 'public-archive',
          repo: 'owner/songs',
          orgId: null,
          allowedActions: ['add', 'publish'],
        }),
      ).rejects.toThrow(/publish/);
    });

    it('requires a valid name', async () => {
      await expect(
        service.create({ name: 'a b', repo: 'owner/songs', orgId: null }),
      ).rejects.toThrow(/--name/);
    });
  });

  describe('update', () => {
    it('merges only the provided fields', async () => {
      mockSourcesRepository.findOne.mockResolvedValue({
        id: 1,
        name: 'org12',
        repo: 'owner/songs',
        branch: 'main',
        basePath: 'orgs/12',
        orgId: 12,
        includePatterns: ['**/*.md'],
        excludePatterns: [],
        allowedActions: ['add'],
        enabled: true,
      });

      const source = await service.update('org12', {
        allowedActions: ['add', 'update'],
      });

      expect(source.allowedActions).toEqual(['add', 'update']);
      expect(source.branch).toBe('main');
      expect(source.orgId).toBe(12);
    });

    it('switches the target to the public archive with --public', async () => {
      mockSourcesRepository.findOne.mockResolvedValue({
        id: 1,
        name: 'org12',
        repo: 'owner/songs',
        orgId: 12,
        allowedActions: ['add'],
      });

      const source = await service.update('org12', { orgId: null });

      expect(source.orgId).toBeNull();
    });
  });

  describe('resolve', () => {
    it('resolves by name and throws a clear error when missing', async () => {
      mockSourcesRepository.findOne.mockResolvedValue(null);

      await expect(service.resolve('nope')).rejects.toThrow(/not found/);
    });
  });
});
