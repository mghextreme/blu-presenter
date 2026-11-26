/**
 * True when `value` is an absolute http(s) URL. Used for user-supplied links
 * that are later opened in a browser, so `javascript:`, `data:` and similar
 * schemes are rejected.
 */
export function isHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }
  try {
    const { protocol } = new URL(value);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}
