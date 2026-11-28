import { IBrowserWindow, IScreenDetails } from '@/types/browser';

/**
 * Whether the window-management permission is already granted, so the
 * screens can be read without showing a permission prompt.
 */
export async function isScreenDetailsGranted(win: Window): Promise<boolean> {
  try {
    const status = await win.navigator.permissions.query({
      name: 'window-management' as PermissionName,
    });
    return status.state === 'granted';
  } catch {
    // Browsers without the Window Management API reject the unknown name.
    return false;
  }
}

/**
 * The screens attached to the device, or null when the browser does not
 * support it or the permission is denied. May show a permission prompt, which
 * browsers only allow from a user gesture: call it from a click unless
 * `isScreenDetailsGranted` is true.
 */
export async function getScreens(win: Window): Promise<IScreenDetails[] | null> {
  const browserWindow = win as unknown as IBrowserWindow;
  if (!browserWindow.getScreenDetails) return null;
  try {
    return (await browserWindow.getScreenDetails())?.screens ?? null;
  } catch {
    return null;
  }
}
