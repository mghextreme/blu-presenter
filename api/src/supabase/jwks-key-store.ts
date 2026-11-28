import { Logger } from '@nestjs/common';
import { createPublicKey, JsonWebKeyInput } from 'node:crypto';
import { fetchWithTimeout } from 'src/utils/fetch-with-timeout';

/** How long fetched keys are trusted before they are fetched again. */
const CACHE_TTL_MS = 10 * 60 * 1000;

/**
 * Minimum time between two fetches. Tokens with an unknown `kid` (forged,
 * or signed with a key rotated in moments ago) would otherwise trigger a
 * fetch on every request.
 */
const MIN_REFETCH_INTERVAL_MS = 30 * 1000;

interface Jwks {
  keys: (JsonWebKeyInput['key'] & { kid?: string })[];
}

/** The public keys of a JWKS endpoint, as PEM, by key id. */
export class JwksKeyStore {
  private readonly logger = new Logger(JwksKeyStore.name);
  private keys = new Map<string, string>();
  private fetchedAt: number | null = null;
  private lastAttemptAt: number | null = null;
  private inFlight: Promise<void> | null = null;

  constructor(
    private readonly jwksUrl: string,
    private readonly now: () => number = Date.now,
  ) {}

  async getPublicKey(kid: string): Promise<string | null> {
    const cached = this.keys.get(kid) ?? null;
    if (
      cached &&
      this.fetchedAt !== null &&
      this.now() - this.fetchedAt < CACHE_TTL_MS
    ) {
      return cached;
    }

    if (
      this.lastAttemptAt !== null &&
      this.now() - this.lastAttemptAt < MIN_REFETCH_INTERVAL_MS
    ) {
      return cached;
    }

    await this.refresh();
    return this.keys.get(kid) ?? null;
  }

  /** Concurrent callers share one fetch. */
  private refresh(): Promise<void> {
    this.inFlight ??= this.fetchKeys().finally(() => {
      this.inFlight = null;
    });
    return this.inFlight;
  }

  private async fetchKeys(): Promise<void> {
    this.lastAttemptAt = this.now();
    try {
      const response = await fetchWithTimeout(this.jwksUrl);
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }
      const jwks = (await response.json()) as Jwks;
      this.keys = this.toPemByKid(jwks);
      this.fetchedAt = this.now();
    } catch (error) {
      // Stale keys are kept: better than rejecting every token while the
      // endpoint is unreachable.
      this.logger.error(
        `Failed to fetch JWKS from ${this.jwksUrl}: ${(error as Error).message}`,
      );
    }
  }

  private toPemByKid(jwks: Jwks): Map<string, string> {
    const keys = new Map<string, string>();
    for (const jwk of jwks.keys ?? []) {
      if (!jwk.kid) continue;
      try {
        const pem = createPublicKey({ key: jwk, format: 'jwk' }).export({
          type: 'spki',
          format: 'pem',
        }) as string;
        keys.set(jwk.kid, pem);
      } catch (error) {
        this.logger.warn(
          `Failed to convert JWK ${jwk.kid} to PEM: ${(error as Error).message}`,
        );
      }
    }
    return keys;
  }
}
