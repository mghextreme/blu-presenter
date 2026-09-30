import { SongVcsFile } from 'src/entities';

export type SyncAction = 'add' | 'update' | 'rename' | 'remove' | 'skip';

export type SyncEntryStatus = 'planned' | 'applied' | 'failed' | 'skipped';

export interface PlannedChange {
  action: SyncAction;
  path: string;
  previousPath?: string;
  songId?: number;
  blobSha: string;
  permitted: boolean;
  skipReason?: string;
  overwritesLocalChanges: boolean;
}

export interface PlanSyncInput {
  treeFiles: { path: string; blobSha: string }[];
  links: Pick<SongVcsFile, 'path' | 'songId' | 'blobSha'>[];
  allowedActions: string[];
  localChanges: Set<string>;
}

export function planSync(input: PlanSyncInput): PlannedChange[] {
  const { treeFiles, links, allowedActions, localChanges } = input;
  const can = (action: string) => allowedActions.includes(action);

  const treeMap = new Map(treeFiles.map((file) => [file.path, file.blobSha]));
  const linkMap = new Map(links.map((link) => [link.path, link]));

  const removedLinks = links.filter((link) => !treeMap.has(link.path));
  const addedFiles = treeFiles.filter((file) => !linkMap.has(file.path));

  const consumedAdds = new Set<string>();
  const renames = new Map<string, string>();
  for (const removedLink of removedLinks) {
    const renameTarget = addedFiles.find(
      (file) =>
        !consumedAdds.has(file.path) && file.blobSha === removedLink.blobSha,
    );
    if (renameTarget && can('update')) {
      consumedAdds.add(renameTarget.path);
      renames.set(removedLink.path, renameTarget.path);
    }
  }

  const plan: PlannedChange[] = [];

  for (const link of links) {
    const treeSha = treeMap.get(link.path);
    if (treeSha !== undefined) {
      if (treeSha === link.blobSha) {
        plan.push({
          action: 'skip',
          path: link.path,
          songId: link.songId,
          blobSha: treeSha,
          permitted: true,
          skipReason: 'unchanged',
          overwritesLocalChanges: false,
        });
      } else {
        plan.push({
          action: 'update',
          path: link.path,
          songId: link.songId,
          blobSha: treeSha,
          permitted: can('update'),
          skipReason: can('update')
            ? undefined
            : 'update not permitted for this source',
          overwritesLocalChanges: localChanges.has(link.path),
        });
      }
      continue;
    }

    const renameTo = renames.get(link.path);
    if (renameTo !== undefined) {
      plan.push({
        action: 'rename',
        path: renameTo,
        previousPath: link.path,
        songId: link.songId,
        blobSha: link.blobSha,
        permitted: true,
        overwritesLocalChanges: false,
      });
      continue;
    }

    const permitted = can('remove');
    plan.push({
      action: 'remove',
      path: link.path,
      songId: link.songId,
      blobSha: link.blobSha,
      permitted,
      skipReason: permitted
        ? undefined
        : 'remove not permitted for this source',
      overwritesLocalChanges: false,
    });
  }

  for (const file of addedFiles) {
    if (consumedAdds.has(file.path)) {
      continue;
    }
    const permitted = can('add');
    plan.push({
      action: 'add',
      path: file.path,
      blobSha: file.blobSha,
      permitted,
      skipReason: permitted ? undefined : 'add not permitted for this source',
      overwritesLocalChanges: false,
    });
  }

  return plan.sort((a, b) => a.path.localeCompare(b.path));
}
