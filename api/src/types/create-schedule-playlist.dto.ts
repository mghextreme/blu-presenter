import { IsOptional, Length } from 'class-validator';

/**
 * Body for creating (or re-syncing) the auto-generated Spotify playlist of a
 * schedule. When omitted, the playlist name is derived from the schedule
 * title and date.
 */
export class CreateSchedulePlaylistDto {
  @IsOptional()
  @Length(1, 255)
  name?: string;
}
