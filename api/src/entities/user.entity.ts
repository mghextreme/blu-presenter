import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { IUserPlaylistIntegrationData } from 'src/types';
import { Organization } from './organization.entity';
import { OrganizationUser } from './organization-user.entity';
import { OrganizationInvitation } from './organization-invitation.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  authId: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  nickname: string | null;

  @Column({ type: 'varchar', length: 511, nullable: true })
  name: string | null;

  @Column({ type: 'varchar', length: 511, nullable: true })
  email: string | null;

  @Column({ type: 'jsonb', select: false, nullable: true, default: null })
  spotify: IUserPlaylistIntegrationData | null;

  @Column({ type: 'jsonb', select: false, nullable: true, default: null })
  youtube: IUserPlaylistIntegrationData | null;

  @OneToMany(() => OrganizationUser, (orgUser) => orgUser.user)
  organizations: OrganizationUser[];

  @OneToMany(() => Organization, (organization) => organization.owner)
  ownedOrganizations: Organization[];

  /** Invitations this user sent. */
  @OneToMany(
    () => OrganizationInvitation,
    (orgInvitation) => orgInvitation.inviter,
  )
  invitations: OrganizationInvitation[];
}
