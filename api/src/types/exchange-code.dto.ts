import { IsNotEmpty } from 'class-validator';
import { AuthDto } from './auth.dto';

export class ExchangeCodeDto extends AuthDto {
  @IsNotEmpty()
  code: string;
  
  @IsNotEmpty()
  codeVerifier: string;
}
