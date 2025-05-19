import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';
import { Organization } from './organization.entity';

@Entity({ name: 'organization_invitations' })
export class OrganizationInvitation {
  @PrimaryColumn()
  orgId: number;

  @PrimaryColumn()
  email: string;

  @Column()
  inviterId: number;

  @Column()
  role: 'owner' | 'admin' | 'member';

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
