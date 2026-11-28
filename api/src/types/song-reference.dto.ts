import { IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class SongReferenceDto {
  @IsString()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2048)
  url: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;
}
