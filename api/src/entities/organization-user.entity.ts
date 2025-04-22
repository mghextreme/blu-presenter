import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';
import { Organization } from './organization.entity';

@Entity({ name: 'organization_users' })
export class OrganizationUser {
  @PrimaryColumn()
  orgId: number;

  @PrimaryColumn()
  userId: number;

  @ManyToOne(() => Organization, (organization) => organization.users, {
    createForeignKeyConstraints: true,
  })
  @JoinColumn({ name: 'orgId' })
  organization: Organization;

  @ManyToOne(() => User, (user) => user.organizations, {
    createForeignKeyConstraints: true,
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  role: 'owner' | 'admin' | 'member';
}
