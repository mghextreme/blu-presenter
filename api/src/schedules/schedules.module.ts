import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Schedule, Song } from '../entities';
import { SchedulesController } from './schedules.controller';
import { SchedulesService } from './schedules.service';

@Module({
  imports: [TypeOrmModule.forFeature([Schedule, Song])],
  controllers: [SchedulesController],
  providers: [SchedulesService],
})
export class SchedulesModule {}
