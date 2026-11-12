import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  Length,
} from 'class-validator';
import { SongReference } from 'src/entities';

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
  references?: SongReference[];
}
