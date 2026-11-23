import { IsBoolean, IsOptional, Length } from 'class-validator';

/**
 * Body for creating (or re-syncing) the auto-generated playlist (Spotify,
 * YouTube) of a schedule. When omitted, the playlist name is derived from the schedule
 * title and date. Both fields only apply when the playlist is created: a
 * re-sync keeps the existing playlist's name and visibility.
 */
export class CreateSchedulePlaylistDto {
  @IsOptional()
  @Length(1, 255)
  name?: string;

  /** Whether the new playlist is public (default: private on Spotify,
   * unlisted on YouTube). */
  @IsOptional()
  @IsBoolean()
  public?: boolean;
}
