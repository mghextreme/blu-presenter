import { IsArray, IsBoolean, IsIn, IsInt, IsNotEmpty, IsOptional, Length, Max, Min } from 'class-validator';
import { SupportedLanguages } from './supported-languages';

export class SearchSongDto {
  @IsOptional()
  @Length(2, 255)
  query?: string;

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

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  itemsPerPage?: number;
}
