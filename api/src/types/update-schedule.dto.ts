import { IsArray, IsDateString, IsOptional, Length } from 'class-validator';
import { SongReference } from 'src/entities';

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
  references?: SongReference[];
}
