import { IsArray, IsBoolean, IsIn, IsNotEmpty, IsOptional, Length, Min } from 'class-validator';
import { SupportedLanguages } from './supported-languages';

export class AdvancedSearchDto {
  @IsNotEmpty()
  @Length(2, 255)
  query: string;

  @IsIn(SupportedLanguages)
  queryLanguage: string;

  @IsOptional()
  @IsArray()
  @IsNotEmpty({ each: true })
  @IsIn(SupportedLanguages, { each: true })
  languages?: string[];

  @IsOptional()
  @IsArray()
  @Min(1, { each: true })
  organizations?: number[];

  @IsOptional()
  @IsBoolean()
  searchPublicArchive?: boolean;

  @IsOptional()
  @IsBoolean()
  includeBlocks?: boolean;
}
