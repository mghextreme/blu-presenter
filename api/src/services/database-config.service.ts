import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions, TypeOrmOptionsFactory } from '@nestjs/typeorm';
import * as entities from 'src/entities';
import { AuroraMysqlConnectionCredentialsOptions } from 'typeorm/driver/aurora-mysql/AuroraMysqlConnectionCredentialsOptions';

@Injectable()
export class DatabaseConfigService implements TypeOrmOptionsFactory {
  constructor(private configService: ConfigService) {}

  createTypeOrmOptions(): TypeOrmModuleOptions {
    return {
      type: this.configService.get('database.type'),
      host: this.configService.get('database.host'),
      port: this.configService.get('database.port'),
      username: this.configService.get('database.username'),
      password: this.configService.get('database.password') as string,
      database: this.configService.get('database.name'),
      entities: entities,
      synchronize: false,
    } as Partial<AuroraMysqlConnectionCredentialsOptions>;
  }
}
