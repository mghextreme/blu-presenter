import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  Unique,
} from 'typeorm';
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

  @Column({ type: 'varchar' })
  role: OrganizationRoleOptions;

  @Column()
  secret: string;

  @ManyToOne('Organization', 'invitations', {
    createForeignKeyConstraints: true,
  })
  @JoinColumn({ name: 'orgId' })
  organization: any;

  @ManyToOne('User', 'invitations', {
    createForeignKeyConstraints: true,
  })
  @JoinColumn({ name: 'inviterId' })
  inviter: any;
}
