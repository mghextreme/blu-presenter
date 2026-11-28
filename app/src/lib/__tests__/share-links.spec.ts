import { describe, expect, it } from 'vite-plus/test';
import {
  absoluteUrl,
  sharedRehearsalPath,
  sharedSchedulePath,
  sharedSessionPath,
  sharedSongPath,
  sharedSongPrintPath,
} from '../share-links';

describe('share links', () => {
  it('builds the shared song, print, schedule and rehearsal paths', () => {
    const item = { id: 7, secret: 'abc' };
    expect(sharedSongPath(item)).toBe('/shared/view/7/abc');
    expect(sharedSongPrintPath(item)).toBe('/shared/print/7/abc');
    expect(sharedSchedulePath(item)).toBe('/shared/schedules/7/abc');
    expect(sharedRehearsalPath(item)).toBe('/shared/schedules/7/abc/rehearsal');
  });

  it('leaves the secret segment empty without a secret', () => {
    expect(sharedSongPath({ id: 7, secret: null })).toBe('/shared/view/7/');
  });

  it('encodes secrets', () => {
    expect(sharedSongPath({ id: 7, secret: 'a/b' })).toBe('/shared/view/7/a%2Fb');
  });

  it('builds the session receiver path with an optional theme', () => {
    const session = { id: 3, secret: 's', organization: { id: 9 } };
    expect(sharedSessionPath(session)).toBe('/shared/session/9/3/s');
    expect(sharedSessionPath(session, 'lyrics')).toBe('/shared/session/9/3/s/lyrics');
    expect(sharedSessionPath(session, 12)).toBe('/shared/session/9/3/s/12');
  });

  it('makes paths absolute on the current origin', () => {
    expect(absoluteUrl('/shared/view/7/abc')).toBe(`${window.location.origin}/shared/view/7/abc`);
  });
});
