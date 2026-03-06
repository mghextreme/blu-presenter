export class UserIdentityDto {
  identityId: string;
  provider: string;
  email?: string;
  createdAt?: string;
}

export class UserIdentitiesResponseDto {
  identities: UserIdentityDto[];
  hasPassword: boolean;
}
