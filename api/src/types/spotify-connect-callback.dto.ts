import { IsNotEmpty, IsString } from 'class-validator';

export class SpotifyConnectCallbackDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  state: string;
}
