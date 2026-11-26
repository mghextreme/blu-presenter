import { describe, it, expect, vi, beforeEach } from 'vite-plus/test';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { queryOptions } from '@tanstack/react-query';
import { render } from '@/test/test-utils';

import { ExportSongDialog } from '../export-song-dialog';

const requestExport = vi.hoisted(() => vi.fn());
const songsService = vi.hoisted(() => ({
  exportQuery: (songId: number, secret?: string) =>
    queryOptions({
      queryKey: ['songs', 'export', songId, secret ?? null],
      queryFn: () => requestExport(songId, secret),
    }),
}));

vi.mock('@/hooks/useServices', () => ({ useServices: () => ({ songsService }) }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}));

describe('ExportSongDialog', () => {
  const user = userEvent.setup({ pointerEventsCheck: 0 });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('requests the export only once the dialog is opened, then shows it', async () => {
    requestExport.mockResolvedValue('---\ntitle: My song\n---');
    render(<ExportSongDialog songId={9} title="My song" secret="abc" />);
    expect(requestExport).not.toHaveBeenCalled();

    await user.click(screen.getByTitle('actions.export'));

    expect(await screen.findByText(/title: My song/)).toBeTruthy();
    expect(requestExport).toHaveBeenCalledWith(9, 'abc');
    expect(screen.getByRole('button', { name: 'button.download' }).hasAttribute('disabled')).toBe(
      false,
    );
  });

  it('shows the error when the export fails', async () => {
    requestExport.mockRejectedValue(new Error('Not allowed'));
    render(<ExportSongDialog songId={9} title="My song" />);

    await user.click(screen.getByTitle('actions.export'));

    expect((await screen.findByRole('alert')).textContent).toBe('error.export: Not allowed');
    expect(screen.getByRole('button', { name: 'button.download' }).hasAttribute('disabled')).toBe(
      true,
    );
  });
});
