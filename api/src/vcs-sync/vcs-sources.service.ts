import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { VcsSource } from 'src/entities';
import { VcsSyncError } from './vcs-sync.errors';
import { PathFilterService } from './path-filter.service';

export const ALLOWED_ACTIONS = ['add', 'update', 'remove'] as const;

export interface VcsSourceInput {
  name?: string;
  repo?: string;
  branch?: string;
  basePath?: string;
  orgId?: number | null;
  includePatterns?: string[];
  excludePatterns?: string[];
  allowedActions?: string[];
  enabled?: boolean;
}

const NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/;
const REPO_PATTERN = /^[^/\s]+\/[^/\s]+$/;

@Injectable()
export class VcsSourcesService {
  constructor(
    @InjectRepository(VcsSource)
    private readonly sourcesRepository: Repository<VcsSource>,
    private readonly pathFilter: PathFilterService,
  ) {}

  list(): Promise<VcsSource[]> {
    return this.sourcesRepository.find({ order: { name: 'asc' } });
  }

  async resolve(nameOrId: string): Promise<VcsSource> {
    const asNumber = Number(nameOrId);
    const source =
      Number.isInteger(asNumber) && String(asNumber) === String(nameOrId)
        ? await this.sourcesRepository.findOne({ where: { id: asNumber } })
        : await this.sourcesRepository.findOne({ where: { name: nameOrId } });
    if (!source) {
      throw new VcsSyncError(`VCS source "${nameOrId}" not found`);
    }
    return source;
  }

  async create(input: VcsSourceInput): Promise<VcsSource> {
    if (!input.name || !NAME_PATTERN.test(input.name)) {
      throw new VcsSyncError(
        'A valid --name is required (letters, digits, ".", "_" and "-")',
      );
    }
    if (!input.repo || !REPO_PATTERN.test(input.repo)) {
      throw new VcsSyncError(
        'A valid --repo is required, in the "owner/name" format',
      );
    }
    if (input.orgId === undefined) {
      throw new VcsSyncError(
        'Target is required: pass --public for the public archive or --org <id> for an organization',
      );
    }
    const source = this.sourcesRepository.create({
      name: input.name,
      repo: input.repo,
      branch: input.branch ?? 'main',
      basePath: input.basePath
        ? this.pathFilter.normalizeBasePath(input.basePath)
        : '',
      orgId: input.orgId,
      includePatterns: this.validatePatterns(
        input.includePatterns,
        '**/*.md',
        input.name,
        'include',
      ),
      excludePatterns: this.validatePatterns(
        input.excludePatterns,
        'README.md',
        input.name,
        'exclude',
      ),
      allowedActions: this.validateActions(input.allowedActions),
      enabled: input.enabled ?? true,
    });

    try {
      return await this.sourcesRepository.save(source);
    } catch (error) {
      throw this.mapDbError(error, `source "${input.name}"`);
    }
  }

  async update(nameOrId: string, input: VcsSourceInput): Promise<VcsSource> {
    const source = await this.resolve(nameOrId);

    if (input.name !== undefined) {
      if (!NAME_PATTERN.test(input.name)) {
        throw new VcsSyncError('Invalid --name');
      }
      source.name = input.name;
    }
    if (input.repo !== undefined) {
      if (!REPO_PATTERN.test(input.repo)) {
        throw new VcsSyncError(
          'Invalid --repo, expected the "owner/name" format',
        );
      }
      source.repo = input.repo;
    }
    if (input.branch !== undefined) {
      source.branch = input.branch;
    }
    if (input.basePath !== undefined) {
      source.basePath = this.pathFilter.normalizeBasePath(input.basePath);
    }
    if (input.orgId !== undefined) {
      source.orgId = input.orgId;
    }
    if (input.includePatterns !== undefined) {
      source.includePatterns = this.validatePatterns(
        input.includePatterns,
        '**/*.md',
        source.name,
        'include',
      );
    }
    if (input.excludePatterns !== undefined) {
      source.excludePatterns = this.validatePatterns(
        input.excludePatterns,
        'README.md',
        source.name,
        'exclude',
      );
    }
    if (input.allowedActions !== undefined) {
      source.allowedActions = this.validateActions(input.allowedActions);
    }
    if (input.enabled !== undefined) {
      source.enabled = input.enabled;
    }

    try {
      return await this.sourcesRepository.save(source);
    } catch (error) {
      throw this.mapDbError(error, `source "${source.name}"`);
    }
  }

  async remove(nameOrId: string): Promise<void> {
    const source = await this.resolve(nameOrId);
    await this.sourcesRepository.delete(source.id);
  }

  private validateActions(actions?: string[]): string[] {
    if (!actions) {
      return ['add', 'update', 'remove'];
    }
    const invalid = actions.filter(
      (action) =>
        !ALLOWED_ACTIONS.includes(action as (typeof ALLOWED_ACTIONS)[number]),
    );
    if (invalid.length > 0) {
      throw new VcsSyncError(
        `Invalid --actions: ${invalid.join(', ')}. Allowed values: ${ALLOWED_ACTIONS.join(', ')}`,
      );
    }
    return actions;
  }

  private validatePatterns(
    patterns: string[] | undefined,
    fallback: string,
    sourceName: string,
    kind: 'include' | 'exclude',
  ): string[] {
    if (!patterns) {
      return fallback === '' ? [] : [fallback];
    }
    for (const pattern of patterns) {
      if (typeof pattern !== 'string' || pattern.trim() === '') {
        throw new VcsSyncError(
          `Invalid --${kind}: patterns must be non-empty strings`,
        );
      }
      if (pattern.startsWith('!')) {
        throw new VcsSyncError(
          `Invalid --${kind}: negation patterns ("${pattern}") are not supported. Source "${sourceName}" uses separate include and exclude lists`,
        );
      }
    }
    return patterns;
  }

  private mapDbError(error: unknown, subject: string): Error {
    if (error instanceof QueryFailedError) {
      const code = (error.driverError as { code?: string } | undefined)?.code;
      if (code === '23505') {
        return new VcsSyncError(`${subject} already exists`);
      }
      if (code === '23503') {
        return new VcsSyncError(
          `${subject} references an organization that does not exist`,
        );
      }
    }
    return error as Error;
  }
}
