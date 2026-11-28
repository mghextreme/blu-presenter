/** `?secret=…` for share-link requests, or an empty string without a secret. */
export function secretQuery(secret?: string): string {
  return secret && secret.length > 0 ? `?${new URLSearchParams({ secret })}` : '';
}
