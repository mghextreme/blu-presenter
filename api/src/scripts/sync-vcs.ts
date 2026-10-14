import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import {
  VcsSourcesService,
  VcsSourceInput,
} from '../vcs-sync/vcs-sources.service';
import {
  SyncReport,
  SyncReportSummary,
  formatSyncReport,
  summarizeReport,
} from '../vcs-sync/sync-report';
import { VcsSyncError } from '../vcs-sync/vcs-sync.errors';
import { VcsSyncService } from '../vcs-sync/vcs-sync.service';

const VALUE_FLAGS = new Set([
  'source',
  'repo',
  'branch',
  'basePath',
  'org',
  'name',
]);
const LIST_FLAGS = new Set(['include', 'exclude', 'actions']);
const BOOLEAN_FLAGS = new Set([
  'apply',
  'strict',
  'force',
  'public',
  'all',
  'help',
]);

const USAGE = `Usage:
  sync:vcs --source <name> | --all [--apply] [--strict]
      Sync songs from the configured repository into the database.
      Dry run by default; pass --apply to write changes.

  sync:vcs file <source> <path> [--apply] [--force]
      Sync a single file. Paths may be repo-relative or relative to the
      source basePath. --force re-applies even when the file is unchanged.

  sync:vcs sources list
  sync:vcs sources add --name <name> --repo <owner/name> (--public | --org <id>)
      [--branch <branch>] [--basePath <path>] [--include <glob,glob>]
      [--exclude <glob,glob>] [--actions add,update,remove]
  sync:vcs sources update <name> [same flags as add]
  sync:vcs sources remove <name>
  sync:vcs sources export [<name>]

Environment:
  GITHUB_TOKEN  GitHub token with read access to the configured repositories
  DATABASE_*    Same database configuration as the API server`;

interface ParsedArgs {
  positionals: string[];
  flags: Record<string, string | string[] | boolean>;
}

function parseArgs(argv: string[]): ParsedArgs {
  const positionals: string[] = [];
  const flags: Record<string, string | string[] | boolean> = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) {
      positionals.push(arg);
      continue;
    }
    const key = arg.slice(2);
    if (LIST_FLAGS.has(key)) {
      const value = argv[++i];
      if (value === undefined) {
        throw new VcsSyncError(`Missing value for --${key}`);
      }
      const values = (flags[key] as string[] | undefined) ?? [];
      flags[key] = [
        ...values,
        ...value
          .split(',')
          .map((v) => v.trim())
          .filter((v) => v !== ''),
      ];
    } else if (VALUE_FLAGS.has(key)) {
      const value = argv[++i];
      if (value === undefined) {
        throw new VcsSyncError(`Missing value for --${key}`);
      }
      flags[key] = value;
    } else if (BOOLEAN_FLAGS.has(key)) {
      flags[key] = true;
    } else {
      throw new VcsSyncError(`Unknown flag --${key}`);
    }
  }
  return { positionals, flags };
}

type FlagMap = Record<string, string | string[] | boolean>;

function flagString(flags: FlagMap, key: string): string | undefined {
  const value = flags[key];
  return typeof value === 'string' ? value : undefined;
}

function flagList(flags: FlagMap, key: string): string[] | undefined {
  const value = flags[key];
  return Array.isArray(value) ? value : undefined;
}

function sourceInputFromFlags(
  flags: FlagMap,
  nameFromPositional: string | undefined,
): VcsSourceInput {
  const input: VcsSourceInput = {};
  const name = flagString(flags, 'name') ?? nameFromPositional;
  if (name !== undefined) input.name = name;
  const repo = flagString(flags, 'repo');
  if (repo !== undefined) input.repo = repo;
  const branch = flagString(flags, 'branch');
  if (branch !== undefined) input.branch = branch;
  const basePath = flagString(flags, 'basePath');
  if (basePath !== undefined) input.basePath = basePath;
  if (flags.public === true) {
    input.orgId = null;
  } else {
    const org = flagString(flags, 'org');
    if (org !== undefined) {
      const orgId = Number(org);
      if (!Number.isInteger(orgId)) {
        throw new VcsSyncError(
          `--org must be an organization id, got "${org}"`,
        );
      }
      input.orgId = orgId;
    }
  }
  const include = flagList(flags, 'include');
  if (include !== undefined) input.includePatterns = include;
  const exclude = flagList(flags, 'exclude');
  if (exclude !== undefined) input.excludePatterns = exclude;
  const actions = flagList(flags, 'actions');
  if (actions !== undefined) input.allowedActions = actions;
  return input;
}

function printReport(report: SyncReport): SyncReportSummary {
  console.log(formatSyncReport(report));
  return summarizeReport(report);
}

function exitCodeFor(
  summaries: SyncReportSummary[],
  hadFatal: boolean,
): number {
  if (hadFatal) return 2;
  if (summaries.some((s) => s.failed > 0)) return 1;
  return 0;
}

async function runSyncCommand(
  syncService: VcsSyncService,
  sourcesService: VcsSourcesService,
  flags: FlagMap,
): Promise<number> {
  const apply = flags.apply === true;
  const strict = flags.strict === true;

  let sources;
  if (flags.all === true) {
    sources = (await sourcesService.list()).filter((source) => source.enabled);
    if (sources.length === 0) {
      throw new VcsSyncError('No enabled sources configured');
    }
  } else {
    const name = flagString(flags, 'source');
    if (!name) {
      throw new VcsSyncError('Specify --source <name> or --all');
    }
    sources = [await sourcesService.resolve(name)];
  }

  const summaries: SyncReportSummary[] = [];
  let hadFatal = false;
  for (const source of sources) {
    try {
      const report = await syncService.syncSource(source, { apply, strict });
      summaries.push(printReport(report));
    } catch (error) {
      hadFatal = true;
      console.error(
        `Fatal error while syncing source "${source.name}": ${(error as Error).message}`,
      );
      if (sources.length === 1) {
        throw error;
      }
    }
  }
  return exitCodeFor(summaries, hadFatal);
}

async function runFileCommand(
  syncService: VcsSyncService,
  sourcesService: VcsSourcesService,
  positionals: string[],
  flags: FlagMap,
): Promise<number> {
  const [sourceName, filePath] = positionals;
  if (!sourceName || !filePath) {
    throw new VcsSyncError(
      'Usage: sync:vcs file <source> <path> [--apply] [--force]',
    );
  }
  const source = await sourcesService.resolve(sourceName);
  const report = await syncService.syncSingleFile(source, filePath, {
    apply: flags.apply === true,
    force: flags.force === true,
  });
  const summary = printReport(report);
  return exitCodeFor([summary], false);
}

async function runSourcesCommand(
  sourcesService: VcsSourcesService,
  positionals: string[],
  flags: FlagMap,
): Promise<number> {
  const [action, ...rest] = positionals;
  switch (action) {
    case 'list': {
      const sources = await sourcesService.list();
      if (sources.length === 0) {
        console.log(
          'No sources configured. See "sync:vcs sources add --help".',
        );
        return 0;
      }
      for (const source of sources) {
        const target =
          source.orgId === null
            ? 'public archive'
            : `organization ${source.orgId}`;
        console.log(
          `  ${source.name}  ${source.repo}@${source.branch}` +
            (source.basePath ? ` basePath=${source.basePath}` : '') +
            ` → ${target}` +
            ` actions=[${source.allowedActions.join(',')}]` +
            (source.enabled ? '' : ' [disabled]') +
            (source.lastSyncedAt
              ? ` lastSync=${source.lastSyncedAt.toISOString()}`
              : ' lastSync=never'),
        );
      }
      return 0;
    }
    case 'add': {
      const source = await sourcesService.create(
        sourceInputFromFlags(flags, undefined),
      );
      console.log(`Created source "${source.name}" (${source.repo})`);
      return 0;
    }
    case 'update': {
      const name = rest[0] ?? flagString(flags, 'name');
      if (!name) {
        throw new VcsSyncError('Usage: sync:vcs sources update <name> [flags]');
      }
      const input = sourceInputFromFlags(flags, undefined);
      const source = await sourcesService.update(name, input);
      console.log(`Updated source "${source.name}"`);
      return 0;
    }
    case 'remove': {
      const name = rest[0];
      if (!name) {
        throw new VcsSyncError('Usage: sync:vcs sources remove <name>');
      }
      await sourcesService.remove(name);
      console.log(`Removed source "${name}"`);
      return 0;
    }
    case 'export': {
      const name = rest[0];
      const sources = name
        ? [await sourcesService.resolve(name)]
        : await sourcesService.list();
      console.log(JSON.stringify(sources, null, 2));
      return 0;
    }
    default:
      throw new VcsSyncError(
        `Unknown sources action "${action}". Use list, add, update, remove or export`,
      );
  }
}

async function main(): Promise<number> {
  const argv = process.argv.slice(2);
  let command = 'sync';
  let rest = argv;
  if (argv.length > 0 && !argv[0].startsWith('-')) {
    command = argv[0];
    rest = argv.slice(1);
  }
  const { positionals, flags: flagMap } = parseArgs(rest);

  if (command === '--help' || command === '-h' || flagMap.help === true) {
    console.log(USAGE);
    return 0;
  }

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['warn', 'error'],
  });

  try {
    const syncService = app.get(VcsSyncService);
    const sourcesService = app.get(VcsSourcesService);

    switch (command) {
      case undefined:
      case 'sync':
        return await runSyncCommand(syncService, sourcesService, flagMap);
      case 'file':
        return await runFileCommand(
          syncService,
          sourcesService,
          positionals,
          flagMap,
        );
      case 'sources':
        return await runSourcesCommand(sourcesService, positionals, flagMap);
      default:
        console.error(USAGE);
        throw new VcsSyncError(`Unknown command "${command}"`);
    }
  } finally {
    await app.close();
  }
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error((error as Error).message);
    process.exit(2);
  });
