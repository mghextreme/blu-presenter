import { randomInt } from 'node:crypto';

const ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

/** A URL-safe secret of `length` alphanumeric characters from a CSPRNG. */
export function generateRandomSecret(length: number): string {
  let secret = '';
  for (let i = 0; i < length; i++) {
    secret += ALPHABET[randomInt(ALPHABET.length)];
  }
  return secret;
}
