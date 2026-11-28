import { Controller, Get, INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { User } from 'src/entities';
import {
  AccessToken,
  CurrentUser,
  OptionalUser,
  OrgId,
} from '../request-context.decorator';

@Controller()
class ProbeController {
  @Get('current-user')
  currentUser(@CurrentUser() user: User) {
    return { id: user.id };
  }

  @Get('optional-user')
  optionalUser(@OptionalUser() user: User | undefined) {
    return { signedIn: user !== undefined };
  }

  @Get('org-id')
  orgId(@OrgId() orgId: number) {
    return { orgId };
  }

  @Get('access-token')
  accessToken(@AccessToken() token: string) {
    return { token };
  }
}

describe('request context decorators', () => {
  let app: INestApplication;
  let requestUser: unknown;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [ProbeController],
    }).compile();
    app = module.createNestApplication();
    // Stands in for SupabaseGuard.
    app.use((req: any, _res: unknown, next: () => void) => {
      req.user = requestUser;
      next();
    });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    requestUser = undefined;
  });

  it('CurrentUser returns the internal user', async () => {
    requestUser = { sub: 'auth-1', internal: { id: 7 } };
    await request(app.getHttpServer())
      .get('/current-user')
      .expect(200, { id: 7 });
  });

  it('CurrentUser rejects a request without a user', async () => {
    await request(app.getHttpServer()).get('/current-user').expect(401);
  });

  it('OptionalUser allows a request without a user', async () => {
    await request(app.getHttpServer())
      .get('/optional-user')
      .expect(200, { signedIn: false });
  });

  it('OrgId returns the organization checked by the guard', async () => {
    requestUser = { sub: 'auth-1', internal: { id: 7 }, organization: 3 };
    await request(app.getHttpServer()).get('/org-id').expect(200, { orgId: 3 });
  });

  it('OrgId rejects a request the guard did not check', async () => {
    requestUser = { sub: 'auth-1', internal: { id: 7 } };
    await request(app.getHttpServer()).get('/org-id').expect(403);
  });

  it('AccessToken returns the bearer token', async () => {
    await request(app.getHttpServer())
      .get('/access-token')
      .set('Authorization', 'Bearer abc.def')
      .expect(200, { token: 'abc.def' });
  });
});
