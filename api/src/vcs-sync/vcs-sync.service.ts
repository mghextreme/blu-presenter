import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash } from 'crypto';
import { DataSource, EntityManager, In, Repository } from 'typeorm';
import { Song, SongVcsFile, VcsSource, VcsSyncRun } from 'src/entities';
import { generateRandomSecret } from 'src/utils/secret';
import {
  SongExportData,
  SongTextFormatService,
} from 'src/songs/text-format/song-text-format.service';
import { VcsClient } from './vcs-client.interface';
import { VCS_CLIENT } from './vcs-client.provider';
import { PathFilterService } from './path-filter.service';
import { planSync, PlannedChange } from './sync-planner';
import { SyncReport, SyncReportEntry } from './sync-report';
import { VcsSyncError } from './vcs-sync.errors';

const ADVISORY_LOCK_OFFSET = 410000000;

export interface SyncOptions {
  apply: boolean;
  strict?: boolean;
}

export interface SyncSingleOptions extends SyncOptions {
  force?: boolean;
}

@Injectable()
export class VcsSyncService {
  private readonly logger = new Logger(VcsSyncService.name);

  constructor(
    @InjectRepository(Song)
    private readonly songsRepository: Repository<Song>,
    @InjectRepository(SongVcsFile)
    private readonly linksRepository: Repository<SongVcsFile>,
    @Inject(VCS_CLIENT) private readonly client: VcsClient,
    private readonly dataSource: DataSource,
    private readonly pathFilter: PathFilterService,
    private readonly songTextFormat: SongTextFormatService,
  ) {}

  async syncSource(
    source: VcsSource,
    options: SyncOptions,
  ): Promise<SyncReport> {
    if (!source.enabled) {
      throw new VcsSyncError(`Source "${source.name}" is disabled`);
    }

    const head = await this.client.resolveHead(source.repo, source.branch);
    const treeFiles = await this.loadTreeFiles(source, head.treeSha);

    if (!options.apply) {
      const links = await this.linksRepository.find({
        where: { sourceId: source.id },
      });
      const localChanges = await this.detectLocalChanges(
        links,
        this.songsRepository,
      );
      const plan = planSync({
        treeFiles,
        links,
        allowedActions: source.allowedActions,
        localChanges,
      });
      return this.toReport(
        source,
        head.commitSha,
        this.toPlannedEntries(plan),
        true,
      );
    }

    const links = await this.linksRepository.find({
      where: { sourceId: source.id },
    });
    const localChanges = await this.detectLocalChanges(
      links,
      this.songsRepository,
    );
    const previewPlan = planSync({
      treeFiles,
      links,
      allowedActions: source.allowedActions,
      localChanges,
    });
    const contents = await this.fetchContents(source, previewPlan);

    return await this.dataSource.transaction(async (manager) => {
      await manager.query('SELECT pg_advisory_xact_lock($1)', [
        ADVISORY_LOCK_OFFSET + source.id,
      ]);
      const freshLinks = await manager.find(SongVcsFile, {
        where: { sourceId: source.id },
      });
      const freshLocalChanges = await this.detectLocalChanges(
        freshLinks,
        manager.getRepository(Song),
      );
      const plan = planSync({
        treeFiles,
        links: freshLinks,
        allowedActions: source.allowedActions,
        localChanges: freshLocalChanges,
      });
      return await this.applyEntries(manager, source, plan, contents, {
        ...options,
        commitSha: head.commitSha,
        touchLastSynced: true,
      });
    });
  }

  async syncSingleFile(
    source: VcsSource,
    path: string,
    options: SyncSingleOptions,
  ): Promise<SyncReport> {
    if (!source.enabled) {
      throw new VcsSyncError(`Source "${source.name}" is disabled`);
    }

    const relativePath = this.resolveInputPath(source, path);
    if (!this.pathFilter.isSongPath(relativePath)) {
      throw new VcsSyncError(
        `Only .md files can be synced (got "${relativePath}")`,
      );
    }

    const head = await this.client.resolveHead(source.repo, source.branch);
    const treeFiles = await this.loadTreeFiles(source, head.treeSha);
    const absolutePath = this.pathFilter.toAbsolutePath(relativePath, source);
    const treeFile = treeFiles.find((file) => file.path === relativePath);
    if (!treeFile) {
      throw new VcsSyncError(
        `File not found in ${source.repo}@${source.branch}: ${absolutePath}`,
      );
    }

    const buildPlan = async (
      linkRepo: Repository<SongVcsFile>,
      songRepo: Repository<Song>,
    ): Promise<PlannedChange[]> => {
      const link = await linkRepo.findOne({
        where: { sourceId: source.id, path: relativePath },
      });
      const localChanges = new Set<string>();
      if (link) {
        const changes = await this.detectLocalChanges([link], songRepo);
        if (changes.has(relativePath)) {
          localChanges.add(relativePath);
        }
      }
      const change: PlannedChange = link
        ? link.blobSha === treeFile.blobSha && !options.force
          ? {
              action: 'skip',
              path: relativePath,
              songId: link.songId,
              blobSha: link.blobSha,
              permitted: true,
              skipReason: 'unchanged (use --force to re-apply)',
              overwritesLocalChanges: false,
            }
          : {
              action: 'update',
              path: relativePath,
              songId: link.songId,
              blobSha: treeFile.blobSha,
              permitted: source.allowedActions.includes('update'),
              skipReason: source.allowedActions.includes('update')
                ? undefined
                : 'update not permitted for this source',
              overwritesLocalChanges: localChanges.has(relativePath),
            }
        : {
            action: 'add',
            path: relativePath,
            blobSha: treeFile.blobSha,
            permitted: source.allowedActions.includes('add'),
            skipReason: source.allowedActions.includes('add')
              ? undefined
              : 'add not permitted for this source',
            overwritesLocalChanges: false,
          };
      return [change];
    };

    if (!options.apply) {
      const plan = await buildPlan(this.linksRepository, this.songsRepository);
      return this.toReport(
        source,
        head.commitSha,
        this.toPlannedEntries(plan),
        true,
      );
    }

    const plan = await buildPlan(this.linksRepository, this.songsRepository);
    const contents = await this.fetchContents(source, plan);

    return await this.dataSource.transaction(async (manager) => {
      await manager.query('SELECT pg_advisory_xact_lock($1)', [
        ADVISORY_LOCK_OFFSET + source.id,
      ]);
      const freshPlan = await buildPlan(
        manager.getRepository(SongVcsFile),
        manager.getRepository(Song),
      );
      return await this.applyEntries(manager, source, freshPlan, contents, {
        ...options,
        commitSha: head.commitSha,
        touchLastSynced: false,
      });
    });
  }

  private async loadTreeFiles(
    source: VcsSource,
    treeSha: string,
  ): Promise<{ path: string; blobSha: string }[]> {
    const tree = await this.client.getTree(source.repo, treeSha);
    const files: { path: string; blobSha: string }[] = [];
    for (const entry of tree) {
      const relativePath = this.pathFilter.toRelativePath(entry.path, source);
      if (relativePath === null) {
        continue;
      }
      if (!this.pathFilter.matches(relativePath, source)) {
        continue;
      }
      files.push({ path: relativePath, blobSha: entry.sha });
    }
    return files;
  }

  private resolveInputPath(source: VcsSource, path: string): string {
    const underBasePath = this.pathFilter.toRelativePath(path, source);
    if (underBasePath !== null) {
      return underBasePath;
    }
    return path.replace(/^\/+/, '');
  }

  private async fetchContents(
    source: VcsSource,
    plan: PlannedChange[],
  ): Promise<Map<string, Buffer>> {
    const contents = new Map<string, Buffer>();
    for (const change of plan) {
      if (
        !change.permitted ||
        (change.action !== 'add' && change.action !== 'update')
      ) {
        continue;
      }
      if (!contents.has(change.blobSha)) {
        contents.set(
          change.blobSha,
          await this.client.getBlob(source.repo, change.blobSha),
        );
      }
    }
    return contents;
  }

  private async applyEntries(
    manager: EntityManager,
    source: VcsSource,
    plan: PlannedChange[],
    contents: Map<string, Buffer>,
    options: SyncOptions & {
      commitSha: string | null;
      touchLastSynced: boolean;
    },
  ): Promise<SyncReport> {
    const entries: SyncReportEntry[] = [];

    for (const change of plan) {
      try {
        entries.push(await this.applyChange(manager, source, change, contents));
      } catch (error) {
        if (options.strict) {
          throw new VcsSyncError(
            `Aborted on ${change.action} of "${change.path}": ${(error as Error).message}`,
          );
        }
        this.logger.warn(
          `Failed to ${change.action} "${change.path}": ${(error as Error).message}`,
        );
        entries.push({
          path: change.path,
          previousPath: change.previousPath,
          action: change.action,
          status: 'failed',
          songId: change.songId,
          message: (error as Error).message,
        });
      }
    }

    const counts = {
      added: entries.filter((e) => e.status === 'applied' && e.action === 'add')
        .length,
      updated: entries.filter(
        (e) =>
          e.status === 'applied' &&
          (e.action === 'update' || e.action === 'rename'),
      ).length,
      removed: entries.filter(
        (e) => e.status === 'applied' && e.action === 'remove',
      ).length,
      failed: entries.filter((e) => e.status === 'failed').length,
    };

    await manager.insert(VcsSyncRun, {
      sourceId: source.id,
      finishedAt: new Date(),
      baseCommitSha: options.commitSha,
      status: counts.failed > 0 ? 'failed' : 'completed',
      ...counts,
      details: entries.map((entry) => ({
        path: entry.previousPath ?? entry.path,
        action: entry.action,
        status: entry.status,
        songId: entry.songId,
        message: entry.message,
      })),
    });

    if (options.touchLastSynced) {
      await manager.update(VcsSource, source.id, {
        lastSyncedCommitSha: options.commitSha,
        lastSyncedAt: new Date(),
      });
    }

    return this.toReport(source, options.commitSha, entries, false);
  }

  private async applyChange(
    manager: EntityManager,
    source: VcsSource,
    change: PlannedChange,
    contents: Map<string, Buffer>,
  ): Promise<SyncReportEntry> {
    if (change.action === 'skip' || !change.permitted) {
      return {
        path: change.path,
        previousPath: change.previousPath,
        action: change.action,
        status: 'skipped',
        songId: change.songId,
        overwritesLocalChanges: change.overwritesLocalChanges,
        message: change.skipReason,
      };
    }

    switch (change.action) {
      case 'add': {
        const data = this.decodeContent(change, contents);
        const result = await manager.insert(Song, {
          title: data.title,
          artist: data.artist,
          language: data.language ?? null,
          blocks: data.blocks,
          references: data.references ?? [],
          secret: source.orgId == null ? null : generateRandomSecret(10),
          orgId: source.orgId,
        });
        const songId = Number(result.raw[0].id);
        await manager.insert(SongVcsFile, {
          songId,
          sourceId: source.id,
          path: change.path,
          blobSha: change.blobSha,
          contentHash: this.contentHashOfData(data),
          syncedAt: new Date(),
        });
        return {
          path: change.path,
          action: 'add',
          status: 'applied',
          songId,
          overwritesLocalChanges: false,
        };
      }
      case 'update': {
        const data = this.decodeContent(change, contents);
        await manager.update(Song, change.songId, {
          title: data.title,
          artist: data.artist,
          language: data.language ?? null,
          blocks: data.blocks,
          references: data.references ?? [],
        });
        await manager.update(
          SongVcsFile,
          { sourceId: source.id, path: change.path },
          {
            blobSha: change.blobSha,
            contentHash: this.contentHashOfData(data),
            syncedAt: new Date(),
          },
        );
        return {
          path: change.path,
          action: 'update',
          status: 'applied',
          songId: change.songId,
          overwritesLocalChanges: change.overwritesLocalChanges,
        };
      }
      case 'rename': {
        await manager.update(
          SongVcsFile,
          { sourceId: source.id, path: change.previousPath },
          { path: change.path, syncedAt: new Date() },
        );
        return {
          path: change.path,
          previousPath: change.previousPath,
          action: 'rename',
          status: 'applied',
          songId: change.songId,
          overwritesLocalChanges: false,
        };
      }
      case 'remove': {
        await manager.delete(Song, change.songId);
        return {
          path: change.path,
          action: 'remove',
          status: 'applied',
          songId: change.songId,
          overwritesLocalChanges: false,
        };
      }
    }
  }

  private decodeContent(
    change: PlannedChange,
    contents: Map<string, Buffer>,
  ): SongExportData {
    const content = contents.get(change.blobSha);
    if (!content) {
      throw new Error(
        'file content was not fetched (the repo changed during the sync) — run the sync again',
      );
    }
    const text = content.toString('utf-8').replace(/^\uFEFF/, '');
    return this.songTextFormat.decode(text);
  }

  private async detectLocalChanges(
    links: SongVcsFile[],
    songsRepository: Repository<Song>,
  ): Promise<Set<string>> {
    const changed = new Set<string>();
    const songIds = [...new Set(links.map((link) => link.songId))];
    if (songIds.length === 0) {
      return changed;
    }

    const songs = await songsRepository.find({
      select: {
        id: true,
        title: true,
        artist: true,
        language: true,
        blocks: true,
        references: true,
      },
      where: { id: In(songIds) },
    });
    const hashBySongId = new Map<number, string>();
    for (const song of songs) {
      hashBySongId.set(song.id, this.contentHashOfSong(song));
    }

    for (const link of links) {
      const hash = hashBySongId.get(link.songId);
      if (
        hash !== undefined &&
        link.contentHash !== null &&
        link.contentHash !== hash
      ) {
        changed.add(link.path);
      }
    }
    return changed;
  }

  private contentHashOfData(data: SongExportData): string {
    return this.hashEncoded(this.songTextFormat.encode(data));
  }

  private contentHashOfSong(song: Partial<Song>): string {
    return this.hashEncoded(
      this.songTextFormat.encode({
        title: song.title as string,
        artist: song.artist as string,
        language: song.language,
        blocks: song.blocks ?? [],
        references: song.references ?? [],
      }),
    );
  }

  private hashEncoded(encoded: string): string {
    return createHash('sha256').update(encoded).digest('hex');
  }

  private toPlannedEntries(plan: PlannedChange[]): SyncReportEntry[] {
    return plan.map((change) => ({
      path: change.path,
      previousPath: change.previousPath,
      action: change.action,
      status:
        change.action === 'skip' || !change.permitted ? 'skipped' : 'planned',
      songId: change.songId,
      overwritesLocalChanges: change.overwritesLocalChanges,
      message: change.skipReason,
    }));
  }

  private toReport(
    source: VcsSource,
    commitSha: string | null,
    entries: SyncReportEntry[],
    dryRun: boolean,
  ): SyncReport {
    return {
      sourceName: source.name,
      repo: source.repo,
      branch: source.branch,
      basePath: source.basePath,
      orgId: source.orgId,
      commitSha,
      dryRun,
      entries,
    };
  }
}
