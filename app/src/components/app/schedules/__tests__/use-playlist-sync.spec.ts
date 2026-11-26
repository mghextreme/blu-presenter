import { describe, it, expect, vi, beforeEach } from 'vite-plus/test';
import { act, renderHook, waitFor } from '@testing-library/react';
import { toast } from 'sonner';

import { createQueryWrapper } from '@/test/test-utils';
import { SCHEDULE_PLAYLIST_PROVIDERS } from '../playlist-providers';
import { usePlaylistSync } from '../use-playlist-sync';

const useServicesMock = vi.hoisted(() => vi.fn());

vi.mock('@/hooks/useServices', () => ({
  useServices: useServicesMock,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const spotify = SCHEDULE_PLAYLIST_PROVIDERS.find((provider) => provider.source === 'spotify-auto')!;

const schedule = {
  id: 5,
  title: 'Sunday',
  organization: { id: 3, name: 'Org', role: 'member' },
  references: [],
  items: [],
};

const freshSchedule = {
  ...schedule,
  references: [{ source: 'spotify-auto', url: 'https://open.spotify.com/playlist/p1' }],
};

describe('usePlaylistSync', () => {
  const syncPlaylist = vi.fn();
  const fetchById = vi.fn();
  const getConnectUrl = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    fetchById.mockResolvedValue(freshSchedule);
    useServicesMock.mockReturnValue({
      schedulesService: { syncPlaylist, fetchById },
      spotifyService: {
        getConnectUrl,
        getStatusQuery: () => ({ queryKey: ['spotify', 'status'], queryFn: vi.fn() }),
      },
    });
  });

  const renderSync = (onSynced = vi.fn()) =>
    renderHook(() => usePlaylistSync(schedule as never, onSynced), {
      wrapper: createQueryWrapper(),
    });

  it('hands the refreshed schedule over after a successful sync', async () => {
    syncPlaylist.mockResolvedValue({ action: 'created', url: 'u', added: 2, skipped: [] });
    const onSynced = vi.fn();
    const { result } = renderSync(onSynced);

    let succeeded: boolean | undefined;
    await act(async () => {
      succeeded = await result.current.sync(spotify, { name: 'Sunday', isPublic: true });
    });

    expect(succeeded).toBe(true);
    expect(syncPlaylist).toHaveBeenCalledWith(5, 3, 'spotify', { name: 'Sunday', isPublic: true });
    expect(toast.success).toHaveBeenCalledWith('spotify.synced');
    expect(onSynced).toHaveBeenCalledWith(freshSchedule);
    await waitFor(() => expect(result.current.isBusy).toBe(false));
  });

  it('reports a failed sync and still shows a playlist the server attached', async () => {
    syncPlaylist.mockRejectedValue(new Error('boom'));
    const onSynced = vi.fn();
    const { result } = renderSync(onSynced);

    let succeeded: boolean | undefined;
    await act(async () => {
      succeeded = await result.current.sync(spotify);
    });

    expect(succeeded).toBe(false);
    expect(toast.error).toHaveBeenCalledWith('spotify.syncFailed', { description: 'boom' });
    expect(onSynced).toHaveBeenCalledWith(freshSchedule);
    await waitFor(() => expect(result.current.isBusy).toBe(false));
  });

  it('is busy while syncing', async () => {
    let finishSync: (value: unknown) => void = () => undefined;
    syncPlaylist.mockReturnValue(
      new Promise((resolve) => {
        finishSync = resolve;
      }),
    );
    const { result } = renderSync();

    let syncing: Promise<boolean> | undefined;
    act(() => {
      syncing = result.current.sync(spotify);
    });
    await waitFor(() => expect(result.current.isBusy).toBe(true));

    await act(async () => {
      finishSync({ action: 'updated', url: 'u', added: 0, skipped: [] });
      await syncing;
    });
    await waitFor(() => expect(result.current.isBusy).toBe(false));
  });

  it('stays busy after connecting, while the browser leaves for the provider', async () => {
    getConnectUrl.mockResolvedValue({ url: 'https://accounts.spotify.com/authorize' });
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    const { result } = renderSync();

    act(() => {
      result.current.connect(spotify);
    });

    await waitFor(() =>
      expect(open).toHaveBeenCalledWith('https://accounts.spotify.com/authorize', '_self'),
    );
    expect(result.current.isBusy).toBe(true);
    open.mockRestore();
  });

  it('reports a failed connect and lets the user retry', async () => {
    getConnectUrl.mockRejectedValue(new Error('nope'));
    const { result } = renderSync();

    act(() => {
      result.current.connect(spotify);
    });

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('spotify.connectFailed', { description: 'nope' }),
    );
    await waitFor(() => expect(result.current.isBusy).toBe(false));
  });
});
