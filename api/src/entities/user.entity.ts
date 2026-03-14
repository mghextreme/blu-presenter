import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Organization } from './organization.entity';
import { OrganizationUser } from './organization-user.entity';
import { OrganizationInvitation } from './organization-invitation.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  authId: string;

  @Column()
  nickname: string;

  @Column()
  name: string;

  @Column()
  email: string;

  @OneToMany(() => OrganizationUser, (orgUser) => orgUser.user)
  organizations: OrganizationUser[];

  @OneToMany(() => Organization, (organization) => organization.owner)
  ownedOrganizations: User;

  @OneToMany(
    () => OrganizationInvitation,
    (orgInvitation) => orgInvitation.organization,
    {
      createForeignKeyConstraints: true,
    },
  )
  invitations: OrganizationInvitation[];
}
