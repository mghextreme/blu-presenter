import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { BroadcastController } from '../broadcast.controller';
import { BroadcastService } from '../broadcast.service';

describe('BroadcastController', () => {
  let app: INestApplication;
  const broadcastService = {
    setSchedule: jest.fn(),
    setScheduleItem: jest.fn(),
    setSelection: jest.fn(),
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BroadcastController],
      providers: [{ provide: BroadcastService, useValue: broadcastService }],
    }).compile();

    app = module.createNestApplication();
    // Mirror the global pipe registered in main.ts
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    broadcastService.setSchedule.mockReset().mockResolvedValue(undefined);
    broadcastService.setScheduleItem.mockReset().mockResolvedValue(undefined);
    broadcastService.setSelection.mockReset().mockResolvedValue(undefined);
  });

  it('PUT schedule routes to the service with the org header and parsed session id', async () => {
    await request(app.getHttpServer())
      .put('/sessions/7/broadcast/schedule')
      .set('Organization', '3')
      .send({ schedule: [{ id: 1, title: 'Amazing Grace' }] })
      .expect(200);

    // The Organization header arrives as a string, mirroring SessionsController
    expect(broadcastService.setSchedule).toHaveBeenCalledWith('3', 7, [
      { id: 1, title: 'Amazing Grace' },
    ]);
  });

  it('PUT schedule-item routes to the service', async () => {
    await request(app.getHttpServer())
      .put('/sessions/7/broadcast/schedule-item')
      .set('Organization', '3')
      .send({ scheduleItem: { id: 12 } })
      .expect(200);

    expect(broadcastService.setScheduleItem).toHaveBeenCalledWith('3', 7, {
      id: 12,
    });
  });

  it('PUT selection routes to the service', async () => {
    await request(app.getHttpServer())
      .put('/sessions/7/broadcast/selection')
      .set('Organization', '3')
      .send({ selection: { scheduleItem: 0, slide: 1, part: 2 } })
      .expect(200);

    expect(broadcastService.setSelection).toHaveBeenCalledWith('3', 7, {
      scheduleItem: 0,
      slide: 1,
      part: 2,
    });
  });

  it('rejects a non-array schedule payload', async () => {
    await request(app.getHttpServer())
      .put('/sessions/7/broadcast/schedule')
      .set('Organization', '3')
      .send({ schedule: 'nope' })
      .expect(400);

    expect(broadcastService.setSchedule).not.toHaveBeenCalled();
  });

  it('rejects a missing scheduleItem payload', async () => {
    await request(app.getHttpServer())
      .put('/sessions/7/broadcast/schedule-item')
      .set('Organization', '3')
      .send({})
      .expect(400);

    expect(broadcastService.setScheduleItem).not.toHaveBeenCalled();
  });

  it('rejects a non-numeric session id', async () => {
    await request(app.getHttpServer())
      .put('/sessions/abc/broadcast/selection')
      .set('Organization', '3')
      .send({ selection: {} })
      .expect(400);

    expect(broadcastService.setSelection).not.toHaveBeenCalled();
  });
});
