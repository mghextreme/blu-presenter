import { IsArray, IsBoolean, IsIn, IsNotEmpty, Length, Min } from 'class-validator';
import { SupportedLanguages } from './supported-languages';

export class AdvancedSearchDto {
  @IsNotEmpty()
  @Length(2, 255)
  query: string;

  @IsArray()
  @IsNotEmpty({ each: true })
  @IsIn(SupportedLanguages, { each: true })
  languages?: string[];

  @IsArray()
  @Min(1, { each: true })
  organizations?: number[];

  @IsBoolean()
  searchPublicArchive?: boolean;
}
