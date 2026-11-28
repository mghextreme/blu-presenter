import { ConfigService } from '@nestjs/config';
import { DatabaseConfigService } from '../database-config.service';

describe('DatabaseConfigService', () => {
  const optionsFor = (database: Record<string, unknown>) =>
    new DatabaseConfigService(
      new ConfigService({ database: { host: 'db', port: 5432, ...database } }),
    ).createTypeOrmOptions() as Record<string, unknown>;

  it('connects to Postgres without TLS by default', () => {
    expect(optionsFor({})).toMatchObject({
      type: 'postgres',
      host: 'db',
      ssl: false,
      synchronize: false,
    });
  });

  it('enables verified TLS', () => {
    expect(optionsFor({ ssl: true }).ssl).toBe(true);
  });

  it('verifies against a supplied CA', () => {
    expect(optionsFor({ sslCa: 'PEM' }).ssl).toEqual({ ca: 'PEM' });
  });

  it('passes the pool size', () => {
    expect(optionsFor({ poolSize: 5 }).poolSize).toBe(5);
  });
});
