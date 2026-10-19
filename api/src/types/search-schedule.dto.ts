import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  Length,
  Matches,
  Max,
  Min,
} from 'class-validator';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export class SearchScheduleDto {
  @IsOptional()
  @Length(1, 255)
  query?: string;

  @IsOptional()
  @Matches(DATE_PATTERN, {
    message: 'dateFrom must be a date in YYYY-MM-DD format',
  })
  dateFrom?: string;

  @IsOptional()
  @Matches(DATE_PATTERN, {
    message: 'dateTo must be a date in YYYY-MM-DD format',
  })
  dateTo?: string;

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
