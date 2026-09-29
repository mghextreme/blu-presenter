import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  Length,
  Min,
} from 'class-validator';
import {
  ORGANIZATION_FEATURES,
  OrganizationFeature,
} from './organization-feature.type';

export class UpdateOrganizationDto {
  @IsInt()
  @Min(1)
  id: number;

  /**
   * Optional so that organizations without a name (e.g. the personal space)
   * can still update other fields (e.g. features) without renaming.
   */
  @IsOptional()
  @IsNotEmpty()
  @Length(2, 255)
  name?: string;

  @IsOptional()
  @IsArray()
  @IsIn(ORGANIZATION_FEATURES as string[], { each: true })
  disabledFeatures?: OrganizationFeature[];
}
