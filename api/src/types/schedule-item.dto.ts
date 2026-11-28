import { IsIn, IsInt, IsOptional, IsString, ValidateIf } from 'class-validator';

export const SCHEDULE_ITEM_TYPES = ['song', 'text', 'comment'] as const;

/** A schedule item as stored; song contents are resolved from the song on read. */
export class ScheduleItemDto {
  @IsIn(SCHEDULE_ITEM_TYPES)
  type: (typeof SCHEDULE_ITEM_TYPES)[number];

  /** The song id. */
  @ValidateIf((item: ScheduleItemDto) => item.type === 'song')
  @IsInt()
  id?: number;

  @IsOptional()
  @IsString()
  secret?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  artist?: string;

  @IsOptional()
  @IsString()
  subtitle?: string;
}
