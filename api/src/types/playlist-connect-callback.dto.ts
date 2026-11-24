import { IsNotEmpty, IsString } from 'class-validator';

/** Authorization code relayed by the app after a playlist integration's
 * OAuth consent screen redirects back to it. */
export class PlaylistConnectCallbackDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  state: string;
}
