import { IsNotEmpty } from 'class-validator';

export class TokenRefreshDto {
  @IsNotEmpty()
  refreshToken: string;
}
