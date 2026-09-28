import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  Length,
  Max,
  Min,
} from 'class-validator';

export class SearchScheduleDto {
  @IsOptional()
  @Length(2, 255)
  query?: string;

  @IsOptional()
  @IsArray()
  @IsNotEmpty({ each: true })
  @Min(1, { each: true })
  organizations?: number[];

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  itemsPerPage?: number;
}
