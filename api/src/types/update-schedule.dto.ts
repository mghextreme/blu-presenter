import { IsArray, IsDateString, IsOptional, Length } from 'class-validator';

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
}
