import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import { TlsOptions } from 'node:tls';
import * as entities from 'src/entities';

@Injectable()
export class DatabaseConfigService implements TypeOrmOptionsFactory {
  constructor(private readonly configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: 'postgres',
      host: this.configService.get<string>('database.host'),
      port: this.configService.get<number>('database.port'),
      username: this.configService.get<string>('database.username'),
      password: this.configService.get<string>('database.password'),
      database: this.configService.get<string>('database.name'),
      ssl: this.tlsOptions(),
      poolSize: this.configService.get<number>('database.poolSize'),
      entities: entities,
      synchronize: false,
    };
  }

  /** Certificates are always verified; a private CA can be supplied. */
  private tlsOptions(): boolean | TlsOptions {
    const ca = this.configService.get<string>('database.sslCa');
    if (ca) {
      return { ca };
    }
    return this.configService.get<boolean>('database.ssl') === true;
  }
}
