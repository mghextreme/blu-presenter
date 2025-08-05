import { IsNotEmpty, Min } from 'class-validator';

export class TransferOrganizationDto {
  @IsNotEmpty()
  @Min(1)
  userId: number;
}
