import { IsIn, IsInt, IsNotEmpty, IsObject, Length, Min } from 'class-validator';

export class UpdateThemeDto {
  @IsInt()
  @Min(1)
  id: number;

  @IsNotEmpty()
  @Length(2, 255)
  name: string;

  @IsIn(['lyrics', 'subtitles', 'teleprompter'])
  extends: 'lyrics' | 'subtitles' | 'teleprompter';

  @IsObject()
  config: any;
}
