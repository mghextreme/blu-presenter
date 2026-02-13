import { IsArray, IsDateString, IsNotEmpty, IsOptional, Length } from 'class-validator';

export class CreateScheduleDto {
  @IsNotEmpty()
  @Length(2, 255)
  title: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsArray()
  items: any[];
}
