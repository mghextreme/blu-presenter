import { describe, expect, it } from 'vite-plus/test';
import type { TFunction } from 'i18next';
import { describeAuthError } from '../auth-errors';
import { ApiError } from '@/types';

const ERRORS: Record<string, string> = {
  'Invalid login credentials': 'Invalid credentials',
  'For security purposes, wait 59 seconds.': 'Wait a minute',
  default: 'Something went wrong',
};
const t = ((key: string) => (key === 'errors' ? ERRORS : key)) as unknown as TFunction<'auth'>;

const apiError = (body: unknown) =>
  new ApiError(400, 'API Error: 400', new Response(JSON.stringify(body)));

describe('describeAuthError', () => {
  it('translates a known server message', async () => {
    expect(await describeAuthError(apiError({ message: 'Invalid login credentials' }), t)).toBe(
      'Invalid credentials',
    );
  });

  it('translates messages containing key separators', async () => {
    expect(
      await describeAuthError(apiError({ message: 'For security purposes, wait 59 seconds.' }), t),
    ).toBe('Wait a minute');
  });

  it('falls back to the default for unknown messages and non-JSON bodies', async () => {
    expect(await describeAuthError(apiError({ message: 'Email rate limit exceeded' }), t)).toBe(
      'Something went wrong',
    );
    expect(
      await describeAuthError(new ApiError(503, 'API Error: 503', new Response('down')), t),
    ).toBe('Something went wrong');
  });

  it('uses the given fallback key', async () => {
    expect(await describeAuthError(new Error('offline'), t, 'Invalid login credentials')).toBe(
      'Invalid credentials',
    );
  });
});
