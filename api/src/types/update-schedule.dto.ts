import {
  IsArray,
  IsDateString,
  IsOptional,
  Length,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ScheduleReferenceDto } from './schedule-reference.dto';

export class UpdateScheduleDto {
  @IsOptional()
  @Length(2, 255)
  title?: string;

  @IsOptional()
  @IsDateString()
  date?: string | null;

  @IsOptional()
  @IsArray()
  items?: any[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleReferenceDto)
  references?: ScheduleReferenceDto[];
}
