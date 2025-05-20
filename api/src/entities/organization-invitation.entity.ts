import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Organization } from './organization.entity';
import { OrganizationRoleOptions } from 'src/types';

@Entity({ name: 'organization_invitations' })
export class OrganizationInvitation {
  @PrimaryColumn()
  id: number;

  @Column()
  @Unique('organization_invitations_uniquekey', ['orgId', 'email'])
  orgId: number;

  @Column()
  @Unique('organization_invitations_uniquekey', ['orgId', 'email'])
  email: string;

  @Column()
  inviterId: number;

  @Column()
  role: OrganizationRoleOptions;

  @Column()
  secret: string;

  @ManyToOne(() => Organization, (organization) => organization.invitations, {
    createForeignKeyConstraints: true,
  })
  @JoinColumn({ name: 'orgId' })
  organization: Organization;

  @ManyToOne(() => User, (user) => user.invitations, {
    createForeignKeyConstraints: true,
  })
  @JoinColumn({ name: 'inviterId' })
  inviter: User;
}
