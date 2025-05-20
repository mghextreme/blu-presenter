import { IsNotEmpty, Length } from 'class-validator';

export class CreateOrganizationDto {
  @IsNotEmpty()
  @Length(2, 255)
  name: string;
}
