import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  Length,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ScheduleReferenceDto } from './schedule-reference.dto';
import { ScheduleItemDto } from './schedule-item.dto';

export class CreateScheduleDto {
  @IsNotEmpty()
  @Length(2, 255)
  title: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsArray()
  @IsObject({ each: true })
  @ValidateNested({ each: true })
  @Type(() => ScheduleItemDto)
  items: ScheduleItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleReferenceDto)
  references?: ScheduleReferenceDto[];
}
