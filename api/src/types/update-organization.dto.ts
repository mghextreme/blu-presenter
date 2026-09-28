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

  @IsNotEmpty()
  @Length(2, 255)
  name: string;

  @IsOptional()
  @IsArray()
  @IsIn(ORGANIZATION_FEATURES as string[], { each: true })
  disabledFeatures?: OrganizationFeature[];
}
