import { IsNotEmpty, Min } from 'class-validator';

export class CopyThemeToOrganizationDto {
  @IsNotEmpty()
  @Min(1)
  themeId: number;
  
  @IsNotEmpty()
  @Min(1)
  organizationId: number;
}
