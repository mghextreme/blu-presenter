import type { TFunction } from 'i18next';
import { describeApiError } from '@/types';

/**
 * The translated description of a failed auth request. Supabase messages are
 * looked up as whole strings in `auth:errors`, since they can contain `.` or
 * `:`, which i18next reads as separators. Unknown or missing messages get
 * `errors.<fallbackKey>`.
 */
export async function describeAuthError(
  error: unknown,
  t: TFunction<'auth'>,
  fallbackKey = 'default',
): Promise<string> {
  const message = await describeApiError(error);
  const errors = t('errors', { returnObjects: true });
  const known = (typeof errors === 'object' && errors ? errors : {}) as Record<string, string>;
  if (message && Object.hasOwn(known, message)) {
    return known[message];
  }
  return known[fallbackKey] ?? t('errors.default');
}
