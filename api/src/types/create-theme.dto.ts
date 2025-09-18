import { IsIn, IsNotEmpty, IsObject, Length } from 'class-validator';

export class CreateThemeDto {
  @IsNotEmpty()
  @Length(2, 255)
  name: string;

  @IsIn(['lyrics', 'subtitles', 'teleprompter'])
  extends: 'lyrics' | 'subtitles' | 'teleprompter';

  @IsObject()
  config: any;
}
