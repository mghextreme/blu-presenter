import { IsNotEmpty, Min } from 'class-validator';

export class CopySongToOrganizationDto {
  @IsNotEmpty()
  @Min(1)
  songId: number;
  
  @IsNotEmpty()
  @Min(1)
  organizationId: number;
}
