// Source: https://blog.andriishupta.dev/setup-supabase-with-nestjs

import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthUser } from '@supabase/supabase-js';
import { createPublicKey } from 'crypto';

interface JWKS {
  keys: Record<string, any>[];
}

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(SupabaseStrategy.name);
  private jwksCache: { keys: Map<string, string>; timestamp: number } | null = null;
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = configService.get<string>('supabase.url');
    const jwtSecret = configService.get<string>('auth.jwtSecret');

    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL must be configured');
    }

    const jwksUrl = `${supabaseUrl}/auth/v1/.well-known/jwks.json`;

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ['HS256', 'ES256', 'RS256'],
      secretOrKeyProvider: async (_request, rawJwtToken, done) => {
        try {
          // Decode JWT header to get the algorithm and kid
          const header = JSON.parse(
            Buffer.from(rawJwtToken.split('.')[0], 'base64url').toString('utf8')
          );

          // If using HS256 (legacy), use the JWT secret
          if (header.alg === 'HS256') {
            if (!jwtSecret) {
              return done(new Error('SUPABASE_JWT_SECRET not configured for HS256 algorithm'));
            }
            this.logger.debug('Using HS256 JWT verification with legacy secret');
            return done(null, jwtSecret);
          }

          // For asymmetric algorithms (ES256, RS256), fetch public key from JWKS
          const publicKey = await this.getPublicKey(jwksUrl, header.kid);
          if (!publicKey) {
            return done(new Error(`No public key found for kid: ${header.kid}`));
          }

          this.logger.debug(`Using ${header.alg} JWT verification with JWKS public key`);
          return done(null, publicKey);
        } catch (error) {
          return done(error);
        }
      },
    });

    this.logger.log(`JWT verification configured with JWKS endpoint: ${jwksUrl}`);
  }

  /**
   * Fetches and caches public keys from the JWKS endpoint
   */
  private async getPublicKey(jwksUrl: string, kid: string): Promise<string | null> {
    const now = Date.now();

    // Check cache
    if (this.jwksCache && (now - this.jwksCache.timestamp) < this.CACHE_DURATION) {
      const cached = this.jwksCache.keys.get(kid);
      if (cached) {
        this.logger.debug(`Using cached public key for kid: ${kid}`);
        return cached;
      }
    }

    // Fetch JWKS
    this.logger.debug(`Fetching JWKS from ${jwksUrl}`);
    try {
      const response = await fetch(jwksUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch JWKS: ${response.status} ${response.statusText}`);
      }

      const jwks: JWKS = await response.json();
      
      // Convert all keys to PEM and cache them
      const keysMap = new Map<string, string>();
      for (const jwk of jwks.keys) {
        try {
          // Cast to any to work around TypeScript's strict JWK typing
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
      
      // If cache exists but is stale, use it anyway (better than failing completely)
      if (this.jwksCache) {
        this.logger.warn('Using stale JWKS cache due to fetch error');
        return this.jwksCache.keys.get(kid) || null;
      }
      
      return null;
    }
  }

  async validate(user: AuthUser) {
    return user;
  }
}
