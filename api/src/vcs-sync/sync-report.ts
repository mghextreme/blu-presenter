import { SyncAction, SyncEntryStatus } from './sync-planner';

export interface SyncReportEntry {
  path: string;
  action: SyncAction;
  status: SyncEntryStatus;
  songId?: number;
  previousPath?: string;
  overwritesLocalChanges?: boolean;
  message?: string;
}

export interface SyncReport {
  sourceName: string;
  repo: string;
  branch: string;
  basePath: string;
  orgId: number | null;
  commitSha: string | null;
  dryRun: boolean;
  entries: SyncReportEntry[];
}

export interface SyncReportSummary {
  added: number;
  updated: number;
  removed: number;
  renamed: number;
  skipped: number;
  failed: number;
  overwrites: number;
  notPermitted: number;
}

export function summarizeReport(report: SyncReport): SyncReportSummary {
  const summary: SyncReportSummary = {
    added: 0,
    updated: 0,
    removed: 0,
    renamed: 0,
    skipped: 0,
    failed: 0,
    overwrites: 0,
    notPermitted: 0,
  };
  for (const entry of report.entries) {
    if (entry.status === 'failed') {
      summary.failed++;
      continue;
    }
    if (entry.status === 'skipped' && entry.action !== 'skip') {
      summary.notPermitted++;
      continue;
    }
    if (entry.overwritesLocalChanges) {
      summary.overwrites++;
    }
    switch (entry.action) {
      case 'add':
        summary.added++;
        break;
      case 'update':
        summary.updated++;
        break;
      case 'remove':
        summary.removed++;
        break;
      case 'rename':
        summary.renamed++;
        break;
      case 'skip':
        summary.skipped++;
        break;
    }
  }
  return summary;
}

export function isReportActionable(report: SyncReport): boolean {
  return report.entries.some(
    (entry) => entry.status !== 'skipped' || entry.action !== 'skip',
  );
}

export function formatSyncReport(report: SyncReport): string {
  const summary = summarizeReport(report);
  const lines: string[] = [];

  const scope =
    report.orgId === null ? 'public archive' : `organization ${report.orgId}`;
  lines.push(
    `VCS sync for source "${report.sourceName}" (${report.repo} @ ${report.branch}${report.basePath ? `, basePath ${report.basePath}` : ''}) → ${scope}`,
  );
  if (report.commitSha) {
    lines.push(`Reconciled against commit ${report.commitSha}`);
  }
  lines.push(
    report.dryRun
      ? 'Dry run — nothing was written. Pass --apply to write changes.'
      : 'Applied changes:',
  );
  lines.push('');

  for (const entry of report.entries) {
    if (entry.action === 'skip' && entry.status !== 'failed') {
      continue;
    }
    const mark =
      entry.action === 'add'
        ? '+'
        : entry.action === 'update'
          ? '~'
          : entry.action === 'rename'
            ? '→'
            : entry.action === 'remove'
              ? '-'
              : '?';
    let line = `  ${mark} ${entry.action.padEnd(6)} ${entry.path}`;
    if (entry.previousPath) {
      line = `  → rename  ${entry.previousPath} → ${entry.path}`;
    }
    if (entry.songId) {
      line += ` (song ${entry.songId})`;
    }
    if (entry.overwritesLocalChanges) {
      line += ' [overwrites local changes]';
    }
    if (entry.status === 'failed') {
      line = `  ! failed  ${entry.path}${entry.message ? ` — ${entry.message}` : ''}`;
    } else if (entry.status === 'skipped' && entry.action !== 'skip') {
      line += ` [${entry.message ?? 'not permitted'}]`;
    }
    lines.push(line);
  }

  lines.push('');
  lines.push(
    `Summary: ${summary.added} add, ${summary.updated} update, ${summary.renamed} rename, ${summary.removed} remove, ${summary.skipped} skip, ${summary.failed} failed` +
      (summary.overwrites
        ? `, ${summary.overwrites} overwrite(s) of local changes`
        : '') +
      (summary.notPermitted ? `, ${summary.notPermitted} not permitted` : ''),
  );

  return lines.join('\n');
}
