import { describe, expect, it, vi } from 'vite-plus/test';
import { getScreens, isScreenDetailsGranted } from '../screen-details';

const windowWith = (overrides: Record<string, unknown>) => overrides as unknown as Window;

describe('screen details', () => {
  it('reports a granted window-management permission', async () => {
    const query = vi.fn().mockResolvedValue({ state: 'granted' });
    await expect(
      isScreenDetailsGranted(windowWith({ navigator: { permissions: { query } } })),
    ).resolves.toBe(true);
    expect(query).toHaveBeenCalledWith({ name: 'window-management' });
  });

  it('treats an unknown permission as not granted', async () => {
    const query = vi.fn().mockRejectedValue(new TypeError('unknown permission'));
    await expect(
      isScreenDetailsGranted(windowWith({ navigator: { permissions: { query } } })),
    ).resolves.toBe(false);
  });

  it('returns the screens', async () => {
    const screens = [{ label: 'A', width: 1, height: 1, devicePixelRatio: 1 }];
    const win = windowWith({ getScreenDetails: vi.fn().mockResolvedValue({ screens }) });
    await expect(getScreens(win)).resolves.toBe(screens);
  });

  it('returns null when denied or unsupported', async () => {
    const denied = windowWith({
      getScreenDetails: vi.fn().mockRejectedValue(new DOMException('', 'NotAllowedError')),
    });
    await expect(getScreens(denied)).resolves.toBeNull();
    await expect(getScreens(windowWith({}))).resolves.toBeNull();
  });
});
