// Source: https://blog.andriishupta.dev/setup-supabase-with-nestjs

import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthUser } from '@supabase/supabase-js';
import { JwksKeyStore } from './jwks-key-store';

@Injectable()
export class SupabaseStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(SupabaseStrategy.name);

  constructor(private readonly configService: ConfigService) {
    const supabaseUrl = configService.get<string>('supabase.url');
    const jwtSecret = configService.get<string>('auth.jwtSecret');

    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL must be configured');
    }

    const jwksUrl = `${supabaseUrl}/auth/v1/.well-known/jwks.json`;
    const keyStore = new JwksKeyStore(jwksUrl);

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ['HS256', 'ES256', 'RS256'],
      secretOrKeyProvider: async (_request, rawJwtToken, done) => {
        try {
          // Decode JWT header to get the algorithm and kid
          const header = JSON.parse(
            Buffer.from(rawJwtToken.split('.')[0], 'base64url').toString(
              'utf8',
            ),
          );

          // If using HS256 (legacy), use the JWT secret
          if (header.alg === 'HS256') {
            if (!jwtSecret) {
              return done(
                new Error(
                  'SUPABASE_JWT_SECRET not configured for HS256 algorithm',
                ),
              );
            }
            this.logger.debug(
              'Using HS256 JWT verification with legacy secret',
            );
            return done(null, jwtSecret);
          }

          // For asymmetric algorithms (ES256, RS256), fetch public key from JWKS
          const publicKey = await keyStore.getPublicKey(header.kid);
          if (!publicKey) {
            return done(
              new Error(`No public key found for kid: ${header.kid}`),
            );
          }

          this.logger.debug(
            `Using ${header.alg} JWT verification with JWKS public key`,
          );
          return done(null, publicKey);
        } catch (error) {
          return done(error);
        }
      },
    });

    this.logger.log(
      `JWT verification configured with JWKS endpoint: ${jwksUrl}`,
    );
  }

  async validate(user: AuthUser) {
    return user;
  }
}
