import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createPublicKey } from 'crypto';
import { JwtService } from '@nestjs/jwt';

interface JWKS {
  keys: Record<string, any>[];
}

/**
 * Shared JWT verification service that supports multiple algorithms (HS256, ES256, RS256).
 * Uses the Supabase JWKS endpoint for asymmetric key verification with caching,
 * and falls back to the HS256 secret for legacy tokens.
 *
 * This service is used by WebsocketGuard to verify JWTs consistently with
 * the Passport-based SupabaseStrategy used for REST endpoints.
 */
@Injectable()
export class JwtVerificationService {
  private readonly logger = new Logger(JwtVerificationService.name);
  private jwksCache: { keys: Map<string, string>; timestamp: number } | null = null;
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  private readonly jwtSecret: string;
  private readonly jwksUrl: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.jwtSecret = this.configService.get<string>('auth.jwtSecret');
    const supabaseUrl = this.configService.get<string>('supabase.url');
    this.jwksUrl = `${supabaseUrl}/auth/v1/.well-known/jwks.json`;
  }

  /**
   * Verify a JWT token, supporting HS256 (legacy secret) and asymmetric algorithms (ES256, RS256 via JWKS).
   * Returns the decoded payload on success, or throws on failure.
   */
  async verifyToken(token: string): Promise<any> {
    // Decode the header to determine the algorithm
    const header = JSON.parse(
      Buffer.from(token.split('.')[0], 'base64url').toString('utf8'),
    );

    if (header.alg === 'HS256') {
      // Use the shared secret for HS256
      return this.jwtService.verifyAsync(token, {
        secret: this.jwtSecret,
      });
    }

    // For asymmetric algorithms, fetch the public key from JWKS
    const publicKey = await this.getPublicKey(header.kid);
    if (!publicKey) {
      throw new Error(`No public key found for kid: ${header.kid}`);
    }

    return this.jwtService.verifyAsync(token, {
      publicKey,
      algorithms: [header.alg],
    });
  }

  private async getPublicKey(kid: string): Promise<string | null> {
    const now = Date.now();

    // Check cache
    if (this.jwksCache && (now - this.jwksCache.timestamp) < this.CACHE_DURATION) {
      const cached = this.jwksCache.keys.get(kid);
      if (cached) {
        return cached;
      }
    }

    // Fetch JWKS
    this.logger.debug(`Fetching JWKS from ${this.jwksUrl}`);
    try {
      const response = await fetch(this.jwksUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch JWKS: ${response.status} ${response.statusText}`);
      }

      const jwks: JWKS = await response.json();

      const keysMap = new Map<string, string>();
      for (const jwk of jwks.keys) {
        try {
          const publicKey = createPublicKey({ key: jwk as any, format: 'jwk' });
          const pem = publicKey.export({ type: 'spki', format: 'pem' }) as string;
          keysMap.set(jwk.kid, pem);
        } catch (error) {
          this.logger.warn(`Failed to convert JWK to PEM for kid ${jwk.kid}: ${error.message}`);
        }
      }

      this.jwksCache = { keys: keysMap, timestamp: now };
      return keysMap.get(kid) || null;
    } catch (error) {
      this.logger.error(`Error fetching JWKS: ${error.message}`);

      // If cache exists but is stale, use it anyway
      if (this.jwksCache) {
        this.logger.warn('Using stale JWKS cache due to fetch error');
        return this.jwksCache.keys.get(kid) || null;
      }

      return null;
    }
  }
}
