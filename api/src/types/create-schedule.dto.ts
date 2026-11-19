import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  Length,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ScheduleReferenceDto } from './schedule-reference.dto';

export class CreateScheduleDto {
  @IsNotEmpty()
  @Length(2, 255)
  title: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsArray()
  items: any[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleReferenceDto)
  references?: ScheduleReferenceDto[];
}
