import { IsIn, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { SCHEDULE_AUTO_REFERENCE_SOURCES } from 'src/utils/schedule-references';

/**
 * A schedule reference as sent by clients. Only `url` and `name` are
 * client-editable; `source` merely identifies an app-generated reference,
 * whose stored metadata the server keeps (see mergeScheduleReferences).
 */
export class ScheduleReferenceDto {
  @IsString()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  url: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsIn(SCHEDULE_AUTO_REFERENCE_SOURCES)
  source?: (typeof SCHEDULE_AUTO_REFERENCE_SOURCES)[number];
}
