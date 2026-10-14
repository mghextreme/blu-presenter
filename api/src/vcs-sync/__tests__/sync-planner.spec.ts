import { planSync } from '../sync-planner';

function link(path: string, songId: number, blobSha: string) {
  return { path, songId, blobSha };
}

describe('planSync', () => {
  it('plans an add for files without a link', () => {
    const plan = planSync({
      treeFiles: [{ path: 'en/new-song.md', blobSha: 'b1' }],
      links: [],
      allowedActions: ['add', 'update', 'remove'],
      localChanges: new Set(),
    });

    expect(plan).toHaveLength(1);
    expect(plan[0]).toMatchObject({
      action: 'add',
      path: 'en/new-song.md',
      blobSha: 'b1',
      permitted: true,
    });
  });

  it('plans an update when the blob SHA differs', () => {
    const plan = planSync({
      treeFiles: [{ path: 'en/song.md', blobSha: 'b2' }],
      links: [link('en/song.md', 7, 'b1')],
      allowedActions: ['add', 'update', 'remove'],
      localChanges: new Set(),
    });

    expect(plan[0]).toMatchObject({
      action: 'update',
      path: 'en/song.md',
      songId: 7,
      blobSha: 'b2',
      permitted: true,
      overwritesLocalChanges: false,
    });
  });

  it('flags updates that overwrite local changes', () => {
    const plan = planSync({
      treeFiles: [{ path: 'en/song.md', blobSha: 'b2' }],
      links: [link('en/song.md', 7, 'b1')],
      allowedActions: ['add', 'update', 'remove'],
      localChanges: new Set(['en/song.md']),
    });

    expect(plan[0].action).toBe('update');
    expect(plan[0].overwritesLocalChanges).toBe(true);
  });

  it('skips unchanged files', () => {
    const plan = planSync({
      treeFiles: [{ path: 'en/song.md', blobSha: 'b1' }],
      links: [link('en/song.md', 7, 'b1')],
      allowedActions: ['add', 'update', 'remove'],
      localChanges: new Set(),
    });

    expect(plan[0]).toMatchObject({ action: 'skip', permitted: true });
  });

  it('plans a remove when the file is gone', () => {
    const plan = planSync({
      treeFiles: [],
      links: [link('en/gone.md', 9, 'b1')],
      allowedActions: ['add', 'update', 'remove'],
      localChanges: new Set(),
    });

    expect(plan[0]).toMatchObject({
      action: 'remove',
      songId: 9,
      permitted: true,
    });
  });

  it('marks a remove as not permitted when the source disallows it', () => {
    const plan = planSync({
      treeFiles: [],
      links: [link('en/gone.md', 9, 'b1')],
      allowedActions: ['add', 'update'],
      localChanges: new Set(),
    });

    expect(plan[0]).toMatchObject({
      action: 'remove',
      permitted: false,
      skipReason: expect.stringContaining('remove not permitted'),
    });
  });

  it('detects a rename when a file is deleted and an identical one is added', () => {
    const plan = planSync({
      treeFiles: [{ path: 'en/new-name.md', blobSha: 'b1' }],
      links: [link('en/old-name.md', 5, 'b1')],
      allowedActions: ['add', 'update', 'remove'],
      localChanges: new Set(),
    });

    expect(plan).toHaveLength(1);
    expect(plan[0]).toMatchObject({
      action: 'rename',
      path: 'en/new-name.md',
      previousPath: 'en/old-name.md',
      songId: 5,
    });
  });

  it('falls back to remove+add when renames are not possible (update not allowed)', () => {
    const plan = planSync({
      treeFiles: [{ path: 'en/new-name.md', blobSha: 'b1' }],
      links: [link('en/old-name.md', 5, 'b1')],
      allowedActions: ['add', 'remove'],
      localChanges: new Set(),
    });

    expect(plan.map((change) => change.action).sort()).toEqual([
      'add',
      'remove',
    ]);
  });

  it('marks adds as not permitted for add-only disallowed sources', () => {
    const plan = planSync({
      treeFiles: [{ path: 'en/new.md', blobSha: 'b1' }],
      links: [],
      allowedActions: ['update'],
      localChanges: new Set(),
    });

    expect(plan[0]).toMatchObject({
      action: 'add',
      permitted: false,
      skipReason: expect.stringContaining('add not permitted'),
    });
  });

  it('never pairs two renames from the same added file', () => {
    const plan = planSync({
      treeFiles: [{ path: 'en/target.md', blobSha: 'b1' }],
      links: [link('en/a.md', 1, 'b1'), link('en/b.md', 2, 'b1')],
      allowedActions: ['add', 'update', 'remove'],
      localChanges: new Set(),
    });

    const actions = plan.map((change) => ({
      action: change.action,
      path: change.path,
    }));
    expect(actions).toContainEqual({ action: 'rename', path: 'en/target.md' });
    expect(actions).toContainEqual({ action: 'remove', path: 'en/b.md' });
  });

  it('returns the plan sorted by path', () => {
    const plan = planSync({
      treeFiles: [
        { path: 'en/b.md', blobSha: 'b1' },
        { path: 'en/a.md', blobSha: 'b2' },
      ],
      links: [],
      allowedActions: ['add', 'update', 'remove'],
      localChanges: new Set(),
    });

    expect(plan.map((change) => change.path)).toEqual(['en/a.md', 'en/b.md']);
  });
});
