import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { User } from './user.entity';
import { Organization } from './organization.entity';
import { OrganizationRoleOptions } from 'src/types';

@Entity({ name: 'organization_invitations' })
export class OrganizationInvitation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Unique('organization_invitations_uniquekey', ['orgId', 'email'])
  orgId: number;

  @Column({ type: 'varchar', length: 255 })
  @Unique('organization_invitations_uniquekey', ['orgId', 'email'])
  email: string;

  @Column()
  inviterId: number;

  @Column({ type: 'varchar', length: 20 })
  role: OrganizationRoleOptions;

  @Column({ type: 'varchar', length: 511 })
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
